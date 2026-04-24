import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const reservationId: string | undefined = body.reservationId
    const channel: string = body.channel || "email"
    const message: string | undefined = body.message
    const provider: string = body.provider || "simulation"

    if (!reservationId) {
      return NextResponse.json({ error: "reservationId requis" }, { status: 400 })
    }

    const sentAt = new Date().toISOString()

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json({
        success: true,
        source: "mock",
        reservationId,
        channel,
        sentAt,
        message: "Rappel envoye avec succes (simulation)",
      })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("reservation_reminders")
      .insert({
        reservation_id: reservationId,
        channel,
        provider,
        message: message ?? `Rappel ${channel} automatique`,
        success: true,
        sent_at: sentAt,
      })
      .select("*")
      .maybeSingle()

    if (error) {
      console.error("[reservations/reminders] error", error)
      return NextResponse.json(
        { error: error.message, source: "supabase-error" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      source: "supabase",
      reminder: data,
      reservationId,
      sentAt,
    })
  } catch (err) {
    console.error("[reservations/reminders] exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reservationId = searchParams.get("reservationId")

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ reminders: [], source: "mock" })
  }

  try {
    const supabase = await createClient()
    let query = supabase
      .from("reservation_reminders")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(50)

    if (reservationId) query = query.eq("reservation_id", reservationId)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ reminders: [], error: error.message })
    }

    return NextResponse.json({ reminders: data ?? [], source: "supabase" })
  } catch (err) {
    console.error("[reservations/reminders] GET exception", err)
    return NextResponse.json({ reminders: [], source: "mock-fallback" })
  }
}
