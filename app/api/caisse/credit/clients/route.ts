import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Liste agrégée des clients ayant une dette en cours. */
export async function GET(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const onlyOverdue = searchParams.get("overdue") === "1"
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500)

  const supabase = createServiceRoleClient()
  const query = supabase
    .from("v_client_credit_summary")
    .select(
      "client_id, client_name, client_email, open_invoices, overdue_invoices, total_debt_origin, total_paid, total_remaining, last_payment_at, next_due_at, earliest_overdue_at, credit_limit, blocked",
    )
    .order("total_remaining", { ascending: false })
    .limit(limit)

  if (onlyOverdue) {
    query.gt("overdue_invoices", 0)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let aggregate = { total_remaining: 0, open_invoices: 0, overdue_invoices: 0, clients_count: 0 }
  for (const row of (data ?? []) as Array<{
    open_invoices?: number
    overdue_invoices?: number
    total_remaining?: number
  }>) {
    aggregate.total_remaining += Number(row.total_remaining ?? 0)
    aggregate.open_invoices += Number(row.open_invoices ?? 0)
    aggregate.overdue_invoices += Number(row.overdue_invoices ?? 0)
    aggregate.clients_count += 1
  }
  aggregate.total_remaining = Math.round(aggregate.total_remaining * 100) / 100

  return NextResponse.json({ ok: true, clients: data ?? [], aggregate })
}
