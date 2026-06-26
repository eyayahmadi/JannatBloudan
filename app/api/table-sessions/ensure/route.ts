import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { resolveRestaurantTableFromRef } from "@/lib/restaurant/resolve-table"
import { ensureTableSession } from "@/lib/table-sessions/ensure-session"

const ALLOW = ["ADMIN", "SERVER", "CASHIER"] as const

/**
 * POST /api/table-sessions/ensure
 * Ouvre ou récupère la session active pour une table (idempotent).
 */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const ref =
    typeof body.tableRef === "string" && body.tableRef.trim()
      ? body.tableRef.trim()
      : body.tableId != null
        ? String(body.tableId)
        : ""

  if (!ref) {
    return NextResponse.json({ error: "tableRef ou tableId requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const resolved = await resolveRestaurantTableFromRef(supabase, ref)
  if (!resolved) {
    return NextResponse.json({ error: "Table inconnue" }, { status: 404 })
  }

  const { sessionId, created } = await ensureTableSession(supabase, resolved.id, {
    userId: guard.user.id,
    userEmail: guard.user.email,
    source: "api/table-sessions/ensure",
  })

  return NextResponse.json({
    session_id: sessionId,
    table_id: resolved.id,
    table_number: resolved.table_number,
    created,
  })
}
