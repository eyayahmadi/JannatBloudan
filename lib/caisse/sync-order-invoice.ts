import type { SupabaseClient } from "@supabase/supabase-js"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import {
  recomputeTotalsFromSubtotal,
  round2,
  sumActiveSubtotal,
  type InvoiceItemRow,
} from "@/lib/caisse/recalc-invoice"

/**
 * Service unique de synchronisation facture ⇄ lignes de commande.
 * -----------------------------------------------------------------
 * `table_session` + `invoices`/`invoice_items` = source de vérité de la
 * facturation. Tout changement sur un `order_item` (refus, perte, annulation,
 * remplacement, avancement, quantité) DOIT passer par `syncOrderInvoice` afin
 * que la facture liée et ses totaux restent cohérents.
 *
 * Règles appliquées :
 *  - cancelled / refused / replaced  → ligne facture non facturable (cancelled)
 *  - waste                           → ligne facture en perte (waste)
 *  - new/accepted/preparing/ready/served → ligne facturable, statut reflété
 *  - les lignes `paid` ou `offered` (hospitalité) ne sont JAMAIS modifiées
 *  - une facture déjà payée/remboursée n'est pas modifiée silencieusement :
 *    on pose `needs_correction = true` et on journalise (flux avoir/remboursement)
 *  - pas de doublon : 1 order_item ↔ 1 invoice_item (clé order_item_id)
 *  - audit systématique avec ancien/nouveau total + raison
 */

const TVA_RATE_DEFAULT = 0.19

export type SyncOrderInvoiceReason =
  | "order_created"
  | "item_added"
  | "item_advance"
  | "item_accept"
  | "item_refuse"
  | "item_waste"
  | "item_replace"
  | "item_cancel"
  | "quantity_change"
  | "bulk_refuse"
  | "manual"

export type SyncOrderInvoiceInput = {
  orderId: string
  reason: SyncOrderInvoiceReason
  actorId?: string | null
  actorEmail?: string | null
  metadata?: Record<string, unknown>
}

export type SyncOrderInvoiceStatus =
  | "created"
  | "synced"
  | "noop"
  | "skipped_no_order"
  | "skipped_no_billable"
  | "locked_paid"
  | "locked_cancelled"

export type SyncOrderInvoiceResult = {
  ok: boolean
  status: SyncOrderInvoiceStatus
  invoiceId: string | null
  oldTotal: number | null
  newTotal: number | null
  correctionRequired: boolean
  message?: string
}

type OrderItemRow = {
  id: string
  product_id: string | null
  product_name: string
  product_name_ar: string | null
  quantity: number
  unit_price: number
  subtotal: number | null
  station: string | null
  station_status: string | null
  special_instructions: string | null
  refusal_reason: string | null
  refusal_note: string | null
}

type InvoiceLineRow = {
  id: string
  invoice_id: string
  order_item_id: string | null
  product_id: string | null
  product_name: string
  product_name_ar: string | null
  quantity: number
  unit_price: number
  subtotal: number | null
  notes: string | null
  station: string | null
  line_status: string | null
  sync_locked?: boolean | null
}

/** Statut de facture interdisant toute modification automatique des lignes. */
const LOCKED_INVOICE_STATUSES = new Set(["paid", "refunded"])
/** line_status de ligne facture qu'on ne réécrit jamais automatiquement. */
const PROTECTED_LINE_STATUSES = new Set(["paid", "offered"])

/**
 * Traduit le station_status d'un order_item en line_status de facture.
 * Note : refused/replaced/cancelled sont tous mappés sur 'cancelled' afin de
 * rester compatibles avec les consommateurs existants (vues SQL de revenu,
 * `sumActiveSubtotal`) qui ne connaissent que cancelled/waste. Le motif réel
 * est conservé dans `cancel_reason`.
 */
function lineStatusForStation(stationStatus: string | null | undefined): {
  line_status: string
  billable: boolean
} {
  switch (String(stationStatus ?? "").toLowerCase()) {
    case "waste":
      return { line_status: "waste", billable: false }
    case "refused":
    case "replaced":
    case "cancelled":
      return { line_status: "cancelled", billable: false }
    case "served":
      return { line_status: "served", billable: true }
    case "ready":
      return { line_status: "ready", billable: true }
    case "preparing":
      return { line_status: "preparing", billable: true }
    case "accepted":
      return { line_status: "sent_station", billable: true }
    case "new":
    default:
      return { line_status: "ordered", billable: true }
  }
}

