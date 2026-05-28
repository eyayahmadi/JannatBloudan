import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"

const ALLOW = ["ADMIN", "CASHIER", "SERVER"] as const

type SessionRow = {
  id: string
  table_id: number | null
  closed_at: string | null
  total: number | null
}

type RestaurantTableRow = {
  id: number
  table_number: number | null
  current_session_id: string | null
  status?: string | null
}

/**
 * Fusionne plusieurs tables vers une table principale.
 *
 * Cas couverts :
 *  - occupée + occupée : sessions absorbées (orders + invoices déplacés).
 *  - occupée + libre   : la libre est rattachée à la session principale.
 *  - libre + occupée   : la session existante est transférée vers la table
 *                        principale puis sert de session principale.
 *  - libre + libre     : une nouvelle session ouverte sur la table principale,
 *                        toutes les libres y sont rattachées (grand groupe).
 *
 * Toutes les commandes / factures sont préservées. Une ligne `table_session_merges`
 * + un `audit_logs` action `tables_merged` sont créés pour chaque session absorbée.
 */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""

  // --- Compat : nouveau contrat (table_ids) + ancien (session_ids) ---
  const mainTableIdInput = Number(body.main_table_id)
  const mergedTableIdsRaw: unknown = body.merged_table_ids
  const mainSessionIdInput =
    typeof body.main_session_id === "string" ? body.main_session_id.trim() : ""
  const mergedSessionIdsRaw: unknown = body.merged_session_ids

  const mergedTableIds: number[] = Array.isArray(mergedTableIdsRaw)
    ? Array.from(
        new Set(
          (mergedTableIdsRaw as unknown[])
            .map((x) => Number(x))
            .filter((x) => Number.isFinite(x) && x > 0),
        ),
      )
    : []

  const mergedSessionIdsCompat: string[] = Array.isArray(mergedSessionIdsRaw)
    ? Array.from(
        new Set(
          (mergedSessionIdsRaw as unknown[])
            .filter((x): x is string => typeof x === "string")
            .map((x) => x.trim())
            .filter((x) => x.length > 0 && x !== mainSessionIdInput),
        ),
      )
    : []

  if (
    !Number.isFinite(mainTableIdInput) &&
    !mainSessionIdInput
  ) {
    return NextResponse.json(
      { error: "main_table_id ou main_session_id requis" },
      { status: 400 },
    )
  }
  if (mergedTableIds.length === 0 && mergedSessionIdsCompat.length === 0) {
    return NextResponse.json(
      { error: "Au moins une table à fusionner est requise" },
      { status: 400 },
    )
  }

  const supabase = createServiceRoleClient()
  const now = new Date().toISOString()
  const performedBy = guard.user.id
  const performedByEmail = guard.user.email ?? null

  // -------------------------------------------------------------------------
  // 1) Résoudre la table principale
  // -------------------------------------------------------------------------
  let mainTableId: number | null = Number.isFinite(mainTableIdInput)
    ? Number(mainTableIdInput)
    : null

  if (mainTableId == null && mainSessionIdInput) {
    const { data: s } = await supabase
      .from("table_sessions")
      .select("id,table_id")
      .eq("id", mainSessionIdInput)
      .maybeSingle<{ id: string; table_id: number | null }>()
    if (s?.table_id != null) mainTableId = Number(s.table_id)
  }

  if (mainTableId == null) {
    return NextResponse.json({ error: "Table principale introuvable" }, { status: 404 })
  }

  const { data: mainTable } = await supabase
    .from("restaurant_tables")
    .select("id,table_number,current_session_id,status")
    .eq("id", mainTableId)
    .maybeSingle<RestaurantTableRow>()

  if (!mainTable) {
    return NextResponse.json({ error: "Table principale introuvable" }, { status: 404 })
  }
  const mainTableNumber = mainTable.table_number ?? null

  // -------------------------------------------------------------------------
  // 2) Résoudre les tables à fusionner (uniques, != main)
  // -------------------------------------------------------------------------
  let mergedTableIdsResolved = mergedTableIds.filter((id) => id !== mainTableId)

  if (mergedTableIdsResolved.length === 0 && mergedSessionIdsCompat.length > 0) {
    const { data: rows } = await supabase
      .from("table_sessions")
      .select("id,table_id")
      .in("id", mergedSessionIdsCompat)
      .returns<{ id: string; table_id: number | null }[]>()
    const set = new Set<number>()
    for (const r of rows ?? []) {
      const tid = Number(r.table_id ?? 0)
      if (tid > 0 && tid !== mainTableId) set.add(tid)
    }
    mergedTableIdsResolved = Array.from(set)
  }

  if (mergedTableIdsResolved.length === 0) {
    return NextResponse.json(
      { error: "Aucune table valide à fusionner" },
      { status: 400 },
    )
  }

  const { data: mergedTables } = await supabase
    .from("restaurant_tables")
    .select("id,table_number,current_session_id,status")
    .in("id", mergedTableIdsResolved)
    .returns<RestaurantTableRow[]>()

  if (!mergedTables || mergedTables.length === 0) {
    return NextResponse.json({ error: "Tables à fusionner introuvables" }, { status: 404 })
  }

  // -------------------------------------------------------------------------
  // 3) Charger toutes les sessions ouvertes des tables impliquées
  // -------------------------------------------------------------------------
  const allTableIds = [mainTableId, ...mergedTables.map((t) => t.id)]
  const { data: openSessions } = await supabase
    .from("table_sessions")
    .select("id,table_id,closed_at,total")
    .in("table_id", allTableIds)
    .is("closed_at", null)
    .returns<SessionRow[]>()

  const sessionByTable = new Map<number, SessionRow>()
  for (const s of openSessions ?? []) {
    const tid = Number(s.table_id ?? 0)
    if (tid > 0 && !sessionByTable.has(tid)) sessionByTable.set(tid, s)
  }

  let survivingSession: SessionRow | null = sessionByTable.get(mainTableId) ?? null
  let createdNewSession = false
  let transferredSessionFromTableId: number | null = null

  // -------------------------------------------------------------------------
  // 4) Choisir / fabriquer la session survivante (= session principale)
  // -------------------------------------------------------------------------
  if (!survivingSession) {
    const candidate = mergedTables
      .map((t) => sessionByTable.get(t.id))
      .find((s): s is SessionRow => Boolean(s))
    if (candidate) {
      // Transfert de cette session vers la table principale → elle devient principale.
      const { error: trErr } = await supabase
        .from("table_sessions")
        .update({ table_id: mainTableId })
        .eq("id", candidate.id)
      if (trErr) return NextResponse.json({ error: trErr.message }, { status: 500 })

      transferredSessionFromTableId = Number(candidate.table_id ?? 0) || null
      survivingSession = { ...candidate, table_id: mainTableId }

      if (mainTableNumber != null) {
        await supabase
          .from("orders")
          .update({ table_id: mainTableId, table_number: mainTableNumber })
          .eq("session_id", candidate.id)
      }

      // Libère la table d'origine de cette session
      if (transferredSessionFromTableId) {
        await supabase
          .from("restaurant_tables")
          .update({ status: "FREE", current_session_id: null, last_activity: now })
          .eq("id", transferredSessionFromTableId)
          .eq("current_session_id", candidate.id)
      }

      // Retire-la des sessions « à absorber »
      sessionByTable.delete(transferredSessionFromTableId ?? -1)
    }
  }

  if (!survivingSession) {
    // Toutes les tables sont libres → ouvrir une nouvelle session sur la principale
    const { data: created, error: cErr } = await supabase
      .from("table_sessions")
      .insert({
        table_id: mainTableId,
        opened_at: now,
        total: 0,
        paid: false,
      })
      .select("id,table_id,closed_at,total")
      .maybeSingle<SessionRow>()
    if (cErr || !created) {
      return NextResponse.json(
        { error: cErr?.message || "Création de session impossible" },
        { status: 500 },
      )
    }
    survivingSession = created
    createdNewSession = true
  }

  const survivingSessionId = survivingSession.id

  // -------------------------------------------------------------------------
  // 5) Absorber les sessions ouvertes restantes des tables fusionnées
  // -------------------------------------------------------------------------
  type MergedRecord = {
    merged_session_id: string | null
    merged_table_id: number
    merged_table_number: number | null
    moved_orders: number
    moved_invoices: number
    merge_id: string | null
    case: "absorbed" | "linked_free"
  }
  const mergedRecords: MergedRecord[] = []

  for (const t of mergedTables) {
    const sess = sessionByTable.get(t.id) ?? null

    if (sess && sess.id !== survivingSessionId) {
      const orderUpdate: Record<string, unknown> = { session_id: survivingSessionId }
      orderUpdate.table_id = mainTableId
      if (mainTableNumber != null) orderUpdate.table_number = mainTableNumber

      const { data: movedOrders } = await supabase
        .from("orders")
        .update(orderUpdate)
        .eq("session_id", sess.id)
        .select("id")

      const { data: movedInvoices } = await supabase
        .from("invoices")
        .update({ session_id: survivingSessionId })
        .eq("session_id", sess.id)
        .select("id")

      await supabase
        .from("table_sessions")
        .update({ closed_at: now })
        .eq("id", sess.id)

      await supabase
        .from("restaurant_tables")
        .update({ status: "FREE", current_session_id: null, last_activity: now })
        .eq("id", t.id)
        .eq("current_session_id", sess.id)

      const { data: mergeRow } = await supabase
        .from("table_session_merges")
        .insert({
          main_session_id: survivingSessionId,
          main_table_id: mainTableId,
          merged_session_id: sess.id,
          merged_table_id: t.id,
          merged_old_total: Number(sess.total ?? 0),
          performed_by: performedBy,
          reason: reason || null,
        })
        .select("id")
        .maybeSingle<{ id: string }>()

      mergedRecords.push({
        merged_session_id: sess.id,
        merged_table_id: t.id,
        merged_table_number: t.table_number ?? null,
        moved_orders: Array.isArray(movedOrders) ? movedOrders.length : 0,
        moved_invoices: Array.isArray(movedInvoices) ? movedInvoices.length : 0,
        merge_id: mergeRow?.id ?? null,
        case: "absorbed",
      })
    } else {
      // Pas de session sur cette table → on la rattache simplement à la session principale
      const { data: mergeRow } = await supabase
        .from("table_session_merges")
        .insert({
          main_session_id: survivingSessionId,
          main_table_id: mainTableId,
          merged_session_id: survivingSessionId, // pas de session source → on référence la principale
          merged_table_id: t.id,
          merged_old_total: 0,
          performed_by: performedBy,
          reason: reason ? `${reason} (table libre rattachée)` : "table libre rattachée",
        })
        .select("id")
        .maybeSingle<{ id: string }>()

      mergedRecords.push({
        merged_session_id: null,
        merged_table_id: t.id,
        merged_table_number: t.table_number ?? null,
        moved_orders: 0,
        moved_invoices: 0,
        merge_id: mergeRow?.id ?? null,
        case: "linked_free",
      })
    }
  }

  // -------------------------------------------------------------------------
  // 6) Marquer la table principale comme occupée et lier les tables
  //    fusionnées libres à la session principale (pour visualisation caisse)
  // -------------------------------------------------------------------------
  await supabase
    .from("restaurant_tables")
    .update({ status: "OCCUPIED", current_session_id: survivingSessionId, last_activity: now })
    .eq("id", mainTableId)

  for (const rec of mergedRecords) {
    if (rec.case === "linked_free") {
      await supabase
        .from("restaurant_tables")
        .update({
          status: "OCCUPIED",
          current_session_id: survivingSessionId,
          last_activity: now,
        })
        .eq("id", rec.merged_table_id)
    }
  }

  // -------------------------------------------------------------------------
  // 7) Audit log applicatif (en plus des traces ligne par ligne)
  // -------------------------------------------------------------------------
  await insertCaisseAudit(supabase, {
    userId: performedBy,
    userEmail: performedByEmail,
    action: "tables_merged",
    entityType: "table_sessions",
    entityId: survivingSessionId,
    oldValues: {
      main_total: Number(survivingSession.total ?? 0),
      merged_count: mergedRecords.length,
      session_created: createdNewSession,
      session_transferred_from_table_id: transferredSessionFromTableId,
    },
    newValues: {
      main_session_id: survivingSessionId,
      main_table_id: mainTableId,
      main_table_number: mainTableNumber,
    },
    metadata: {
      reason: reason || null,
      role: guard.role,
      merged: mergedRecords,
    },
  })

  return NextResponse.json({
    ok: true,
    main_session_id: survivingSessionId,
    main_table_id: mainTableId,
    main_table_number: mainTableNumber,
    session_created: createdNewSession,
    session_transferred_from_table_id: transferredSessionFromTableId,
    merged: mergedRecords,
  })
}

/** Liste les fusions enregistrées sur une session principale (pour la caisse). */
export async function GET(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ merges: [] })

  const { searchParams } = new URL(request.url)
  const mainSessionId = searchParams.get("main_session_id")?.trim() ?? ""
  if (!mainSessionId) return NextResponse.json({ error: "main_session_id requis" }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("table_session_merges")
    .select("id,merged_session_id,merged_table_id,merged_old_total,reason,created_at")
    .eq("main_session_id", mainSessionId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ merges: [], error: error.message })
  return NextResponse.json({ merges: data ?? [] })
}
