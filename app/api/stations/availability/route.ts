/**
 * GET /api/stations/availability
 * --------------------------------
 * Retourne l'état de disponibilité courant des trois stations
 * (KITCHEN / BAR / SHISHA) tel que stocké dans `station_availability`.
 *
 * Réponse :
 *   {
 *     stations: [
 *       { station, status, reason, estimated_wait_minutes, closes_at,
 *         updated_at, accepting_orders, hide_in_menu },
 *       ...
 *     ]
 *   }
 *
 * Si Supabase n'est pas configuré (mode démo), on renvoie des stations OPEN.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { STATIONS } from "@/lib/stations/config"
import {
  AVAILABILITY_META,
  defaultStationAvailability,
  isValidAvailabilityStatus,
  type StationAvailabilityStatus,
} from "@/lib/stations/availability"

type Row = {
  station: string
  status: string
  reason: string | null
  estimated_wait_minutes: number | null
  closes_at: string | null
  updated_at: string
  updated_by: string | null
}

function toClient(row: Row | null, station: (typeof STATIONS)[number]) {
  if (!row || !isValidAvailabilityStatus(row.status)) {
    return defaultStationAvailability(station)
  }
  return {
    station,
    status: row.status as StationAvailabilityStatus,
    reason: row.reason,
    estimated_wait_minutes: row.estimated_wait_minutes,
    closes_at: row.closes_at,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
  }
}

export async function GET() {
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      stations: STATIONS.map((s) => {
        const v = defaultStationAvailability(s)
        const meta = AVAILABILITY_META[v.status]
        return {
          ...v,
          accepting_orders: meta.acceptingOrders,
          hide_in_menu: meta.hideInMenu,
        }
      }),
      source: "default",
    })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("station_availability")
      .select("station, status, reason, estimated_wait_minutes, closes_at, updated_at, updated_by")

    if (error) {
      return NextResponse.json(
        {
          stations: STATIONS.map((s) => {
            const v = defaultStationAvailability(s)
            const meta = AVAILABILITY_META[v.status]
            return { ...v, accepting_orders: meta.acceptingOrders, hide_in_menu: meta.hideInMenu }
          }),
          warning: `Table station_availability indisponible (migration 29 ?): ${error.message}`,
        },
        { status: 200 },
      )
    }

    const byStation = new Map<string, Row>()
    for (const row of (data ?? []) as Row[]) {
      byStation.set(row.station, row)
    }

    const stations = STATIONS.map((s) => {
      const v = toClient(byStation.get(s) ?? null, s)
      const meta = AVAILABILITY_META[v.status]
      return {
        ...v,
        accepting_orders: meta.acceptingOrders,
        hide_in_menu: meta.hideInMenu,
      }
    })

    return NextResponse.json({ stations, source: "supabase" })
  } catch (err) {
    return NextResponse.json(
      {
        stations: STATIONS.map((s) => {
          const v = defaultStationAvailability(s)
          const meta = AVAILABILITY_META[v.status]
          return { ...v, accepting_orders: meta.acceptingOrders, hide_in_menu: meta.hideInMenu }
        }),
        warning: err instanceof Error ? err.message : "Erreur lecture availability",
      },
      { status: 200 },
    )
  }
}
