import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Détail d'un client : factures crédit + historique paiements + rappels. */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ clientId: string }> },
) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }
  const { clientId } = await ctx.params
  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const [
    { data: summary },
    { data: invoices },
    { data: payments },
    { data: reminders },
    { data: limit },
    { data: user },
  ] = await Promise.all([
    supabase
      .from("v_client_credit_summary")
      .select(
        "client_id, client_name, client_email, open_invoices, overdue_invoices, total_debt_origin, total_paid, total_remaining, last_payment_at, next_due_at, earliest_overdue_at, credit_limit, blocked",
      )
      .eq("client_id", clientId)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select(
        "id, total, credit_paid, credit_remaining, credit_due_at, credit_reason, credit_note, credit_recorded_at, payment_state, status, created_at",
      )
      .eq("customer_id", clientId)
      .not("payment_state", "is", null)
      .neq("payment_state", "PAID")
      .order("credit_due_at", { ascending: true })
      .limit(200),
    supabase
      .from("client_credit_payments")
      .select("id, invoice_id, amount, method, note, recorded_at, recorded_by")
      .eq("client_id", clientId)
      .order("recorded_at", { ascending: false })
      .limit(100),
    supabase
      .from("client_credit_reminders")
      .select("id, invoice_id, channel, message, sent_at, success")
      .eq("client_id", clientId)
      .order("sent_at", { ascending: false })
      .limit(50),
    supabase
      .from("client_credit_limits")
      .select("credit_limit, blocked, reason, updated_at")
      .eq("client_id", clientId)
      .maybeSingle(),
    supabase
      .from("users")
      .select("id, email, full_name, phone")
      .eq("id", clientId)
      .maybeSingle(),
  ])

  return NextResponse.json({
    ok: true,
    client: user ?? null,
    summary: summary ?? null,
    limit: limit ?? null,
    invoices: invoices ?? [],
    payments: payments ?? [],
    reminders: reminders ?? [],
  })
}

/** Mise à jour du plafond / blocage. */
export async function PUT(
  request: Request,
  ctx: { params: Promise<{ clientId: string }> },
) {
  const guard = await requireRoles(["ADMIN"] as const)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }
  const { clientId } = await ctx.params
  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const limit = Number(body.credit_limit)
  const blocked = Boolean(body.blocked)
  const reason = typeof body.reason === "string" ? body.reason : null
  if (!Number.isFinite(limit) || limit < 0) {
    return NextResponse.json({ error: "credit_limit invalide" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("client_credit_limits")
    .upsert(
      {
        client_id: clientId,
        credit_limit: limit,
        blocked,
        reason,
        updated_by: guard.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" },
    )
    .select("*")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, limit: data })
}
