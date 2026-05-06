import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"

const ALLOW = ["ADMIN", "CASHIER"] as const

type Part = { method: string; amount: number }

const EPS = 0.03

/** Valide encaissement : espèces / carte / online / split → payments + invoice + session */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const invoiceId = typeof body.invoice_id === "string" ? body.invoice_id.trim() : ""

  let parts: Part[] = []
  if (Array.isArray(body.payments) && body.payments.length > 0) {
    parts = body.payments.map((p: { method?: string; amount?: unknown }) => ({
      method: String(p.method ?? "").toLowerCase(),
      amount: Number(p.amount),
    }))
  } else if (body.method != null && body.amount != null) {
    parts = [{ method: String(body.method).toLowerCase(), amount: Number(body.amount) }]
  }

  if (!invoiceId || parts.length === 0 || parts.some((p) => !["cash", "card", "online", "wallet"].includes(p.method))) {
    return NextResponse.json({ error: "invoice_id et payments valides (method cash|card|online|wallet)" }, { status: 400 })
  }
  if (parts.some((p) => !Number.isFinite(p.amount) || p.amount <= 0)) {
    return NextResponse.json({ error: "Montants invalides" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle()

  if (invErr || !inv) {
    return NextResponse.json({ error: invErr?.message ?? "Facture introuvable" }, { status: 404 })
  }

  const st = String((inv as { status?: string }).status ?? "").toLowerCase()
  if (st === "cancelled" || st === "refunded") {
    return NextResponse.json({ error: "Facture annulée / remboursée" }, { status: 409 })
  }
  if (st === "paid") {
    return NextResponse.json({ ok: true, idempotent: true, invoice_id: invoiceId })
  }

  const totalDue = Number((inv as { total?: unknown }).total ?? 0)
  const sumParts = Math.round(parts.reduce((s, p) => s + p.amount, 0) * 100) / 100
  if (!Number.isFinite(totalDue) || Math.abs(sumParts - totalDue) > EPS) {
    return NextResponse.json(
      { error: `Somme des paiements (${sumParts}) doit égaler total TTC (${totalDue}).` },
      { status: 400 },
    )
  }

  const uid = guard.user.id
  const now = new Date().toISOString()
  const isSplit = parts.length > 1 || [...new Set(parts.map((p) => p.method))].length > 1
  let primaryPaymentMethod = parts[0].method
  if (isSplit) primaryPaymentMethod = "split"

  const splitPayload = parts.map((p) => ({ method: p.method, amount: p.amount }))

  for (const p of parts) {
    const payRow = {
      invoice_id: invoiceId,
      session_id: (inv as { session_id?: string | null }).session_id ?? null,
      order_id: (inv as { order_id?: string | null }).order_id ?? null,
      amount: p.amount,
      currency: "EUR",
      method: p.method === "wallet" ? "wallet" : p.method,
      status: "succeeded",
      provider: "manual",
      processed_by: uid,
      processed_at: now,
    }
    const { error: pErr } = await supabase.from("payments").insert(payRow)
    if (pErr) {
      console.error("[caisse/payment]", pErr)
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }
  }

  const payment_stage = isSplit
    ? "split"
    : parts[0].method === "cash"
      ? "paid_cash"
      : parts[0].method === "online"
        ? "paid_online"
        : parts[0].method === "card"
          ? "paid_card"
          : "paid_cash"

  const invoiceMethod =
    isSplit ? "split" : parts.length === 1 ? parts[0].method === "wallet" ? "wallet" : parts[0].method : "split"

  const updatedRow = {
    status: "paid",
    paid_at: now,
    cashier_id: uid,
    payment_method: invoiceMethod,
    payment_stage,
    payment_split: isSplit ? splitPayload : null,
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
    return NextResponse.json({ error: upErr?.message ?? "MàJ facture" }, { status: 500 })
  }

  await insertCaisseAudit(supabase, {
    userId: uid,
    userEmail: guard.user.email ?? null,
    action: "payment_validated",
    entityType: "invoices",
    entityId: invoiceId,
    oldValues: oldSnapshot as Record<string, unknown>,
    newValues: after as Record<string, unknown>,
    metadata: { role: guard.role },
  })

  const sessionId = (inv as { session_id?: string | null }).session_id
  if (sessionId) {
    const sessMethod = isSplit ? "split" : parts[0].method === "cash" ? "cash" : parts[0].method === "online" ? "online" : "card"
    await supabase
      .from("table_sessions")
      .update({ paid: true, payment_method: sessMethod })
      .eq("id", sessionId)
  }

  return NextResponse.json({
    ok: true,
    invoice: after,
    payment_stage,
    split: isSplit,
  })
}
