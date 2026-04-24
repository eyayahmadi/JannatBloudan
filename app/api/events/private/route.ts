import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type EventRequestInput = {
  guestName: string
  guestEmail?: string
  guestPhone?: string
  eventType: "anniversaire" | "mariage" | "entreprise" | "prive" | "autre"
  eventDate: string
  eventTime?: string
  guestsCount: number
  estimatedBudget?: number
  packageId?: string
  customMenu?: unknown
  options?: unknown
  specialRequests?: string
  userId?: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const upcoming = searchParams.get("upcoming") === "true"

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ requests: [], packages: [], source: "mock" })
  }

  try {
    const supabase = await createClient()
    let query = supabase
      .from("event_requests")
      .select("*, package:event_packages(*)")
      .order("event_date", { ascending: true })

    if (status) query = query.eq("status", status)
    if (upcoming) query = query.gte("event_date", new Date().toISOString().slice(0, 10))

    const { data: requests, error } = await query
    if (error) {
      console.error("[events/private] list error", error)
      return NextResponse.json({ requests: [], error: error.message })
    }

    const { data: packages } = await supabase
      .from("event_packages")
      .select("*")
      .eq("active", true)
      .order("base_price", { ascending: true })

    return NextResponse.json({
      requests: requests ?? [],
      packages: packages ?? [],
      source: "supabase",
    })
  } catch (err) {
    console.error("[events/private] GET exception", err)
    return NextResponse.json({ requests: [], packages: [], source: "mock-fallback" })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EventRequestInput

    if (!body.guestName || !body.eventType || !body.eventDate || !body.guestsCount) {
      return NextResponse.json(
        { error: "guestName, eventType, eventDate, guestsCount requis" },
        { status: 400 },
      )
    }

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json(
        {
          request: {
            id: `EVR-${Date.now()}`,
            request_number: `EVR-LOCAL-${Date.now()}`,
            ...body,
            status: "pending",
            created_at: new Date().toISOString(),
          },
          source: "mock",
        },
        { status: 201 },
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("event_requests")
      .insert({
        user_id: body.userId ?? null,
        guest_name: body.guestName,
        guest_email: body.guestEmail ?? null,
        guest_phone: body.guestPhone ?? null,
        event_type: body.eventType,
        event_date: body.eventDate,
        event_time: body.eventTime ?? null,
        guests_count: body.guestsCount,
        estimated_budget: body.estimatedBudget ?? null,
        package_id: body.packageId ?? null,
        custom_menu: body.customMenu ?? null,
        options: body.options ?? null,
        special_requests: body.specialRequests ?? null,
        status: "pending",
      })
      .select("*, package:event_packages(*)")
      .single()

    if (error || !data) {
      console.error("[events/private] POST error", error)
      return NextResponse.json(
        { error: error?.message ?? "Insertion impossible" },
        { status: 500 },
      )
    }

    return NextResponse.json({ request: data, source: "supabase" }, { status: 201 })
  } catch (err) {
    console.error("[events/private] POST exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
