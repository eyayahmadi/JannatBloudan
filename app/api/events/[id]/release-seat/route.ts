import { type NextRequest, NextResponse } from "next/server"
import { requireRoles } from "@/lib/auth/admin-api"
import { getTicket, updateTicket } from "@/lib/events/tickets-store"
import { offerNextWaitlistAfterCancellation } from "@/lib/events/waitlist-service"
import { fetchEventPublicRow } from "@/lib/events/event-queries"
import { groupPartySize, ticketHeadcount } from "@/lib/events/event-pricing"

type Params = { params: Promise<{ id: string }> }
const STAFF = ["ADMIN", "SERVER", "CASHIER", "KITCHEN", "BAR", "SHISHA"] as const

/** Libération forcée par le staff (même flux qu’une annulation). */
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireRoles(STAFF)
  if (!guard.ok) return guard.response

  try {
    const { id: eventId } = await params
    const body = (await req.json()) as { ticketCode?: string }
    const code = body.ticketCode?.trim()
    if (!eventId || !code) return NextResponse.json({ error: "ticketCode requis" }, { status: 400 })

    const ticket = await getTicket(code)
    if (!ticket || ticket.eventId !== eventId) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 })
    }

    const ev = await fetchEventPublicRow(eventId)
    const gs = ev ? groupPartySize(ev as never) : 6
    const freed = ticketHeadcount(ticket, gs)

    await updateTicket(code, {
      status: "cancelled",
      paid: false,
      paymentStatus: "refunded",
      cancelledAt: new Date().toISOString(),
    })

    await offerNextWaitlistAfterCancellation(eventId, freed)

    return NextResponse.json({ ok: true, freedSeats: freed })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
