import type { SupabaseClient } from "@supabase/supabase-js"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { friendlyPaymentError } from "@/lib/caisse/friendly-payment-error"
import {
  ensureStaffUserIdFromCtx,
  type StaffPaymentCtx,
} from "@/lib/caisse/resolve-staff-user-id"
import { sanitizePaymentRefs } from "@/lib/caisse/sanitize-payment-refs"
import { transitionSessionToNeedsCleaning } from "@/lib/table-lifecycle"

const EPS = 0.03

export type PayPart = { method: string; amount: number; guest_session_id?: string | null }

const METHODS = new Set(["cash", "card", "online", "wallet", "hospitality"])

/**
 * Encaissement facture (partagé par /api/caisse/payment et batch-pay).
 * Supporte total 0 + method hospitality (offert / hospitalité).
 */
export async function processInvoicePayment(
  supabase: SupabaseClient,
  ctx: StaffPaymentCtx,
  invoiceId: string,
  parts: PayPart[],
  opts?: { payment_batch_id?: string | null },
): Promise<{ ok: true; invoice: Record<string, unknown>; payment_stage: string; split: boolean } | { ok: false; status: number; error: string }> {
  if (!parts.length) {
    return { ok: false, status: 400, error: "Paiements requis" }
  }

  if (parts.some((p) => !METHODS.has(String(p.method).toLowerCase()))) {
    return { ok: false, status: 400, error: "method invalide (cash|card|online|wallet|hospitality)" }
  }

  const { data: inv, error: invErr } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle()
  if (invErr || !inv) {
    return { ok: false, status: 404, error: friendlyPaymentError(invErr?.message, "Facture introuvable") }
  }

  const sessionId = (inv as { session_id?: string | null }).session_id ?? null

  const billingType = String((inv as { billing_type?: string }).billing_type ?? "normal").toLowerCase()
  const st = String((inv as { status?: string }).status ?? "").toLowerCase()
  if (st === "cancelled" || st === "refunded") {
    return { ok: false, status: 409, error: "Facture annulée / remboursée" }
  }
  if (st === "paid") {
    return {
      ok: true,
      invoice: inv as Record<string, unknown>,
      payment_stage: String((inv as { payment_stage?: string }).payment_stage ?? "paid"),
      split: Boolean((inv as { payment_split?: unknown }).payment_split),
    }
  }

  const totalDue = Number((inv as { total?: unknown }).total ?? 0)

  const onlyHospitalityZero =
    billingType === "hospitality" || billingType === "complimentary"
      ? Math.abs(totalDue) < EPS &&
        parts.length === 1 &&
        parts[0].method === "hospitality" &&
        Math.abs(Number(parts[0].amount ?? 0)) < EPS
      : false

  if (!onlyHospitalityZero) {
    if (parts.some((p) => !Number.isFinite(p.amount) || p.amount <= 0)) {
      return { ok: false, status: 400, error: "Montants invalides" }
    }
  }

  const sumParts = Math.round(parts.reduce((s, p) => s + Number(p.amount ?? 0), 0) * 100) / 100
  if (!Number.isFinite(totalDue) || (!onlyHospitalityZero && Math.abs(sumParts - totalDue) > EPS)) {
    return {
      ok: false,
      status: 400,
      error: `Somme des paiements (${sumParts}) doit égaler total TTC (${totalDue}).`,
    }
  }

  const staffUserId = await ensureStaffUserIdFromCtx(supabase, ctx)
  const now = new Date().toISOString()
  const uniqueMethods = new Set(parts.map((p) => p.method.toLowerCase()))
  const isSplit = parts.length > 1 || uniqueMethods.size > 1

  const splitPayload = parts.map((p) => ({ method: p.method, amount: p.amount }))
  const invoiceGuestSessionId = (inv as { guest_session_id?: string | null }).guest_session_id ?? null
  const baseRefs = await sanitizePaymentRefs(supabase, {
    session_id: (inv as { session_id?: string | null }).session_id ?? null,
    order_id: (inv as { order_id?: string | null }).order_id ?? null,
    guest_session_id: invoiceGuestSessionId,
  })

  for (const p of parts) {
    const partGuestId = p.guest_session_id ?? invoiceGuestSessionId
    const refs =
      partGuestId && partGuestId !== invoiceGuestSessionId
        ? await sanitizePaymentRefs(supabase, { ...baseRefs, guest_session_id: partGuestId })
        : baseRefs

    const payRow = {
      invoice_id: invoiceId,
      session_id: refs.session_id,
      order_id: refs.order_id,
      amount: p.amount,
      currency: "EUR",
      method: p.method === "wallet" ? "wallet" : p.method,
      status: "succeeded",
      provider: "manual",
      processed_by: staffUserId,
      processed_at: staffUserId ? now : null,
      payment_batch_id: opts?.payment_batch_id ?? null,
      guest_session_id: refs.guest_session_id,
    }
    const { error: pErr } = await supabase.from("payments").insert(payRow)
    if (pErr) {
      console.error("[processInvoicePayment]", pErr)
      return { ok: false, status: 500, error: friendlyPaymentError(pErr.message) }
    }
  }

  const payment_stage = onlyHospitalityZero
    ? "paid_hospitality"
    : isSplit
      ? "split"
      : parts[0].method === "cash"
        ? "paid_cash"
        : parts[0].method === "online"
          ? "paid_online"
          : parts[0].method === "card"
            ? "paid_card"
            : parts[0].method === "hospitality"
              ? "paid_hospitality"
              : "paid_cash"

  const invoiceMethod =
    onlyHospitalityZero
      ? "hospitality"
      : isSplit
        ? "split"
        : parts.length === 1 && parts[0].method === "wallet"
          ? "wallet"
          : parts.length === 1
            ? parts[0].method
            : "split"

  const updatedRow = {
    status: "paid",
    paid_at: now,
    cashier_id: staffUserId,
    payment_method: invoiceMethod,
    payment_stage,
    payment_split: isSplit && !onlyHospitalityZero ? splitPayload : onlyHospitalityZero ? [{ method: "hospitality", amount: 0 }] : null,
    updated_at: now,
  }

  const oldSnapshot = inv as Record<string, unknown>

  const { data: after, error: upErr } = await supabase
    .from("invoices")
    .update(updatedRow)
    .eq("id", invoiceId)
    .select("*")
    .maybeSingle()

  if (upErr || !after) {
    return { ok: false, status: 500, error: friendlyPaymentError(upErr?.message, "Mise à jour de la facture impossible") }
  }

  await insertCaisseAudit(supabase, {
    userId: staffUserId,
    userEmail: ctx.userEmail ?? null,
    action: "payment_validated",
    entityType: "invoices",
    entityId: invoiceId,
    oldValues: oldSnapshot,
    newValues: after as Record<string, unknown>,
    metadata: { role: ctx.role, batch: opts?.payment_batch_id ?? null },
  })

  if (sessionId) {
    const { data: sessInvoices } = await supabase.from("invoices").select("id, status").eq("session_id", sessionId)
    const rows = sessInvoices ?? []
    const meaningful = rows.filter((row) => String((row as { status?: string }).status ?? "").toLowerCase() !== "cancelled")
    const allPaidOk =
      meaningful.length > 0 &&
      meaningful.every((row) => String((row as { status?: string }).status ?? "").toLowerCase() === "paid")
    if (allPaidOk) {
      const sessMethod =
        isSplit ? "split" : String(parts[0]?.method ?? "cash").toLowerCase() === "hospitality" ? "hospitality" : parts[0].method === "online" ? "online" : parts[0].method === "card" ? "card" : "cash"
      await supabase.from("table_sessions").update({ paid: true, payment_method: sessMethod }).eq("id", sessionId)
      await transitionSessionToNeedsCleaning(supabase, sessionId, { closeSession: true })
    }
  }

  return {
    ok: true,
    invoice: after as Record<string, unknown>,
    payment_stage,
    split: isSplit,
  }
}
