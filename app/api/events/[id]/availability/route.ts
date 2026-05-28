import { NextResponse } from "next/server"
import { getAvailabilityForEvent } from "@/lib/events/event-availability"
import { adultUnitPrice, childUnitPrice, groupPartySize, groupUnitPrice, vipUnitPrice } from "@/lib/events/event-pricing"
import { fetchEventPublicRow } from "@/lib/events/event-queries"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 })

    const row = await fetchEventPublicRow(id)
    if (!row) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })

    const pricingRow = row as import("@/lib/events/event-pricing").EventPricingRow
    const max = row.max_attendees != null ? Number(row.max_attendees) : null
    const adultPx = adultUnitPrice(pricingRow)
    const availability = await getAvailabilityForEvent(id, max, pricingRow)

    return NextResponse.json({
      availability,
      pricing: {
        currency: "EUR",
        adult: adultPx,
        child: childUnitPrice(pricingRow, adultPx),
        vip: vipUnitPrice(pricingRow, adultPx),
        groupPerPack: groupUnitPrice(pricingRow, adultPx),
        groupPartySize: groupPartySize(pricingRow),
      },
      event: {
        id: row.id,
        title: row.title,
        event_date: row.event_date,
        start_time: row.start_time,
        end_time: row.end_time ?? null,
        location: row.location ?? null,
        allow_online_pay: row.allow_online_pay !== false,
        allow_pay_at_venue: row.allow_pay_at_venue !== false,
        payment_hold_minutes: Number(row.payment_hold_minutes ?? 20),
      },
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
