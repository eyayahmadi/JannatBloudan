/**
 * GET   /api/deliveries/:id        -> detail d'une livraison
 * PATCH /api/deliveries/:id        -> mise a jour du status (et timestamps)
 */
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("delivery_trackings")
      .select("*")
      .or(`id.eq.${id},order_id.eq.${id}`)
      .maybeSingle()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ delivery: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    )
  }
}

const STATUS_TIMESTAMPS: Record<string, string> = {
  assigned: "assigned_at",
  picked_up: "picked_up_at",
  en_route: "en_route_at",
  delivered: "delivered_at",
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const body = await request.json()
    const supabase = await createClient()
    const updates: Record<string, unknown> = {}
    if (body.status) {
      updates.status = body.status
      const tsField = STATUS_TIMESTAMPS[body.status]
      if (tsField) updates[tsField] = new Date().toISOString()
    }
    if (body.driver_id !== undefined) updates.driver_id = body.driver_id
    if (body.estimated_minutes !== undefined) {
      updates.estimated_minutes = body.estimated_minutes
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucun champ a mettre a jour" }, { status: 400 })
    }
    const { data, error } = await supabase
      .from("delivery_trackings")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ delivery: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    )
  }
}
