import { type NextRequest, NextResponse } from "next/server"
import { requireRoles } from "@/lib/auth/admin-api"
import { createClient } from "@/lib/supabase/server"
import { getAvailabilityForEvent } from "@/lib/events/event-availability"
import { adultUnitPrice, childUnitPrice, groupPartySize, groupUnitPrice, vipUnitPrice } from "@/lib/events/event-pricing"
import { fetchEventPublicRow } from "@/lib/events/event-queries"

const STAFF = ["ADMIN", "SERVER", "CASHIER", "KITCHEN", "BAR", "SHISHA"] as const

type Params = { params: Promise<{ id: string }> }

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const p = await params
    const url = new URL(_request.url)
    const pathId = url.pathname.split("/").filter(Boolean).pop()
    const id = p?.id ?? pathId

    if (!id) {
      return NextResponse.json({ error: "Identifiant d'événement manquant" }, { status: 400 })
    }

    const row = await fetchEventPublicRow(id)
    if (!row) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })
    }

    const maxRaw = row.max_attendees != null ? Number(row.max_attendees) : null
    const max = maxRaw != null && Number.isFinite(maxRaw) ? maxRaw : null

    const pricingKey = row as never
    const adultPx = adultUnitPrice(pricingKey)
    const availability = await getAvailabilityForEvent(id, max, pricingKey)

    const event = {
      id: row.id,
      title: row.title as string,
      description: (row.description as string) ?? undefined,
      event_date: row.event_date as string,
      start_time: row.start_time as string,
      end_time: (row.end_time as string) ?? undefined,
      location: (row.location as string) ?? undefined,
      image_url: (row.image_url as string) ?? undefined,
      max_attendees: max,
      capacity: max ?? undefined,
      current_attendees: (row.current_attendees as number) ?? undefined,
      is_available: row.is_available !== false,
      /** @deprecated utiliser price_adult */
      price: adultPx,
      price_adult: row.price_adult != null ? Number(row.price_adult) : adultPx,
      price_child: row.price_child != null ? Number(row.price_child) : null,
      price_vip: row.price_vip != null ? Number(row.price_vip) : null,
      price_group: row.price_group != null ? Number(row.price_group) : null,
      group_party_size: groupPartySize(pricingKey),
      allow_online_pay: row.allow_online_pay !== false,
      allow_pay_at_venue: row.allow_pay_at_venue !== false,
      payment_hold_minutes: Number(row.payment_hold_minutes ?? 20),
      waitlist_offer_minutes: Number(row.waitlist_offer_minutes ?? 120),
      availability,
      pricing: {
        currency: "EUR",
        adult: adultPx,
        child: childUnitPrice(pricingKey, adultPx),
        vip: vipUnitPrice(pricingKey, adultPx),
        groupPerPack: groupUnitPrice(pricingKey, adultPx),
      },
    }

    return NextResponse.json({ event }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const guard = await requireRoles(STAFF)
  if (!guard.ok) return guard.response

  try {
    const p = await params
    const id = p?.id
    if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 })

    const body = (await request.json()) as Record<string, unknown>

    const patch: Record<string, unknown> = {}
    if (typeof body.title === "string") patch.title = body.title.trim().slice(0, 200)
    if (typeof body.description === "string") patch.description = body.description
    if (typeof body.event_date === "string") patch.event_date = body.event_date.trim()
    if (typeof body.start_time === "string") patch.start_time = body.start_time.trim().length === 5 ? `${body.start_time}:00` : body.start_time.trim()
    if (typeof body.end_time === "string") {
      const et = body.end_time.trim()
      patch.end_time = et.length === 5 ? `${et}:00` : et.length ? et : null
    }
    if (typeof body.location === "string") patch.location = body.location.trim() || null

    const mx = numOrNull(body.max_attendees)
    if (mx !== null) patch.max_attendees = mx

    for (const key of ["price", "price_adult", "price_child", "price_vip", "price_group"]) {
      const n = numOrNull(body[key])
      if (n !== null) patch[key] = n
    }

    if (body.group_party_size != null) {
      const g = Math.floor(Number(body.group_party_size))
      if (Number.isFinite(g) && g >= 2) patch.group_party_size = g
    }

    for (const key of ["payment_hold_minutes", "waitlist_offer_minutes"]) {
      const n = Math.floor(Number(body[key]))
      if (Number.isFinite(n) && n > 0) patch[key] = n
    }

    if (typeof body.allow_online_pay === "boolean") patch.allow_online_pay = body.allow_online_pay
    if (typeof body.allow_pay_at_venue === "boolean") patch.allow_pay_at_venue = body.allow_pay_at_venue

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Aucun champ a mettre a jour" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.from("events").update(patch).eq("id", id).select("*").maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })

    return NextResponse.json({ event: data })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
