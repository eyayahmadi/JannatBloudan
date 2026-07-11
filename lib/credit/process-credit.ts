import type { SupabaseClient } from "@supabase/supabase-js"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { friendlyPaymentError } from "@/lib/caisse/friendly-payment-error"
import { resolveStaffUserId } from "@/lib/caisse/resolve-staff-user-id"
import {
  CREDIT_PAYMENT_METHODS,
  CREDIT_REASONS,
  deriveCreditState,
  round2,
  type CreditPaymentMethod,
  type CreditReason,
} from "@/lib/credit/types"

const VALID_METHODS = new Set(CREDIT_PAYMENT_METHODS as readonly string[])
const VALID_REASONS = new Set(CREDIT_REASONS as readonly string[])

type Ctx = { userId: string; userEmail: string | null; role: string }

export type MarkAsCreditInput = {
  invoiceId: string
  /** Acompte versé immédiatement (cash/card/...). 0 = "fully unpaid". */
  partialPayments?: Array<{ method: CreditPaymentMethod; amount: number }>
  customerId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  reason: CreditReason
  note?: string | null
  /** ISO date string (YYYY-MM-DD or full). Si vide → +14 jours. */
  dueAt?: string | null
}

export type CreditOperationResult =
  | { ok: true; invoice: Record<string, unknown>; payment_state: string; remaining: number }
  | { ok: false; status: number; error: string }

const DEFAULT_DUE_DAYS = 14

