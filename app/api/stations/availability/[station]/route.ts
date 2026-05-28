/**
 * GET    /api/stations/availability/[station]
 * PATCH  /api/stations/availability/[station]
 * -------------------------------------------
 * Permet à une station (KITCHEN / BAR / SHISHA) de :
 *   - lire son état courant
 *   - changer son statut (OPEN, BUSY, PAUSED, CLOSING_SOON, CLOSED)
 *   - définir une raison + un temps d'attente estimé
 *
 * Sécurité :
 *   - GET   : lecture libre pour les rôles staff (le menu client passe par /availability sans /[station])
 *   - PATCH : ADMIN, ou la station elle-même (ex: KITCHEN ne peut éditer que KITCHEN)
 *
 * Audit : la table `station_availability_log` est remplie automatiquement par trigger.
 * En complément on insère un événement applicatif `audit_logs.station_availability.update`.
 */

import { NextResponse, type NextRequest } from "next/server"
import {
  createServiceRoleClient,
  requireRoles,
} from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { STATIONS, type Station } from "@/lib/stations/config"
import {
  AVAILABILITY_META,
  defaultStationAvailability,
  isValidAvailabilityStatus,
  STATION_AVAILABILITY_STATUSES,
  type StationAvailabilityStatus,
} from "@/lib/stations/availability"
import { normalizeRole, type AppRole } from "@/lib/auth/roles"

const STAFF_ROLES: readonly AppRole[] = [
  "ADMIN",
  "KITCHEN",
  "BAR",
  "SHISHA",
  "SERVER",
  "CASHIER",
] as const

const STATION_ROLE_GUARD: Record<Station, AppRole> = {
  KITCHEN: "KITCHEN",
  BAR: "BAR",
  SHISHA: "SHISHA",
}

function isStation(v: string): v is Station {
  return (STATIONS as string[]).includes(v.toUpperCase())
}

function buildPayload(
  station: Station,
  row: {
    status: string
    reason: string | null
    estimated_wait_minutes: number | null
    closes_at: string | null
    updated_at: string
    updated_by: string | null
  } | null,
) {
  const v = row && isValidAvailabilityStatus(row.status)
    ? {
        station,
        status: row.status as StationAvailabilityStatus,
        reason: row.reason,
        estimated_wait_minutes: row.estimated_wait_minutes,
        closes_at: row.closes_at,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
      }
    : defaultStationAvailability(station)
  const meta = AVAILABILITY_META[v.status]
  return {
    ...v,
    accepting_orders: meta.acceptingOrders,
    hide_in_menu: meta.hideInMenu,
  }
}

export async function GET(
  _request: NextRequest,
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

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ availability: buildPayload(station, null), source: "default" })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from("station_availability")
      .select("status, reason, estimated_wait_minutes, closes_at, updated_at, updated_by")
      .eq("station", station)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        {
          availability: buildPayload(station, null),
          warning: `Table station_availability indisponible (migration 29 ?): ${error.message}`,
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ availability: buildPayload(station, data ?? null), source: "supabase" })
  } catch (err) {
    return NextResponse.json(
      {
        availability: buildPayload(station, null),
        warning: err instanceof Error ? err.message : "Erreur lecture availability",
      },
      { status: 200 },
    )
  }
}

export async function PATCH(
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

  // Sécurité station-spécifique : seul ADMIN ou la station correspondante peut éditer.
  const callerRole = normalizeRole(guard.role)
  const ownerRole = STATION_ROLE_GUARD[station]
  if (callerRole !== "ADMIN" && callerRole !== ownerRole) {
    return NextResponse.json(
      { error: `Seul ADMIN ou ${ownerRole} peut modifier la station ${station}.` },
      { status: 403 },
    )
  }

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  const status = String(body.status ?? "").toUpperCase()
  if (!STATION_AVAILABILITY_STATUSES.includes(status as StationAvailabilityStatus)) {
    return NextResponse.json(
      { error: `status invalide. Valeurs: ${STATION_AVAILABILITY_STATUSES.join(", ")}` },
      { status: 400 },
    )
  }

  const reason =
    typeof body.reason === "string" && body.reason.trim().length > 0
      ? body.reason.trim().slice(0, 240)
      : null

  const waitRaw = body.estimated_wait_minutes
  let estimatedWait: number | null = null
  if (typeof waitRaw === "number" && Number.isFinite(waitRaw)) {
    estimatedWait = Math.max(0, Math.min(240, Math.round(waitRaw)))
  } else if (typeof waitRaw === "string" && waitRaw.trim() !== "") {
    const n = Number(waitRaw)
    if (Number.isFinite(n)) estimatedWait = Math.max(0, Math.min(240, Math.round(n)))
  }

  const closesAt =
    typeof body.closes_at === "string" && body.closes_at.length > 0 ? body.closes_at : null

  const supabase = createServiceRoleClient()

  // Lit l'ancien état pour audit applicatif
  const { data: previous } = await supabase
    .from("station_availability")
    .select("status, reason, estimated_wait_minutes, closes_at")
    .eq("station", station)
    .maybeSingle()

  // Upsert (la migration 29 seed déjà la ligne mais on reste tolérant)
  const { data: row, error } = await supabase
    .from("station_availability")
    .upsert(
      {
        station,
        status,
        reason,
        estimated_wait_minutes: estimatedWait,
        closes_at: closesAt,
        updated_by: guard.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "station" },
    )
    .select("status, reason, estimated_wait_minutes, closes_at, updated_at, updated_by")
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: "Migration 29 (station_availability)" },
      { status: 500 },
    )
  }

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "station_availability.update",
    entityType: "station_availability",
    entityId: station,
    oldValues: previous ?? null,
    newValues: {
      status,
      reason,
      estimated_wait_minutes: estimatedWait,
      closes_at: closesAt,
    },
    metadata: { role: guard.role, station },
  })

  return NextResponse.json({
    ok: true,
    availability: buildPayload(station, row),
  })
}
