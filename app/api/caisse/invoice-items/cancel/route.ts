import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { recomputeTotalsFromSubtotal, sumActiveSubtotal, type InvoiceItemRow } from "@/lib/caisse/recalc-invoice"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Annulation partielle d’une ligne (annulée vs gaspillée après préparation). */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const itemId = typeof body.invoice_item_id === "string" ? body.invoice_item_id.trim() : ""
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""
  const outcome = String(body.outcome ?? "cancel").toLowerCase() === "waste" ? "waste" : "cancelled"

  if (!itemId || reason.length < 3) {
    return NextResponse.json({ error: "invoice_item_id et reason (≥3) requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  const { data: row, error: fetchErr } = await supabase.from("invoice_items").select("*").eq("id", itemId).maybeSingle()
  if (fetchErr || !row) return NextResponse.json({ error: "Ligne introuvable" }, { status: 404 })

  const invoiceId = String((row as { invoice_id?: string }).invoice_id ?? "")
  if (!invoiceId) return NextResponse.json({ error: "Facture invalide" }, { status: 400 })

  const { data: inv } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle()
  if (!inv) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

  const st = String((inv as { status?: string }).status ?? "").toLowerCase()
  if (st === "cancelled" || st === "refunded") {
    return NextResponse.json({ error: "Facture annulée" }, { status: 409 })
  }
  if (st === "paid") return NextResponse.json({ error: "Facture déjà soldée — opération réservée remboursement" }, { status: 409 })

  const prevLineStatus = String((row as { line_status?: string }).line_status ?? "")
  const oldItem = row as Record<string, unknown>

  const now = new Date().toISOString()
  const patch = {
    line_status: outcome,
    cancel_reason: reason,
    cancelled_at: now,
    waste_loss: outcome === "waste",
  }

  const { data: updatedItem, error: upLin } = await supabase
    .from("invoice_items")
    .update(patch)
    .eq("id", itemId)
    .select("*")
    .maybeSingle()

  if (upLin || !updatedItem) return NextResponse.json({ error: upLin?.message ?? "Erreur ligne" }, { status: 500 })

  const { data: allItems } = await supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId)
  const rows = (allItems ?? []) as InvoiceItemRow[]
  const activeHt = sumActiveSubtotal(rows)
  const prevDisc = Number((inv as { discount_amount?: unknown }).discount_amount ?? 0)
  const cappedDisc = Math.min(Number.isFinite(prevDisc) ? prevDisc : 0, activeHt)
  const tvaRate = Number((inv as { tva_rate?: unknown }).tva_rate ?? 0.19)
  const totals = recomputeTotalsFromSubtotal(activeHt, cappedDisc, tvaRate)

  const oldInv = inv as Record<string, unknown>
  const { data: updatedInv, error: upInvErr } = await supabase
    .from("invoices")
    .update({
      subtotal: totals.subtotalHt,
      discount_amount: totals.discount_amount,
      tva_amount: totals.tva_amount,
      total: totals.total,
      updated_at: now,
    })
    .eq("id", invoiceId)
    .select("*")
    .maybeSingle()

  if (upInvErr || !updatedInv) return NextResponse.json({ error: upInvErr?.message ?? "Erreur facture" }, { status: 500 })

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: outcome === "waste" ? "invoice_line_waste" : "invoice_line_cancelled",
    entityType: "invoice_items",
    entityId: itemId,
    oldValues: { ...oldItem, invoice_status: prevLineStatus },
    newValues: updatedItem as Record<string, unknown>,
    metadata: { invoice_id: invoiceId, outcome, prev_line_status: prevLineStatus, reason },
  })

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "invoice_recalc_after_partial_cancel",
    entityType: "invoices",
    entityId: invoiceId,
    oldValues: oldInv,
    newValues: updatedInv as Record<string, unknown>,
    metadata: { invoice_item_id: itemId },
  })

  return NextResponse.json({ ok: true, invoice_item: updatedItem, invoice: updatedInv })
}
