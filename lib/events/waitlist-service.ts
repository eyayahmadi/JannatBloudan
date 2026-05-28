import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { getAvailabilityForEvent } from "@/lib/events/event-availability"
import type { EventPricingRow } from "@/lib/events/event-pricing"
import { logWaitlistOffer } from "@/lib/notifications/event-waitlist-notify"

export type WaitlistRow = {
  id: string
  event_id: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  party_size: number
  status: string
  offered_at: string | null
  offer_expires_at: string | null
  notification_sent_at: string | null
  created_at: string
}

export async function insertWaitlistEntry(input: {
  eventId: string
  guestName: string
  guestEmail: string
  guestPhone: string
  partySize: number
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!hasServerSupabaseEnv()) {
    return { ok: false, error: "Base de données indisponible" }
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("event_waitlist")
    .insert({
      event_id: input.eventId,
      guest_name: input.guestName.trim(),
      guest_email: input.guestEmail.trim().toLowerCase(),
      guest_phone: input.guestPhone.trim() || null,
      party_size: Math.max(1, Math.floor(input.partySize)),
      status: "queued",
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, id: data.id as string }
}

export async function listWaitlistForEvent(eventId: string): Promise<WaitlistRow[]> {
  if (!hasServerSupabaseEnv()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("event_waitlist")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })

  if (error) return []
  return (data ?? []) as WaitlistRow[]
}

async function fetchEventRow(eventId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle()
  if (error || !data) return null
  return data
}

/**
 * Après annulation : tente d’offrir la première entrée compatible FIFO.
 */
export async function offerNextWaitlistAfterCancellation(
  eventId: string,
  freedSeats: number,
): Promise<WaitlistRow | null> {
  if (!hasServerSupabaseEnv() || freedSeats < 1) return null

  const ev = await fetchEventRow(eventId)
  if (!ev) return null

  const pricing: EventPricingRow = ev
  const availability = await getAvailabilityForEvent(eventId, ev.max_attendees, pricing)
  if (!availability.capped) return null
  if ((availability.availablePlaces ?? 0) < 1) return null

  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from("event_waitlist")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(20)

  if (error || !rows?.length) return null

  const offerMins = Math.max(15, Number(ev.waitlist_offer_minutes ?? 120))
  const now = Date.now()
  const expires = new Date(now + offerMins * 60_000).toISOString()

  for (const row of rows as WaitlistRow[]) {
    if (row.party_size > freedSeats) continue
    if (row.party_size > (availability.availablePlaces ?? 0)) continue

    const { error: up } = await supabase
      .from("event_waitlist")
      .update({
        status: "offered",
        offered_at: new Date(now).toISOString(),
        offer_expires_at: expires,
        notification_sent_at: new Date(now).toISOString(),
        notification_channel: "stub",
        updated_at: new Date(now).toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "queued")

    if (up) continue

    const title = typeof ev.title === "string" ? ev.title : "Événement"
    await logWaitlistOffer({
      eventId,
      waitlistId: row.id,
      guestEmail: row.guest_email,
      guestPhone: row.guest_phone ?? undefined,
      eventTitle: title,
      message: `Une place vient de se libérer pour « ${title} ». Réservez avant ${expires}.`,
    })

    return { ...row, status: "offered", offered_at: new Date(now).toISOString(), offer_expires_at: expires }
  }

  return null
}
