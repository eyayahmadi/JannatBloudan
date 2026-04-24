/**
 * PATCH /api/stations/items/[id]/advance
 * ---------------------------------------
 * Fait avancer le statut d'un item dans son cycle de vie:
 *   new → preparing → ready → served
 *
 * Body JSON (optionnel):
 *   { "to": "preparing" | "ready" | "served" }
 * Si `to` absent, on avance d'un cran.
 *
 * Le trigger `track_station_status_change` gere automatiquement
 * started_at / ready_at / served_at.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

type ItemStatus = "new" | "preparing" | "ready" | "served"

const NEXT: Partial<Record<ItemStatus, ItemStatus>> = {
  new: "preparing",
  preparing: "ready",
  ready: "served",
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: { to?: ItemStatus } = {}
  try {
    body = await request.json()
  } catch {
    /* empty body ok */
  }

  try {
    const supabase = await createClient()

    // Recupere le statut courant
    const { data: current, error: fetchErr } = await supabase
      .from("order_items")
      .select("id, station_status, station, order_id")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr || !current) {
      return NextResponse.json(
        { error: fetchErr?.message ?? "Item introuvable" },
        { status: 404 },
      )
    }

    const currentStatus = current.station_status as ItemStatus
    const target = body.to ?? NEXT[currentStatus]

    if (!target) {
      return NextResponse.json(
        { error: `Aucun statut suivant depuis "${currentStatus}"` },
        { status: 400 },
      )
    }

    const { data: updated, error: updateErr } = await supabase
      .from("order_items")
      .update({ station_status: target })
      .eq("id", id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({
      item: updated,
      transition: { from: currentStatus, to: target },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    )
  }
}
