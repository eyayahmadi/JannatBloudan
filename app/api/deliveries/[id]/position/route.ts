/**
 * POST /api/deliveries/:id/position
 * body : { lat, lng, estimated_minutes? }
 * Mise a jour de la position GPS du livreur (high-frequency).
 */
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const body = await request.json()
    const lat = Number(body.lat)
    const lng = Number(body.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "Coordonnees invalides" },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const updates: Record<string, unknown> = {
      driver_lat: lat,
      driver_lng: lng,
      position_updated_at: new Date().toISOString(),
    }
    if (body.estimated_minutes !== undefined) {
      updates.estimated_minutes = body.estimated_minutes
    }

    const { data, error } = await supabase
      .from("delivery_trackings")
      .update(updates)
      .eq("id", id)
      .select("id,driver_lat,driver_lng,estimated_minutes,position_updated_at")
      .maybeSingle()

    if (error) {
      // Fallback silencieux : le client synchronise via localStorage
      return NextResponse.json(
        { ok: true, _source: "fallback", _warning: error.message },
        { status: 200 },
      )
    }

    return NextResponse.json({ ok: true, position: data, _source: "supabase" })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    )
  }
}
