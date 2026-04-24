import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    // Fallback extraction in case params is undefined (turbopack/hmr edge cases)
    const url = new URL(_request.url)
    const pathId = url.pathname.split("/").filter(Boolean).pop()
    const id = p?.id ?? pathId

    if (!id) {
      return NextResponse.json({ error: "Identifiant d'événement manquant" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, event_date, start_time, end_time")
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })
    }

    return NextResponse.json({ event: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
