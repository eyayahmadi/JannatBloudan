/**
 * POST /api/stations/[station]/refuse-bulk
 * -----------------------------------------
 * Refuse en bloc tous les items en attente / acceptés d'une station.
 * Utile pour un end-of-shift ou une fermeture brutale.
 *
 * Body :
 *   {
 *     reason_code: RefusalReasonCode,
 *     reason_note?: string,
 *     order_id?: string         // optionnel : limite au scope d'une commande
 *   }
 *
 * Sécurité : ADMIN ou rôle station correspondant.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { STATIONS, type Station } from "@/lib/stations/config"
import {
  isRefusalReasonCode,
  type RefusalReasonCode,
} from "@/lib/stations/refusal-reasons"
import { normalizeRole, type AppRole } from "@/lib/auth/roles"

const STAFF_ROLES: readonly AppRole[] = [
  "ADMIN",
  "KITCHEN",
  "BAR",
  "SHISHA",
] as const

const STATION_ROLE_GUARD: Record<Station, AppRole> = {
  KITCHEN: "KITCHEN",
  BAR: "BAR",
  SHISHA: "SHISHA",
}

function isStation(v: string): v is Station {
  return (STATIONS as string[]).includes(v.toUpperCase())
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ station: string }> },
) {
  const { station: rawStation } = await params
  const stationParam = rawStation.toUpperCase()
  if (!isStation(stationParam)) {
    return NextResponse.json(
      { error: `Station invalide: ${rawStation}. Valeurs: ${STATIONS.join(", ")}` },
      { status: 400 },
    )
  }
  const station: Station = stationParam

  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const callerRole = normalizeRole(guard.role)
  if (callerRole !== "ADMIN" && callerRole !== STATION_ROLE_GUARD[station]) {
    return NextResponse.json(
      {
        error: `Seul ADMIN ou ${STATION_ROLE_GUARD[station]} peut refuser en bloc.`,
      },
      { status: 403 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  const reasonCode = String(body.reason_code ?? "").toLowerCase()
  if (!isRefusalReasonCode(reasonCode)) {
    return NextResponse.json({ error: "reason_code invalide" }, { status: 400 })
  }
  const reasonCodeTyped: RefusalReasonCode = reasonCode

  const reasonNote =
    typeof body.reason_note === "string" ? body.reason_note.trim().slice(0, 500) : ""
  const orderId = typeof body.order_id === "string" && body.order_id ? body.order_id : null

  const supabase = createServiceRoleClient()

  // On utilise la fonction RPC créée dans la migration 29 pour atomicité.
  const rpc = await supabase.rpc("refuse_order_items_bulk", {
    p_station: station,
    p_reason_code: reasonCodeTyped,
    p_reason_note: reasonNote || null,
    p_actor: guard.user.id,
    p_order_id: orderId,
  })

  if (rpc.error) {
    // Fallback sans RPC (par ex. migration non encore appliquée)
    const fallback = await fallbackBulk({
      supabase,
      station,
      reasonCode: reasonCodeTyped,
      reasonNote: reasonNote || null,
      orderId,
      actor: guard.user.id,
    })
    if (!fallback.ok) {
      return NextResponse.json(
        { error: rpc.error.message, fallbackError: fallback.error },
        { status: 500 },
      )
    }
    await insertCaisseAudit(supabase, {
      userId: guard.user.id,
      userEmail: guard.user.email ?? null,
      action: "order_item.refuse_bulk",
      entityType: "station",
      entityId: station,
      newValues: {
        refused_count: fallback.count,
        reason_code: reasonCodeTyped,
        reason_note: reasonNote || null,
        order_id: orderId,
        method: "fallback",
      },
      metadata: { role: guard.role },
    })
    return NextResponse.json({
      ok: true,
      refused_count: fallback.count,
      method: "fallback",
    })
  }

  const refusedCount =
    Array.isArray(rpc.data) && rpc.data.length > 0
      ? Number((rpc.data[0] as { refused_count?: number }).refused_count ?? 0)
      : 0

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "order_item.refuse_bulk",
    entityType: "station",
    entityId: station,
    newValues: {
      refused_count: refusedCount,
      reason_code: reasonCodeTyped,
      reason_note: reasonNote || null,
      order_id: orderId,
    },
    metadata: { role: guard.role },
  })

  return NextResponse.json({ ok: true, refused_count: refusedCount, method: "rpc" })
}

async function fallbackBulk(args: {
  supabase: ReturnType<typeof createServiceRoleClient>
  station: Station
  reasonCode: RefusalReasonCode
  reasonNote: string | null
  orderId: string | null
  actor: string
}): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const { supabase, station, reasonCode, reasonNote, orderId, actor } = args

  let q = supabase
    .from("order_items")
    .select("id, order_id, station_status")
    .eq("station", station)
    .in("station_status", ["new", "accepted"])
  if (orderId) q = q.eq("order_id", orderId)

  const { data: rows, error } = await q
  if (error) return { ok: false, error: error.message }
  if (!rows || rows.length === 0) return { ok: true, count: 0 }

  const ids = rows.map((r) => r.id as string)

  const upd = await supabase
    .from("order_items")
    .update({
      station_status: "refused",
      refusal_reason: reasonCode,
      refusal_note: reasonNote,
      refused_by: actor,
    })
    .in("id", ids)
  if (upd.error) return { ok: false, error: upd.error.message }

  const refusalRows = rows.map((r) => ({
    order_item_id: r.id as string,
    order_id: r.order_id as string,
    station,
    reason_code: reasonCode,
    reason_note: reasonNote,
    previous_status: r.station_status as string,
    bulk_refuse: true,
    refused_by: actor,
  }))
  const ins = await supabase.from("order_item_refusals").insert(refusalRows)
  if (ins.error) return { ok: false, error: ins.error.message }

  return { ok: true, count: rows.length }
}
