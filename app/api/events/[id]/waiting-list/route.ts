import { type NextRequest, NextResponse } from "next/server"
import { requireRoles } from "@/lib/auth/admin-api"
import { getAvailabilityForEvent } from "@/lib/events/event-availability"
import { insertWaitlistEntry, listWaitlistForEvent } from "@/lib/events/waitlist-service"
import { fetchEventPublicRow } from "@/lib/events/event-queries"

const STAFF = ["ADMIN", "SERVER", "CASHIER", "KITCHEN", "BAR", "SHISHA"] as const

type Params = { params: Promise<{ id: string }> }

/** Liste (staff) ou inscription (public si complet). */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: eventId } = await params
    if (!eventId) return NextResponse.json({ error: "id manquant" }, { status: 400 })

    const body = (await req.json()) as Record<string, unknown>
    const name = String(body.guestName ?? body.name ?? "").trim()
    const email = String(body.guestEmail ?? body.email ?? "").trim()
    const phone = String(body.guestPhone ?? body.phone ?? "").trim()
    const partySize = Math.max(1, Math.floor(Number(body.partySize ?? body.party_size ?? 1)))

    if (!name || !email) {
      return NextResponse.json({ error: "nom et email requis" }, { status: 400 })
    }

    const row = await fetchEventPublicRow(eventId)
    if (!row) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })

    const max = row.max_attendees != null ? Number(row.max_attendees) : null
    const availability = await getAvailabilityForEvent(eventId, max, row as never)

    if (!availability.capped) {
      return NextResponse.json(
        { error: "Capacité non limitée : pas de liste d'attente pour cet événement.", code: "unlimited" },
        { status: 400 },
      )
    }

    if (!availability.isFull && !body.force) {
      return NextResponse.json(
        { error: "Des places sont encore disponibles — reservez normalement.", code: "not_full" },
        { status: 400 },
      )
    }

    const ins = await insertWaitlistEntry({ eventId, guestName: name, guestEmail: email, guestPhone: phone, partySize })
    if (!ins.ok) return NextResponse.json({ error: ins.error }, { status: 500 })

    return NextResponse.json({ ok: true, waitlistId: ins.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireRoles(STAFF)
  if (!guard.ok) return guard.response

  try {
    const { id: eventId } = await params
    if (!eventId) return NextResponse.json({ error: "id manquant" }, { status: 400 })

    const list = await listWaitlistForEvent(eventId)
    return NextResponse.json({ waitlist: list })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
