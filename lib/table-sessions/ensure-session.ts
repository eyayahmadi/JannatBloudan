import type { SupabaseClient } from "@supabase/supabase-js"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { isNeedsCleaningStatus, isTableAvailableForNewSession } from "@/lib/table-lifecycle"

export type EnsureSessionResult = {
  sessionId: string
  created: boolean
}

/**
 * Une seule session ouverte par table — préfère RPC DB (migration 35), sinon fallback applicatif.
 */
export async function ensureTableSession(
  supabase: SupabaseClient,
  tableId: number,
  audit?: { userId?: string | null; userEmail?: string | null; source: string },
): Promise<EnsureSessionResult> {
  const { data: tableRow } = await supabase
    .from("restaurant_tables")
    .select("status, is_active")
    .eq("id", tableId)
    .maybeSingle()

  const tableStatus = String((tableRow as { status?: string } | null)?.status ?? "")
  if (isNeedsCleaningStatus(tableStatus)) {
    throw new Error("TABLE_NEEDS_CLEANING")
  }
  if ((tableRow as { is_active?: boolean } | null)?.is_active === false) {
    throw new Error("TABLE_OUT_OF_SERVICE")
  }

  const { data: rpcId, error: rpcErr } = await supabase.rpc("ensure_table_session", {
    p_table_id: tableId,
  })

  if (!rpcErr && rpcId) {
    return { sessionId: String(rpcId), created: false }
  }

  const { data: existing } = await supabase
    .from("table_sessions")
    .select("id")
    .eq("table_id", tableId)
    .is("closed_at", null)
    .order("opened_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    await syncTablePointer(supabase, tableId, existing.id)
    return { sessionId: existing.id, created: false }
  }

  const { data: created, error: insErr } = await supabase
    .from("table_sessions")
    .insert({ table_id: tableId })
    .select("id")
    .single()

  if (insErr) {
    const { data: retry } = await supabase
      .from("table_sessions")
      .select("id")
      .eq("table_id", tableId)
      .is("closed_at", null)
      .limit(1)
      .maybeSingle()
    if (retry?.id) {
      await syncTablePointer(supabase, tableId, retry.id)
      return { sessionId: retry.id, created: false }
    }
    throw new Error(insErr.message)
  }

  const sessionId = created!.id as string
  await syncTablePointer(supabase, tableId, sessionId)

  if (audit) {
    await insertCaisseAudit(supabase, {
      userId: audit.userId ?? null,
      userEmail: audit.userEmail ?? null,
      action: "table_session_opened",
      entityType: "table_sessions",
      entityId: sessionId,
      oldValues: null,
      newValues: { table_id: tableId, session_id: sessionId },
      metadata: { source: audit.source },
    })
  }

  return { sessionId, created: true }
}

async function syncTablePointer(supabase: SupabaseClient, tableId: number, sessionId: string) {
  const { data: row } = await supabase
    .from("restaurant_tables")
    .select("status")
    .eq("id", tableId)
    .maybeSingle()

  const status = isTableAvailableForNewSession(row?.status) ? "OCCUPIED" : row?.status ?? "OCCUPIED"

  await supabase
    .from("restaurant_tables")
    .update({
      current_session_id: sessionId,
      status,
      last_activity: new Date().toISOString(),
    })
    .eq("id", tableId)
}

/** Post-close: tables enter CLEANING — not FREE until staff confirms. */
export async function releaseTablesForSession(supabase: SupabaseClient, sessionId: string) {
  const { transitionSessionToNeedsCleaning } = await import("@/lib/table-lifecycle")
  await transitionSessionToNeedsCleaning(supabase, sessionId, { closeSession: false })
}
