import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { markTableCleaned } from "@/lib/table-lifecycle"
import { staffPaymentCtxFromAuth, ensureStaffUserIdFromCtx } from "@/lib/caisse/resolve-staff-user-id"

const ALLOW = ["ADMIN", "CASHIER", "SERVER"] as const

/** Confirms table cleaning — transitions CLEANING → FREE. */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const tableId = Number(body.table_id ?? body.tableId)
  if (!Number.isFinite(tableId) || tableId <= 0) {
    return NextResponse.json({ error: "table_id requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data: before } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("id", tableId)
    .maybeSingle()

  const result = await markTableCleaned(supabase, tableId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  const { data: after } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("id", tableId)
    .maybeSingle()

  const ctx = staffPaymentCtxFromAuth(guard.user, guard.role)
  const auditUserId = await ensureStaffUserIdFromCtx(supabase, ctx)

  await insertCaisseAudit(supabase, {
    userId: auditUserId,
    userEmail: guard.user.email ?? null,
    action: "table_marked_cleaned",
    entityType: "restaurant_tables",
    entityId: String(tableId),
    oldValues: (before as Record<string, unknown>) ?? null,
    newValues: (after as Record<string, unknown>) ?? null,
    metadata: { role: guard.role },
  })

  return NextResponse.json({
    ok: true,
    table_id: tableId,
    status: "FREE",
    table: after,
  })
}
