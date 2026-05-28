import { type NextRequest, NextResponse } from "next/server"
import { getTicket, updateTicket } from "@/lib/events/tickets-store"

type Params = { params: Promise<{ id: string }> }

/** Stub paiement Stripe : confirme le ticket si code valide pour cet événement. À remplacer par webhook Stripe réel. */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: eventId } = await params
    const body = (await req.json()) as { ticketCode?: string; simulateStripe?: boolean }
    const code = body.ticketCode?.trim()
    if (!eventId || !code) return NextResponse.json({ error: "eventId et ticketCode requis" }, { status: 400 })

    const ticket = await getTicket(code)
    if (!ticket || ticket.eventId !== eventId) {
      return NextResponse.json({ error: "Ticket introuvable pour cet événement" }, { status: 404 })
    }

    if (ticket.status === "cancelled") {
      return NextResponse.json({ error: "Ticket annulé" }, { status: 400 })
    }

    await updateTicket(code, {
      paid: true,
      paymentStatus: "paid",
      status: ticket.status === "checked_in" ? "checked_in" : "paid",
      holdExpiresAt: undefined,
    })

    const next = `/events/tickets/${encodeURIComponent(code)}`
    return NextResponse.json({
      ok: true,
      ticketCode: code,
      redirectUrl: next,
      message: body.simulateStripe ? "Paiement simulé (stub Stripe)" : "Paiement enregistré",
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