function normalizeDueAt(raw: string | null | undefined): string {
  if (!raw) {
    const d = new Date()
    d.setDate(d.getDate() + DEFAULT_DUE_DAYS)
    return d.toISOString()
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T23:59:59.000Z`).toISOString()
  }
  const d = new Date(raw)
  return Number.isNaN(d.getTime())
    ? new Date(Date.now() + DEFAULT_DUE_DAYS * 86_400_000).toISOString()
    : d.toISOString()
}

/**
 * Marque une facture comme crédit (kridi). Optionnellement enregistre un
 * acompte initial. Mets à jour invoices.payment_state + credit_* et insère
 * les éventuels payments + un row dans client_credit_payments.
 */
export async function markInvoiceAsCredit(
  supabase: SupabaseClient,
  ctx: Ctx,
  input: MarkAsCreditInput,
): Promise<CreditOperationResult> {
  if (!input.invoiceId) return { ok: false, status: 400, error: "invoice_id requis" }
  if (!VALID_REASONS.has(input.reason)) {
    return { ok: false, status: 400, error: "reason invalide" }
  }

  const parts = (input.partialPayments ?? []).filter(
    (p) => VALID_METHODS.has(String(p.method).toLowerCase()) && Number(p.amount) > 0,
  )

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", input.invoiceId)
    .maybeSingle()

  if (invErr || !inv) {
    return { ok: false, status: 404, error: invErr?.message ?? "Facture introuvable" }
  }

  const status = String((inv as { status?: string }).status ?? "").toLowerCase()
  if (status === "cancelled" || status === "refunded") {
    return { ok: false, status: 409, error: "Facture annulée / remboursée" }
  }
  if (status === "paid") {
    return { ok: false, status: 409, error: "Facture déjà payée — utilisez un remboursement" }
  }

  const total = round2(Number((inv as { total?: unknown }).total ?? 0))
  const partialSum = round2(parts.reduce((s, p) => s + Number(p.amount), 0))
  if (partialSum > total + 0.02) {
    return { ok: false, status: 400, error: `Acompte (${partialSum}) > total (${total})` }
  }

  if (input.customerId) {
    const { data: limit } = await supabase
      .from("client_credit_limits")
      .select("credit_limit, blocked")
      .eq("client_id", input.customerId)
      .maybeSingle()

    if (limit && (limit as { blocked?: boolean }).blocked) {
      return { ok: false, status: 403, error: "Crédit bloqué pour ce client" }
    }

    const max = Number((limit as { credit_limit?: number } | null)?.credit_limit ?? 0)
    if (max > 0) {
      const { data: existing } = await supabase
        .from("v_client_credit_summary")
        .select("total_remaining")
        .eq("client_id", input.customerId)
        .maybeSingle()
      const currentDebt = Number((existing as { total_remaining?: number } | null)?.total_remaining ?? 0)
      const projected = round2(currentDebt + (total - partialSum))
      if (projected > max) {
        return {
          ok: false,
          status: 409,
          error: `Plafond crédit dépassé (${projected.toFixed(2)} € > ${max.toFixed(2)} €)`,
        }
      }
    }
  }

  const now = new Date().toISOString()
  const dueAt = normalizeDueAt(input.dueAt)
  const staffUserId = await resolveStaffUserId(supabase, ctx.userId, ctx.userEmail)

  for (const p of parts) {
    const { error: payErr } = await supabase.from("payments").insert({
      invoice_id: input.invoiceId,
      session_id: (inv as { session_id?: string | null }).session_id ?? null,
      order_id: (inv as { order_id?: string | null }).order_id ?? null,
      amount: round2(Number(p.amount)),
      currency: "EUR",
      method: p.method,
      status: "succeeded",
      provider: "manual",
      processed_by: staffUserId,
      processed_at: now,
    })
    if (payErr) {
      console.error("[credit] partial payment failed:", payErr)
      return { ok: false, status: 500, error: friendlyPaymentError(payErr.message) }
    }
  }

  const { state, remaining } = deriveCreditState({
    total,
    paid: partialSum,
    dueAt,
    creditMarked: true,
  })

  const oldSnapshot = inv as Record<string, unknown>

  const update: Record<string, unknown> = {
    customer_id: input.customerId ?? (inv as { customer_id?: string | null }).customer_id ?? null,
    customer_name:
      input.customerName ?? (inv as { customer_name?: string | null }).customer_name ?? null,
    customer_email:
      input.customerEmail ?? (inv as { customer_email?: string | null }).customer_email ?? null,
    customer_phone:
      input.customerPhone ?? (inv as { customer_phone?: string | null }).customer_phone ?? null,
    payment_state: state,
    credit_due_at: dueAt,
    credit_paid: partialSum,
    credit_remaining: remaining,
    credit_reason: input.reason,
    credit_note: input.note ?? null,
    credit_recorded_by: staffUserId,
    credit_recorded_at: now,
    status: state === "PAID" ? "paid" : "validated",
    paid_at: state === "PAID" ? now : null,
    payment_method: parts.length === 1 ? parts[0].method : parts.length > 1 ? "split" : null,
    updated_at: now,
  }

  const { data: after, error: upErr } = await supabase
    .from("invoices")
    .update(update)
    .eq("id", input.invoiceId)
    .select("*")
    .maybeSingle()

  if (upErr || !after) {
    return { ok: false, status: 500, error: upErr?.message ?? "MAJ facture" }
  }

  await insertCaisseAudit(supabase, {
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    action: "credit_invoice_created",
    entityType: "invoices",
    entityId: input.invoiceId,
    oldValues: oldSnapshot,
    newValues: after as Record<string, unknown>,
    metadata: {
      role: ctx.role,
      reason: input.reason,
      due_at: dueAt,
      partial_payments: parts,
      remaining,
    },
  })

  return { ok: true, invoice: after as Record<string, unknown>, payment_state: state, remaining }
}

export type RecordCreditPaymentInput = {
  invoiceId: string
  amount: number
  method: CreditPaymentMethod
  note?: string | null
}

/**
 * Encaisse un règlement ultérieur sur une facture crédit. Insère :
 *  - payments (status=succeeded)
 *  - client_credit_payments (journal kridi)
 * Recalcule l'état via recompute_invoice_credit_state().
 */
export async function recordCreditPayment(
  supabase: SupabaseClient,
  ctx: Ctx,
  input: RecordCreditPaymentInput,
): Promise<CreditOperationResult> {
  if (!input.invoiceId) return { ok: false, status: 400, error: "invoice_id requis" }
  if (!VALID_METHODS.has(input.method)) {
    return { ok: false, status: 400, error: "method invalide" }
  }
  const amount = round2(Number(input.amount))
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, status: 400, error: "amount invalide" }
  }

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", input.invoiceId)
    .maybeSingle()

  if (invErr || !inv) {
    return { ok: false, status: 404, error: invErr?.message ?? "Facture introuvable" }
  }

  const total = round2(Number((inv as { total?: unknown }).total ?? 0))
  const paidSoFar = round2(Number((inv as { credit_paid?: unknown }).credit_paid ?? 0))
  const remainingBefore = Math.max(0, round2(total - paidSoFar))
  if (remainingBefore <= 0.02) {
    return { ok: false, status: 409, error: "Facture déjà soldée" }
  }
  if (amount > remainingBefore + 0.02) {
    return {
      ok: false,
      status: 400,
      error: `Montant (${amount}) > restant dû (${remainingBefore})`,
    }
  }

  const now = new Date().toISOString()
  const staffUserId = await resolveStaffUserId(supabase, ctx.userId, ctx.userEmail)

  const { data: payRow, error: payErr } = await supabase
    .from("payments")
    .insert({
      invoice_id: input.invoiceId,
      session_id: (inv as { session_id?: string | null }).session_id ?? null,
      order_id: (inv as { order_id?: string | null }).order_id ?? null,
      amount,
      currency: "EUR",
      method: input.method,
      status: "succeeded",
      provider: "manual",
      processed_by: staffUserId,
      processed_at: now,
      provider_payload: { kind: "credit_recovery" } as Record<string, unknown>,
    })
    .select("id")
    .maybeSingle()

  if (payErr) {
    console.error("[credit] payment insert failed:", payErr)
    return { ok: false, status: 500, error: friendlyPaymentError(payErr.message) }
  }

  const { error: ccpErr } = await supabase.from("client_credit_payments").insert({
    invoice_id: input.invoiceId,
    client_id: (inv as { customer_id?: string | null }).customer_id ?? null,
    amount,
    method: input.method,
    payment_id: (payRow as { id?: string } | null)?.id ?? null,
    note: input.note ?? null,
    recorded_by: ctx.userId,
  })

  if (ccpErr) {
    console.warn("[credit] client_credit_payments insert failed:", ccpErr.message)
  }

  const { data: refreshed } = await supabase
    .rpc("recompute_invoice_credit_state", { p_invoice_id: input.invoiceId })
    .maybeSingle()

  let invoiceAfter: Record<string, unknown> | null = null
  if (refreshed) {
    const { data: invAfter } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", input.invoiceId)
      .maybeSingle()
    invoiceAfter = (invAfter ?? null) as Record<string, unknown> | null
  }

  if (!invoiceAfter) {
    invoiceAfter = inv as Record<string, unknown>
  }

  await insertCaisseAudit(supabase, {
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    action: "credit_payment_recorded",
    entityType: "invoices",
    entityId: input.invoiceId,
    oldValues: inv as Record<string, unknown>,
    newValues: invoiceAfter,
    metadata: {
      role: ctx.role,
      amount,
      method: input.method,
      note: input.note ?? null,
    },
  })

  const stateRaw = String((invoiceAfter as { payment_state?: string }).payment_state ?? "")
  const remainingAfter = round2(
    Number((invoiceAfter as { credit_remaining?: unknown }).credit_remaining ?? 0),
  )

  return {
    ok: true,
    invoice: invoiceAfter,
    payment_state: stateRaw || (remainingAfter <= 0.02 ? "PAID" : "PARTIALLY_PAID"),
    remaining: remainingAfter,
  }
}

export type RecordReminderInput = {
  invoiceId?: string | null
  clientId?: string | null
  channel: "manual" | "email" | "sms" | "whatsapp" | "phone"
  message?: string | null
}

export async function recordCreditReminder(
  supabase: SupabaseClient,
  ctx: Ctx,
  input: RecordReminderInput,
): Promise<{ ok: true; id: string } | { ok: false; status: number; error: string }> {
  if (!input.invoiceId && !input.clientId) {
    return { ok: false, status: 400, error: "invoice_id ou client_id requis" }
  }

  const { data: row, error } = await supabase
    .from("client_credit_reminders")
    .insert({
      invoice_id: input.invoiceId ?? null,
      client_id: input.clientId ?? null,
      channel: input.channel,
      message: input.message ?? null,
      sent_by: ctx.userId,
    })
    .select("id")
    .maybeSingle()

  if (error || !row) {
    return { ok: false, status: 500, error: error?.message ?? "Erreur insertion" }
  }

  await insertCaisseAudit(supabase, {
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    action: "credit_reminder_sent",
    entityType: "invoices",
    entityId: input.invoiceId ?? input.clientId ?? "",
    oldValues: null,
    newValues: {
      channel: input.channel,
      message: input.message ?? null,
    },
    metadata: { role: ctx.role },
  })

  return { ok: true, id: String((row as { id?: string }).id ?? "") }
}
