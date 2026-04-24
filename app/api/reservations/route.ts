import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("table_reservations")
      .select(
        "id, reservation_date, reservation_time, number_of_guests, guest_name, guest_email, guest_phone, special_requests, status"
      )
      .order("reservation_date", { ascending: false })
      .order("reservation_time", { ascending: false })

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
    const requiredFields = ["date", "time", "guests", "name", "email", "phone"]

    for (const field of requiredFields) {
      if (!payload[field]) {
        return NextResponse.json({ error: `Champ manquant: ${field}` }, { status: 400 })
      }
    }

    const supabase = await createClient()

    const specialRequests = [
      payload.specialRequest,
      payload.tableNumber ? `Table: ${payload.tableNumber}` : null,
      payload.zone ? `Zone: ${payload.zone}` : null,
    ]
      .filter(Boolean)
      .join(" | ")

    const { data, error } = await supabase
      .from("table_reservations")
      .insert([
        {
          reservation_date: payload.date,
          reservation_time: payload.time,
          number_of_guests: payload.guests,
          guest_name: payload.name,
          guest_email: payload.email,
          guest_phone: payload.phone,
          special_requests: specialRequests || null,
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
