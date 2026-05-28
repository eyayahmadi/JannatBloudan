import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"

const ALLOW = ["ADMIN", "CASHIER", "SERVER"] as const

/**
 * Déplace la session ouverte (commandes / paiements liés) vers une autre table.
 * Ancienne table repasse FREE, nouvelle OCCUPIED.
 */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : ""
  const toTableId = Number(body.to_table_id)
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""

  if (!sessionId || !Number.isFinite(toTableId)) {
    return NextResponse.json({ error: "session_id et to_table_id requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  const { data: session, error: sErr } = await supabase
    .from("table_sessions")
    .select("id,table_id,closed_at")
    .eq("id", sessionId)
    .maybeSingle()

  if (sErr || !session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 })
  if ((session as { closed_at?: string | null }).closed_at) {
    return NextResponse.json({ error: "Session déjà fermée" }, { status: 409 })
  }

  const fromTableId = Number((session as { table_id?: number }).table_id)
  if (fromTableId === toTableId) {
    return NextResponse.json({ error: "Table identique" }, { status: 400 })
  }

  const { data: fromTable } = await supabase.from("restaurant_tables").select("id,table_number").eq("id", fromTableId).maybeSingle()
  const { data: toTable } = await supabase.from("restaurant_tables").select("id,table_number,current_session_id,status").eq("id", toTableId).maybeSingle()

  if (!toTable) return NextResponse.json({ error: "Table destination introuvable" }, { status: 404 })

  const toCurrent = (toTable as { current_session_id?: string | null }).current_session_id
  if (toCurrent && toCurrent !== sessionId) {
    return NextResponse.json({ error: "La table destination a déjà une session active" }, { status: 409 })
  }

  const { data: conflict } = await supabase
    .from("table_sessions")
    .select("id")
    .eq("table_id", toTableId)
    .is("closed_at", null)
    .neq("id", sessionId)
    .maybeSingle()

  if (conflict) {
    return NextResponse.json({ error: "Une autre session occupe déjà cette table" }, { status: 409 })
  }

  const now = new Date().toISOString()
  const { error: uSess } = await supabase.from("table_sessions").update({ table_id: toTableId }).eq("id", sessionId)
  if (uSess) return NextResponse.json({ error: uSess.message }, { status: 500 })

  const toNum = Number((toTable as { table_number?: number }).table_number)
  await supabase.from("orders").update({ table_id: toTableId, table_number: toNum }).eq("session_id", sessionId)

  await supabase
    .from("restaurant_tables")
    .update({ status: "FREE", current_session_id: null, last_activity: now })
    .eq("id", fromTableId)
    .eq("current_session_id", sessionId)

  await supabase
    .from("restaurant_tables")
    .update({ status: "OCCUPIED", current_session_id: sessionId, last_activity: now })
    .eq("id", toTableId)

  const { data: transferRow } = await supabase
    .from("table_session_transfers")
    .insert({
      session_id: sessionId,
      from_table_id: fromTableId,
      to_table_id: toTableId,
      performed_by: guard.user.id,
      reason: reason || null,
    })
    .select("*")
    .maybeSingle()

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "table_transfer",
    entityType: "table_sessions",
    entityId: sessionId,
    oldValues: { table_id: fromTableId, table_number: (fromTable as { table_number?: number })?.table_number },
    newValues: { table_id: toTableId, table_number: toNum },
    metadata: {
      reason: reason || null,
      transfer_id: (transferRow as { id?: string } | null)?.id ?? null,
      from_table_id: fromTableId,
      to_table_id: toTableId,
    },
  })

  return NextResponse.json({
    ok: true,
    session_id: sessionId,
    from_table_id: fromTableId,
    to_table_id: toTableId,
    transfer: transferRow,
  })
}
