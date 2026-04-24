import { NextResponse } from "next/server"

import {
  generateTicketCode,
  listTicketsForEvent,
  saveTicket,
  type ParticipantTicket,
} from "@/lib/events/tickets-store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("eventId")?.trim()
  if (!eventId) return NextResponse.json({ error: "eventId requis" }, { status: 400 })
  const tickets = await listTicketsForEvent(eventId)
  const summary = tickets.reduce(
    (acc, t) => {
      acc.count += 1
      acc.revenue += t.paid ? t.totalAmount : 0
      acc.checkedIn += t.status === "checked_in" ? 1 : 0
      return acc
    },
    { count: 0, revenue: 0, checkedIn: 0 },
  )
  return NextResponse.json({ tickets, summary })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ParticipantTicket> & {
      payNow?: boolean
    }
    const eventId = body.eventId?.trim()
    const guestName = body.guestName?.trim()
    const guestEmail = body.guestEmail?.trim()
    if (!eventId || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: "Champs requis: eventId, guestName, guestEmail" },
        { status: 400 },
      )
    }

    const adults = Math.max(0, Number(body.adults ?? 1))
    const children = Math.max(0, Number(body.children ?? 0))
    if (adults + children < 1) {
      return NextResponse.json({ error: "Au moins un participant requis" }, { status: 400 })
    }
    const unitPriceAdult = Math.max(0, Number(body.unitPriceAdult ?? 0))
    const unitPriceChild = Math.max(0, Number(body.unitPriceChild ?? unitPriceAdult * 0.6))
    const totalAmount = adults * unitPriceAdult + children * unitPriceChild

    const ticket: ParticipantTicket = {
      code: generateTicketCode(),
      eventId,
      eventTitle: body.eventTitle,
      guestName,
      guestEmail,
      guestPhone: body.guestPhone,
      adults,
      children,
      unitPriceAdult,
      unitPriceChild,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paid: Boolean(body.payNow),
      status: body.payNow ? "paid" : "pending",
      createdAt: new Date().toISOString(),
      specialRequests: body.specialRequests,
    }
    await saveTicket(ticket)
    return NextResponse.json({ ticket }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
