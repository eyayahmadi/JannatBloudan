import { listTicketsForEvent, type ParticipantTicket } from "@/lib/events/tickets-store"
import { groupPartySize, ticketHeadcount, type EventPricingRow } from "@/lib/events/event-pricing"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

async function countLegacyReservationGuests(eventId: string): Promise<number> {
  if (!hasServerSupabaseEnv()) return 0
  try {
    const supabase = await createClient()
    const { data } = await supabase.from("event_reservations").select("number_of_guests, status").eq("event_id", eventId)
    if (!data?.length) return 0
    return data.reduce((acc, row) => {
      const st = String((row as { status?: string }).status ?? "").toLowerCase()
      if (st.includes("annul") || st === "cancelled") return acc
      return acc + Math.max(0, Number((row as { number_of_guests?: number }).number_of_guests ?? 1))
    }, 0)
  } catch {
    return 0
  }
}

export type AvailabilityResult = {
  max: number | null
  /** Si false, aucune limite renseignée */
  capped: boolean
  reservedPlaces: number
  availablePlaces: number | null
  isFull: boolean
  fillPercent: number
  /** Tickets actifs détail */
  activeTicketsCount: number
}

function isHoldExpired(holdExpiresAt?: string): boolean {
  if (!holdExpiresAt) return false
  const t = new Date(holdExpiresAt).getTime()
  return Number.isFinite(t) && t < Date.now()
}

/** Réservation comptée dans la capacité (bloque une place ou en attente de paiement valide). */
export function ticketCountsTowardCapacity(t: ParticipantTicket, groupSize: number): boolean {
  if (t.status === "cancelled") return false
  if (t.paymentMethod === "stripe" && t.paymentStatus === "pending" && isHoldExpired(t.holdExpiresAt)) {
    return false
  }
  return ticketHeadcount(t, groupSize) > 0
}

export function sumReservedPlaces(tickets: ParticipantTicket[], groupSize: number): number {
  return tickets.reduce((sum, t) => {
    if (!ticketCountsTowardCapacity(t, groupSize)) return sum
    return sum + ticketHeadcount(t, groupSize)
  }, 0)
}

export async function getAvailabilityForEvent(
  eventId: string,
  maxAttendees: number | null | undefined,
  pricing: EventPricingRow,
): Promise<AvailabilityResult> {
  const tickets = await listTicketsForEvent(eventId)
  const gs = groupPartySize(pricing)
  const max = maxAttendees != null && Number.isFinite(Number(maxAttendees)) ? Math.max(0, Math.floor(Number(maxAttendees))) : null
  const capped = max != null && max > 0
  const fromTickets = sumReservedPlaces(tickets, gs)
  const fromReservations = await countLegacyReservationGuests(eventId)
  const reservedPlaces = fromTickets + fromReservations
  const availablePlaces = capped ? Math.max(0, max! - reservedPlaces) : null
  const isFull = capped && availablePlaces === 0
  const fillPercent = capped && max! > 0 ? Math.min(100, Math.round((reservedPlaces / max!) * 100)) : 0
  const activeTicketsCount = tickets.filter((t) => t.status !== "cancelled").length

  return {
    max: capped ? max : null,
    capped: Boolean(capped),
    reservedPlaces,
    availablePlaces,
    isFull,
    fillPercent,
    activeTicketsCount,
  }
}
