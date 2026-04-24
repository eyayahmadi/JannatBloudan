/**
 * GET /api/stations/[station]
 * ---------------------------
 * Retourne la file d'attente d'une station (KITCHEN | BAR | SHISHA).
 * Source : vue `v_station_queue` (creee par migration 10-stations.sql).
 *
 * Query params:
 *   - status (optional): new | preparing | ready → filtre par statut
 *   - limit  (optional): nombre max d'items (default 50)
 */

import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { STATIONS, type Station } from "@/lib/stations/config"

function isStation(v: string): v is Station {
  return (STATIONS as string[]).includes(v.toUpperCase())
}

export async function GET(
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

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get("status")
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200)

  try {
    const supabase = await createClient()

    let query = supabase
      .from("v_station_queue")
      .select("*")
      .eq("station", stationParam)
      .order("order_created_at", { ascending: true })
      .limit(limit)

    if (statusFilter) {
      query = query.eq("station_status", statusFilter)
    }

    const { data, error } = await query

    if (error) {
      // Fallback si la vue n'existe pas (migration non appliquee)
      return NextResponse.json(
        {
          items: [],
          warning: `Vue v_station_queue indisponible. Applique scripts/10-stations.sql. (${error.message})`,
        },
        { status: 200 },
      )
    }

    // Stats complementaires
    const { data: stats } = await supabase
      .from("v_station_stats")
      .select("*")
      .eq("station", stationParam)
      .maybeSingle()

    return NextResponse.json({
      station: stationParam,
      items: data ?? [],
      stats: stats ?? null,
    })
  } catch (err) {
    return NextResponse.json(
      {
        items: [],
        warning: `Supabase indisponible: ${err instanceof Error ? err.message : "unknown"}`,
      },
      { status: 200 },
    )
  }
}
