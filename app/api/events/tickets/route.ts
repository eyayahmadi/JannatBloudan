import { NextResponse } from "next/server"

import { getAvailabilityForEvent } from "@/lib/events/event-availability"
import {
  adultUnitPrice,
  childUnitPrice,
  groupPartySize,
  groupUnitPrice,
  ticketHeadcount,
  vipUnitPrice,
} from "@/lib/events/event-pricing"
import { fetchEventPublicRow } from "@/lib/events/event-queries"
import {
  generateTicketCode,
  listTicketsForEvent,
  saveTicket,
  type ParticipantTicket,
} from "@/lib/events/tickets-store"

function paymentMethodFromBody(raw: unknown): ParticipantTicket["paymentMethod"] {
  const s = String(raw ?? "stripe").toLowerCase()
  if (s === "cash" || s === "cash_at_venue") return "cash_at_venue"
  if (s === "card" || s === "card_at_venue") return "card_at_venue"
  return "stripe"
}

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
      acc.pendingPay += !t.paid && t.status !== "cancelled" ? 1 : 0
      acc.paidOnline += t.paymentMethod === "stripe" && t.paid ? 1 : 0
      acc.payAtVenue += t.paymentMethod !== "stripe" && t.status !== "cancelled" ? 1 : 0
      return acc
    },
    { count: 0, revenue: 0, checkedIn: 0, pendingPay: 0, paidOnline: 0, payAtVenue: 0 },
  )
  return NextResponse.json({ tickets, summary })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ParticipantTicket> & {
      payNow?: boolean
      deferPayment?: boolean
      paymentMethod?: string
      vipSeats?: number
      groupPackages?: number
      linkedTableSessionId?: string | null
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

    const evRow = await fetchEventPublicRow(eventId)
    if (!evRow) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })

    const paymentMethod = paymentMethodFromBody(body.paymentMethod)
    if (paymentMethod === "stripe" && evRow.allow_online_pay === false) {
      return NextResponse.json({ error: "Paiement en ligne desactive pour cet evenement" }, { status: 400 })
    }
    if ((paymentMethod === "cash_at_venue" || paymentMethod === "card_at_venue") && evRow.allow_pay_at_venue === false) {
      return NextResponse.json({ error: "Paiement au restaurant non autorise pour cet evenement" }, { status: 400 })
    }

    const pricing = evRow as never
    const adults = Math.max(0, Number(body.adults ?? 1))
    const children = Math.max(0, Number(body.children ?? 0))
    const vipSeats = Math.max(0, Number(body.vipSeats ?? 0))
    const groupPackages = Math.max(0, Number(body.groupPackages ?? 0))
    if (adults + children + vipSeats + groupPackages < 1) {
      return NextResponse.json({ error: "Au moins un participant requis" }, { status: 400 })
    }

    const gs = groupPartySize(pricing)
    const tmp: ParticipantTicket = {
      code: "",
      eventId,
      guestName,
      guestEmail,
      adults,
      children,
      vipSeats,
      groupPackages,
      unitPriceAdult: 0,
      unitPriceChild: 0,
      totalAmount: 0,
      paid: false,
      paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      createdAt: "",
    }
    const deltaHeadcount = ticketHeadcount(tmp, gs)

    const max = evRow.max_attendees != null ? Number(evRow.max_attendees) : null
    const availability = await getAvailabilityForEvent(eventId, max, pricing)
    if (availability.capped && (availability.reservedPlaces + deltaHeadcount > (availability.max ?? 0))) {
      return NextResponse.json(
        { error: "Capacite insuffisante", code: "full", availability },
        { status: 409 },
      )
    }

    const ap = adultUnitPrice(pricing)
    const uc = childUnitPrice(pricing, ap)
    const uv = vipUnitPrice(pricing, ap)
    const ug = groupUnitPrice(pricing, ap)
    const roundedTotal = Math.round((adults * ap + children * uc + vipSeats * uv + groupPackages * ug) * 100) / 100

    const holdMins = Math.max(5, Number(evRow.payment_hold_minutes ?? 20))
    /** Stripe + (paiement différé explicite OU payNow=false) => hold. Sinon => payé immédiatement (démo). */
    const useStripeHold = paymentMethod === "stripe" && (body.deferPayment === true || body.payNow === false)

    let paid = false
    let paymentStatus: ParticipantTicket["paymentStatus"] = "pending"
    let status: ParticipantTicket["status"] = "pending"
    let holdExpiresAt: string | undefined

    if (paymentMethod !== "stripe") {
      paid = false
      paymentStatus = "pending"
      status = "pending"
    } else if (useStripeHold) {
      holdExpiresAt = new Date(Date.now() + holdMins * 60_000).toISOString()
    } else {
      paid = true
      paymentStatus = "paid"
      status = "paid"
    }

    const ticket: ParticipantTicket = {
      code: generateTicketCode(),
      eventId,
      eventTitle: body.eventTitle,
      guestName,
      guestEmail,
      guestPhone: body.guestPhone,
      adults,
      children,
      vipSeats,
      groupPackages,
      unitPriceAdult: ap,
      unitPriceChild: uc,
      totalAmount: roundedTotal,
      paid,
      paymentMethod,
      paymentStatus,
      holdExpiresAt,
      linkedTableSessionId: body.linkedTableSessionId ?? null,
      cancelledAt: null,
      status,
      createdAt: new Date().toISOString(),
      specialRequests: body.specialRequests,
    }

    await saveTicket(ticket)

    const availabilityAfter = await getAvailabilityForEvent(eventId, max, pricing)

    return NextResponse.json(
      {
        ticket,
        availability: availabilityAfter,
        paymentHint: useStripeHold
          ? `Finalisez le paiement sous ${holdMins} minutes pour conserver la place (stub Stripe : POST .../payment).`
          : undefined,
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
