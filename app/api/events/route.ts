import { type NextRequest, NextResponse } from "next/server"
import { requireRoles } from "@/lib/auth/admin-api"
import { getAvailabilityForEvent } from "@/lib/events/event-availability"
import { adultUnitPrice, type EventPricingRow } from "@/lib/events/event-pricing"
import { createClient } from "@/lib/supabase/server"

const STAFF_CREATE_ROLES = ["ADMIN", "SERVER", "CASHIER", "KITCHEN", "BAR", "SHISHA"] as const

function normalizeTime(t: string): string {
  const s = t.trim()
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`
  return s
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const events = await Promise.all(
      (data ?? []).map(async (row: Record<string, unknown> & { id: string }) => {
        const pricingRow = row as unknown as EventPricingRow
        const max = row.max_attendees != null ? Number(row.max_attendees) : null
        const availability = await getAvailabilityForEvent(row.id, max, pricingRow)
        const price_adult_eur = adultUnitPrice(pricingRow)
        return {
          ...row,
          capacity: row.max_attendees ?? undefined,
          availability,
          price_adult_eur,
        }
      }),
    )

    return NextResponse.json({ events }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireRoles(STAFF_CREATE_ROLES)
  if (!guard.ok) return guard.response

  try {
    const body = (await req.json()) as Record<string, unknown>
    const title = typeof body.title === "string" ? body.title.trim() : ""
    const eventDate = typeof body.event_date === "string" ? body.event_date.trim() : ""
    const startRaw = typeof body.start_time === "string" ? body.start_time.trim() : ""
    if (!title || !eventDate || !startRaw) {
      return NextResponse.json(
        { error: "title, event_date et start_time sont requis" },
        { status: 400 },
      )
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      return NextResponse.json({ error: "event_date doit etre au format YYYY-MM-DD" }, { status: 400 })
    }

    const description =
      typeof body.description === "string" && body.description.trim() ? body.description.trim() : null
    const start_time = normalizeTime(startRaw)
    const endRaw = typeof body.end_time === "string" ? body.end_time.trim() : ""
    const end_time = endRaw ? normalizeTime(endRaw) : null
    const location =
      typeof body.location === "string" && body.location.trim() ? body.location.trim() : null

    let max_attendees: number | null = null
    if (body.max_attendees != null && body.max_attendees !== "") {
      const n = Number(body.max_attendees)
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: "max_attendees invalide" }, { status: 400 })
      }
      max_attendees = Math.floor(n)
    }

    const insertPayload: Record<string, unknown> = {
      title,
      description,
      event_date: eventDate,
      start_time,
      end_time,
      location,
      max_attendees,
    }

    function optPrice(key: string) {
      if (body[key] == null || body[key] === "") return
      const n = Number(body[key])
      if (Number.isFinite(n) && n >= 0) insertPayload[key] = Math.round(n * 100) / 100
    }
    optPrice("price_adult")
    optPrice("price_child")
    optPrice("price_vip")
    optPrice("price_group")
    if (typeof body.group_party_size !== "undefined" && body.group_party_size !== "") {
      const g = Math.floor(Number(body.group_party_size))
      if (Number.isFinite(g) && g >= 2) insertPayload.group_party_size = g
    }
    if (typeof body.payment_hold_minutes !== "undefined") {
      const n = Math.floor(Number(body.payment_hold_minutes))
      if (Number.isFinite(n) && n > 0) insertPayload.payment_hold_minutes = n
    }
    if (typeof body.waitlist_offer_minutes !== "undefined") {
      const n = Math.floor(Number(body.waitlist_offer_minutes))
      if (Number.isFinite(n) && n > 0) insertPayload.waitlist_offer_minutes = n
    }
    if (typeof body.allow_online_pay === "boolean") insertPayload.allow_online_pay = body.allow_online_pay
    if (typeof body.allow_pay_at_venue === "boolean") insertPayload.allow_pay_at_venue = body.allow_pay_at_venue

    const supabase = await createClient()
    const { data, error } = await supabase.from("events").insert(insertPayload).select("*").single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        event: {
          ...data,
          capacity: data.max_attendees ?? undefined,
        },
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
