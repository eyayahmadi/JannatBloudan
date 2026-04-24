import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("event_reservations")
      .select(
        "id, event_id, user_id, guest_name, guest_email, guest_phone, number_of_guests, status, special_requests, created_at, events ( title, event_date, start_time, end_time )"
      )
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reservations: data ?? [] }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const requiredFields = ["eventId", "name", "email", "phone", "guests"]

    for (const field of requiredFields) {
      if (!payload[field]) {
        return NextResponse.json({ error: `Champ manquant: ${field}` }, { status: 400 })
      }
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!payload.eventId || !uuidRegex.test(payload.eventId)) {
      return NextResponse.json({ error: "Identifiant d'événement invalide" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("event_reservations")
      .insert([
        {
          event_id: payload.eventId,
          user_id: payload.userId ?? null,
          guest_name: payload.name,
          guest_email: payload.email,
          guest_phone: payload.phone,
          number_of_guests: payload.guests,
          special_requests: payload.message ?? null,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reservation: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