function generateInvoiceId() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const seq = String(d.getTime()).slice(-6)
  return `INV-${y}${m}${day}-${seq}`
}

function buildNote(item: OrderItemRow): string {
  const parts: string[] = []
  const note = item.special_instructions?.trim()
  if (note) parts.push(note)
  if (item.refusal_reason) {
    parts.push(`refus:${item.refusal_reason}`)
  }
  parts.push(`oid:${item.id}`)
  return parts.join(" — ")
}

/** Recalcule le total de la session = somme des factures non annulées. */
async function recomputeSessionTotal(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<void> {
  const { data: invs } = await supabase
    .from("invoices")
    .select("total, status")
    .eq("session_id", sessionId)

  const total = round2(
    (invs ?? []).reduce((sum, inv) => {
      const status = String((inv as { status?: string | null }).status ?? "").toLowerCase()
      if (status === "cancelled") return sum
      return sum + Number((inv as { total?: number | null }).total ?? 0)
    }, 0),
  )

  // NB: `table_sessions` n'a pas de colonne updated_at — ne pas l'inclure.
  await supabase
    .from("table_sessions")
    .update({ total })
    .eq("id", sessionId)
}

export async function syncOrderInvoice(
  supabase: SupabaseClient,
  input: SyncOrderInvoiceInput,
): Promise<SyncOrderInvoiceResult> {
  const { orderId, reason } = input

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, session_id, table_number, customer_name")
    .eq("id", orderId)
    .maybeSingle()

  if (!order) {
    return {
      ok: false,
      status: "skipped_no_order",
      invoiceId: null,
      oldTotal: null,
      newTotal: null,
      correctionRequired: false,
      message: "Commande introuvable",
    }
  }

  const sessionId = (order as { session_id?: string | null }).session_id
    ? String((order as { session_id?: string | null }).session_id)
    : null

  const { data: rawItems } = await supabase
    .from("order_items")
    .select(
      "id, product_id, product_name, product_name_ar, quantity, unit_price, subtotal, station, station_status, special_instructions, refusal_reason, refusal_note",
    )
    .eq("order_id", orderId)

  const items: OrderItemRow[] = (rawItems ?? []).map((r) => ({
    id: String(r.id),
    product_id: r.product_id ? String(r.product_id) : null,
    product_name: String(r.product_name ?? ""),
    product_name_ar: r.product_name_ar ? String(r.product_name_ar) : null,
    quantity: Number(r.quantity) || 0,
    unit_price: Number(r.unit_price) || 0,
    subtotal: r.subtotal == null ? null : Number(r.subtotal),
    station: r.station ? String(r.station) : null,
    station_status: r.station_status ? String(r.station_status) : null,
    special_instructions: r.special_instructions ? String(r.special_instructions) : null,
    refusal_reason: r.refusal_reason ? String(r.refusal_reason) : null,
    refusal_note: r.refusal_note ? String(r.refusal_note) : null,
  }))

  const billableItems = items.filter(
    (it) => lineStatusForStation(it.station_status).billable,
  )

  // Facture existante liée à la commande.
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select(
      "id, status, payment_stage, discount_amount, tva_rate, gross_before_discount, total, billing_type",
    )
    .eq("order_id", orderId)
    .maybeSingle()

  // --- CAS 1 : aucune facture encore créée --------------------------------
  if (!existingInvoice) {
    if (billableItems.length === 0) {
      return {
        ok: true,
        status: "skipped_no_billable",
        invoiceId: null,
        oldTotal: null,
        newTotal: null,
        correctionRequired: false,
      }
    }
    return createInvoiceFromOrder(supabase, {
      order,
      sessionId,
      items,
      reason,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      metadata: input.metadata,
    })
  }

  const invoiceId = String(existingInvoice.id)
  const invStatus = String(existingInvoice.status ?? "").toLowerCase()
  const oldTotal = Number(existingInvoice.total ?? 0)

  // --- CAS 2 : facture annulée — on ne touche plus rien --------------------
  if (invStatus === "cancelled") {
    return {
      ok: true,
      status: "locked_cancelled",
      invoiceId,
      oldTotal,
      newTotal: oldTotal,
      correctionRequired: false,
      message: "Facture annulée — synchronisation ignorée",
    }
  }

  // --- CAS 3 : facture payée/remboursée — flux correction/remboursement ----
  if (LOCKED_INVOICE_STATUSES.has(invStatus)) {
    const tvaRate = Number(existingInvoice.tva_rate ?? TVA_RATE_DEFAULT)
    const wouldBeSubtotal = round2(
      billableItems.reduce((s, it) => s + it.unit_price * it.quantity, 0),
    )
    const prevDisc = Number(existingInvoice.discount_amount ?? 0)
    const cappedDisc = Math.min(Number.isFinite(prevDisc) ? prevDisc : 0, wouldBeSubtotal)
    const projected = recomputeTotalsFromSubtotal(wouldBeSubtotal, cappedDisc, tvaRate)
    const diverged = Math.abs(projected.total - oldTotal) > 0.001

    if (diverged) {
      await supabase
        .from("invoices")
        .update({
          needs_correction: true,
          correction_reason: `order_item modifié (${reason}) après paiement — écart ${round2(
            projected.total - oldTotal,
          )} €`,
          correction_flagged_at: new Date().toISOString(),
        })
        .eq("id", invoiceId)

      await insertCaisseAudit(supabase, {
        userId: input.actorId ?? null,
        userEmail: input.actorEmail ?? null,
        action: "invoice_sync_blocked_paid",
        entityType: "invoices",
        entityId: invoiceId,
        oldValues: { total: oldTotal, status: invStatus },
        newValues: { projected_total: projected.total, needs_correction: true },
        metadata: { order_id: orderId, reason, ...input.metadata },
      })
    }

    return {
      ok: true,
      status: "locked_paid",
      invoiceId,
      oldTotal,
      newTotal: oldTotal,
      correctionRequired: diverged,
      message: diverged
        ? "Facture déjà payée — correction/remboursement requis"
        : "Facture payée, aucun écart",
    }
  }

  // --- CAS 4 : facture modifiable (draft / validated / unpaid) -------------
  return reconcileInvoice(supabase, {
    invoiceId,
    invoice: existingInvoice,
    sessionId,
    items,
    reason,
    oldTotal,
    actorId: input.actorId ?? null,
    actorEmail: input.actorEmail ?? null,
    metadata: input.metadata,
  })
}

type OrderHeader = {
  id: string | number
  order_number?: string | null
  table_number?: number | null
  customer_name?: string | null
}

async function createInvoiceFromOrder(
  supabase: SupabaseClient,
  args: {
    order: OrderHeader
    sessionId: string | null
    items: OrderItemRow[]
    reason: SyncOrderInvoiceReason
    actorId: string | null
    actorEmail: string | null
    metadata?: Record<string, unknown>
  },
): Promise<SyncOrderInvoiceResult> {
  const { order, sessionId, items } = args
  const orderId = String(order.id)

  const activeSubtotal = round2(
    items
      .filter((it) => lineStatusForStation(it.station_status).billable)
      .reduce((s, it) => s + it.unit_price * it.quantity, 0),
  )
  const { tva_amount, total } = recomputeTotalsFromSubtotal(activeSubtotal, 0, TVA_RATE_DEFAULT)
  const invoiceId = generateInvoiceId()

  const { error: invErr } = await supabase.from("invoices").insert({
    id: invoiceId,
    order_id: orderId,
    session_id: sessionId,
    customer_name:
      order.customer_name ??
      (order.table_number != null ? `Table ${order.table_number}` : "Client"),
    subtotal: activeSubtotal,
    tva_rate: TVA_RATE_DEFAULT,
    tva_amount,
    discount_amount: 0,
    total,
    gross_before_discount: activeSubtotal,
    status: "draft",
    payment_stage: "open",
    billing_type: "normal",
  })

  if (invErr) {
    console.error("[sync-order-invoice create]", invErr.message)
    return {
      ok: false,
      status: "noop",
      invoiceId: null,
      oldTotal: null,
      newTotal: null,
      correctionRequired: false,
      message: invErr.message,
    }
  }

  const rows = items.map((it) => {
    const { line_status } = lineStatusForStation(it.station_status)
    const billable = lineStatusForStation(it.station_status).billable
    return {
      invoice_id: invoiceId,
      order_item_id: it.id,
      product_id: it.product_id,
      product_name: it.product_name,
      product_name_ar: it.product_name_ar,
      quantity: it.quantity,
      unit_price: it.unit_price,
      subtotal: round2(it.unit_price * it.quantity),
      notes: buildNote(it),
      station: it.station,
      line_status,
      cancel_reason: billable ? null : it.refusal_reason ?? it.station_status,
      waste_loss: line_status === "waste",
      synced_at: new Date().toISOString(),
    }
  })

  if (rows.length > 0) {
    const { error: itemsErr } = await supabase.from("invoice_items").insert(rows)
    if (itemsErr) {
      console.error("[sync-order-invoice create items]", itemsErr.message)
      await supabase.from("invoices").delete().eq("id", invoiceId)
      return {
        ok: false,
        status: "noop",
        invoiceId: null,
        oldTotal: null,
        newTotal: null,
        correctionRequired: false,
        message: itemsErr.message,
      }
    }
  }

  if (sessionId) await recomputeSessionTotal(supabase, sessionId)

  await insertCaisseAudit(supabase, {
    userId: args.actorId,
    userEmail: args.actorEmail,
    action: "invoice_draft_from_order",
    entityType: "invoices",
    entityId: invoiceId,
    oldValues: null,
    newValues: { order_id: orderId, session_id: sessionId, item_count: rows.length, total },
    metadata: { source: "sync_order_invoice", reason: args.reason, ...args.metadata },
  })

  return {
    ok: true,
    status: "created",
    invoiceId,
    oldTotal: null,
    newTotal: total,
    correctionRequired: false,
  }
}

async function reconcileInvoice(
  supabase: SupabaseClient,
  args: {
    invoiceId: string
    invoice: Record<string, unknown>
    sessionId: string | null
    items: OrderItemRow[]
    reason: SyncOrderInvoiceReason
    oldTotal: number
    actorId: string | null
    actorEmail: string | null
    metadata?: Record<string, unknown>
  },
): Promise<SyncOrderInvoiceResult> {
  const { invoiceId, invoice, sessionId, items, reason, oldTotal } = args
  const now = new Date().toISOString()

  const { data: rawLines } = await supabase
    .from("invoice_items")
    .select(
      "id, invoice_id, order_item_id, product_id, product_name, product_name_ar, quantity, unit_price, subtotal, notes, station, line_status, sync_locked",
    )
    .eq("invoice_id", invoiceId)

  const lines: InvoiceLineRow[] = (rawLines ?? []).map((r) => ({
    id: String(r.id),
    invoice_id: String(r.invoice_id),
    order_item_id: r.order_item_id ? String(r.order_item_id) : null,
    product_id: r.product_id ? String(r.product_id) : null,
    product_name: String(r.product_name ?? ""),
    product_name_ar: r.product_name_ar ? String(r.product_name_ar) : null,
    quantity: Number(r.quantity) || 0,
    unit_price: Number(r.unit_price) || 0,
    subtotal: r.subtotal == null ? null : Number(r.subtotal),
    notes: r.notes ? String(r.notes) : null,
    station: r.station ? String(r.station) : null,
    line_status: r.line_status ? String(r.line_status) : null,
    sync_locked: Boolean(r.sync_locked),
  }))

  /** Index par order_item_id, avec repli sur le motif notes `oid:`. */
  const lineByOrderItem = new Map<string, InvoiceLineRow>()
  for (const ln of lines) {
    let key = ln.order_item_id
    if (!key && ln.notes) {
      const m = ln.notes.match(/oid:([0-9a-fA-F-]{36})/)
      if (m) key = m[1]
    }
    if (key && !lineByOrderItem.has(key)) lineByOrderItem.set(key, ln)
  }

  const seenLineIds = new Set<string>()
  let changes = 0

  // 1) Upsert ligne par order_item courant.
  for (const it of items) {
    const { line_status, billable } = lineStatusForStation(it.station_status)
    const subtotal = round2(it.unit_price * it.quantity)
    const existing = lineByOrderItem.get(it.id)

    if (existing) {
      seenLineIds.add(existing.id)
      const protectedLine =
        PROTECTED_LINE_STATUSES.has(String(existing.line_status ?? "").toLowerCase()) ||
        existing.sync_locked === true
      if (protectedLine) continue

      const needsUpdate =
        existing.quantity !== it.quantity ||
        Math.abs(existing.unit_price - it.unit_price) > 0.001 ||
        Math.abs(Number(existing.subtotal ?? 0) - subtotal) > 0.001 ||
        String(existing.line_status ?? "") !== line_status ||
        existing.product_name !== it.product_name ||
        existing.order_item_id !== it.id

      if (needsUpdate) {
        await supabase
          .from("invoice_items")
          .update({
            order_item_id: it.id,
            product_id: it.product_id,
            product_name: it.product_name,
            product_name_ar: it.product_name_ar,
            quantity: it.quantity,
            unit_price: it.unit_price,
            subtotal,
            station: it.station,
            line_status,
            cancel_reason: billable ? null : it.refusal_reason ?? it.station_status,
            cancelled_at: billable ? null : now,
            waste_loss: line_status === "waste",
            notes: buildNote(it),
            synced_at: now,
          })
          .eq("id", existing.id)
        changes += 1
      }
    } else {
      // Nouvelle ligne (ex. remplacement ajouté après création facture).
      await supabase.from("invoice_items").insert({
        invoice_id: invoiceId,
        order_item_id: it.id,
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        subtotal,
        station: it.station,
        line_status,
        cancel_reason: billable ? null : it.refusal_reason ?? it.station_status,
        cancelled_at: billable ? null : now,
        waste_loss: line_status === "waste",
        notes: buildNote(it),
        synced_at: now,
      })
      changes += 1
    }
  }

  // 2) Lignes facture orphelines (order_item supprimé) → annulées.
  for (const ln of lines) {
    if (seenLineIds.has(ln.id)) continue
    const status = String(ln.line_status ?? "").toLowerCase()
    if (PROTECTED_LINE_STATUSES.has(status) || ln.sync_locked === true) continue
    if (status === "cancelled" || status === "waste") continue
    // Seules les lignes rattachées à un order_item (disparu) sont annulées ;
    // les lignes manuelles sans lien sont préservées.
    const hasLink = ln.order_item_id || (ln.notes && /oid:[0-9a-fA-F-]{36}/.test(ln.notes))
    if (!hasLink) continue
    await supabase
      .from("invoice_items")
      .update({
        line_status: "cancelled",
        cancel_reason: "order_item supprimé",
        cancelled_at: now,
        synced_at: now,
      })
      .eq("id", ln.id)
    changes += 1
  }

  // 3) Recalcul des totaux facture.
  const { data: freshLines } = await supabase
    .from("invoice_items")
    .select("subtotal, line_status")
    .eq("invoice_id", invoiceId)

  const activeHt = sumActiveSubtotal((freshLines ?? []) as InvoiceItemRow[])
  const prevDisc = Number((invoice as { discount_amount?: unknown }).discount_amount ?? 0)
  const cappedDisc = Math.min(Number.isFinite(prevDisc) ? prevDisc : 0, activeHt)
  const tvaRate = Number((invoice as { tva_rate?: unknown }).tva_rate ?? TVA_RATE_DEFAULT)
  const totals = recomputeTotalsFromSubtotal(activeHt, cappedDisc, tvaRate)

  const { error: upErr } = await supabase
    .from("invoices")
    .update({
      subtotal: totals.subtotalHt,
      discount_amount: totals.discount_amount,
      tva_amount: totals.tva_amount,
      total: totals.total,
      gross_before_discount: totals.subtotalHt,
      updated_at: now,
    })
    .eq("id", invoiceId)

  if (upErr) {
    return {
      ok: false,
      status: "noop",
      invoiceId,
      oldTotal,
      newTotal: oldTotal,
      correctionRequired: false,
      message: upErr.message,
    }
  }

  if (sessionId) await recomputeSessionTotal(supabase, sessionId)

  if (changes === 0 && Math.abs(totals.total - oldTotal) < 0.001) {
    return {
      ok: true,
      status: "noop",
      invoiceId,
      oldTotal,
      newTotal: totals.total,
      correctionRequired: false,
    }
  }

  await insertCaisseAudit(supabase, {
    userId: args.actorId,
    userEmail: args.actorEmail,
    action: "invoice_synced_from_order_item",
    entityType: "invoices",
    entityId: invoiceId,
    oldValues: { total: oldTotal },
    newValues: { total: totals.total, line_changes: changes },
    metadata: { reason, delta: round2(totals.total - oldTotal), ...args.metadata },
  })

  return {
    ok: true,
    status: "synced",
    invoiceId,
    oldTotal,
    newTotal: totals.total,
    correctionRequired: false,
  }
}
