import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRoles } from "@/lib/auth/admin-api"
import { listTicketsForEvent } from "@/lib/events/tickets-store"

/** Tickets événements pour la caisse : synthèse par événement + lignes paiement */
export async function GET(req: Request) {
  const guard = await requireRoles(["ADMIN", "CASHIER"])
  if (!guard.ok) return guard.response

  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)

    const supabase = await createClient()
    const { data: events, error } = await supabase
      .from("events")
      .select("id, title, event_date, start_time, max_attendees")
      .eq("event_date", date)
      .order("start_time", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = await Promise.all(
      (events ?? []).map(async (ev: { id: string; title: string }) => {
        const tickets = await listTicketsForEvent(ev.id)
        let revenuePaid = 0
        let pendingVenue = 0
        let stripePaid = 0
        for (const t of tickets) {
          if (t.status === "cancelled") continue
          if (t.paid && t.paymentMethod === "stripe") {
            revenuePaid += t.totalAmount
            stripePaid += t.totalAmount
          } else if (t.paid) {
            revenuePaid += t.totalAmount
          } else if (t.paymentMethod !== "stripe") {
            pendingVenue += t.totalAmount
          }
        }
        return {
          event: ev,
          ticketCount: tickets.filter((t) => t.status !== "cancelled").length,
          tickets,
          totals: {
            revenuePaidEUR: Math.round(revenuePaid * 100) / 100,
            awaitingVenueEUR: Math.round(pendingVenue * 100) / 100,
            stripeEUR: Math.round(stripePaid * 100) / 100,
          },
        }
      }),
    )

    return NextResponse.json({ date, events: rows })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
