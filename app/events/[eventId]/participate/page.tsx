"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Calendar, Clock, Users, Ticket, CreditCard, Wallet } from "lucide-react"

import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Event = {
  id: string
  title: string
  description?: string
  event_date: string
  start_time: string
  end_time?: string
  capacity?: number
  price?: number
}

export default function ParticipateEventPage() {
  const params = useParams<{ eventId: string | string[] }>()
  const router = useRouter()
  const eventId =
    typeof params?.eventId === "string"
      ? params.eventId
      : Array.isArray(params?.eventId)
        ? params.eventId[0]
        : null

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [specialRequests, setSpecialRequests] = useState("")
  const [payNow, setPayNow] = useState(true)

  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.event) setEvent(body.event)
        else setError(body.error || "Evenement introuvable")
      })
      .catch(() => setError("Erreur reseau"))
      .finally(() => setLoading(false))
  }, [eventId])

  const unitAdult = event?.price ?? 0
  const unitChild = Math.round(unitAdult * 0.6 * 100) / 100
  const total = useMemo(() => adults * unitAdult + children * unitChild, [adults, children, unitAdult, unitChild])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!event) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/events/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          guestName,
          guestEmail,
          guestPhone,
          adults,
          children,
          unitPriceAdult: unitAdult,
          unitPriceChild: unitChild,
          specialRequests,
          payNow,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || "Erreur reservation")
        return
      }
      router.push(`/events/tickets/${body.ticket.code}`)
    } catch {
      setError("Erreur reseau")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell>
      <SiteHeader backHref="/events" backLabel="Evenements" />
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#2d2416] sm:text-4xl">Participer a l'evenement</h1>
          <p className="mt-1 text-[#8b6f47]">Buffet, karaoke ou soiree — reservez votre place.</p>
        </div>

        {loading ? (
          <p className="text-center text-[#8b6f47]">Chargement...</p>
        ) : error && !event ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">{error}</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-[#2d2416]">{event?.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[#5d4e37]">
                <p>{event?.description}</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#d4a574]" />
                  {event && new Date(event.event_date).toLocaleDateString("fr-FR")}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#d4a574]" />
                  {event?.start_time}
                  {event?.end_time ? ` — ${event.end_time}` : ""}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#d4a574]" />
                  {event?.capacity ? `${event.capacity} places` : "Capacite flexible"}
                </div>
                <div className="mt-3 rounded-lg bg-[#faf8f3] p-3 text-[#2d2416]">
                  <div className="flex justify-between">
                    <span>Adulte</span>
                    <span className="font-semibold">{unitAdult.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enfant</span>
                    <span className="font-semibold">{unitChild.toFixed(2)} €</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-[#2d2416]">Vos informations</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telephone</Label>
                      <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Adultes</Label>
                        <Input
                          type="number"
                          min={0}
                          value={adults}
                          onChange={(e) => setAdults(Math.max(0, Number(e.target.value)))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Enfants</Label>
                        <Input
                          type="number"
                          min={0}
                          value={children}
                          onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Demandes speciales</Label>
                    <Textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Table groupee, regime alimentaire, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPayNow(true)}
                      className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                        payNow
                          ? "border-[#d4a574] bg-[#faf8f3] text-[#2d2416]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="mr-2 inline h-4 w-4" /> Payer maintenant
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayNow(false)}
                      className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                        !payNow
                          ? "border-[#d4a574] bg-[#faf8f3] text-[#2d2416]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Wallet className="mr-2 inline h-4 w-4" /> Payer sur place
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-[#2d2416] px-4 py-3 text-white">
                    <span className="text-sm">Total estime</span>
                    <span className="text-lg font-bold">{total.toFixed(2)} €</span>
                  </div>

                  {error ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={submitting || adults + children < 1}
                    className="w-full bg-gradient-to-r from-[#d4a574] to-[#c19a5b]"
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    {submitting ? "Reservation..." : payNow ? "Payer & recevoir le ticket" : "Reserver ma place"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <SiteFooter />
    </PageShell>
  )
}
