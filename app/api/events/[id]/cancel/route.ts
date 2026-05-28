import { type NextRequest, NextResponse } from "next/server"
import { getTicket, updateTicket } from "@/lib/events/tickets-store"
import { ticketHeadcount, groupPartySize } from "@/lib/events/event-pricing"
import { offerNextWaitlistAfterCancellation } from "@/lib/events/waitlist-service"
import { fetchEventPublicRow } from "@/lib/events/event-queries"

type Params = { params: Promise<{ id: string }> }

/** Annulation réservation ticket + tentative file d’attente. Usage client (code) ou staff (interne ultérieurement). */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: eventId } = await params
    const body = (await req.json()) as { ticketCode?: string }
    const code = body.ticketCode?.trim()
    if (!eventId || !code) return NextResponse.json({ error: "ticketCode requis" }, { status: 400 })

    const ticket = await getTicket(code)
    if (!ticket || ticket.eventId !== eventId) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 })
    }

    if (ticket.status === "cancelled") {
      return NextResponse.json({ ok: true, alreadyCancelled: true })
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
