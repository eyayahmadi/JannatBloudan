"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Calendar, Clock, Users, Ticket, CreditCard, Wallet, Building2, ListOrdered } from "lucide-react"

import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Availability = {
  capped: boolean
  isFull: boolean
  fillPercent: number
  reservedPlaces: number
  availablePlaces: number | null
  max: number | null
}

type EventDetail = {
  id: string
  title: string
  description?: string
  event_date: string
  start_time: string
  end_time?: string
  max_attendees?: number | null
  capacity?: number
  /** tarif legacy */
  price?: number
  group_party_size?: number
  allow_online_pay?: boolean
  allow_pay_at_venue?: boolean
  pricing?: {
    currency: string
    adult: number
    child: number
    vip: number
    groupPerPack: number
  }
  availability?: Availability
}

type PayMode = "stripe_instant" | "stripe_hold" | "cash_venue" | "card_venue"

export default function ParticipateEventPage() {
  const params = useParams<{ eventId: string | string[] }>()
  const router = useRouter()
  const eventId =
    typeof params?.eventId === "string"
      ? params.eventId
      : Array.isArray(params?.eventId)
        ? params.eventId[0]
        : null

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [vip, setVip] = useState(0)
  const [groupBlocks, setGroupBlocks] = useState(0)
  const [specialRequests, setSpecialRequests] = useState("")
  const [payMode, setPayMode] = useState<PayMode>("stripe_instant")

  const [wlName, setWlName] = useState("")
  const [wlEmail, setWlEmail] = useState("")
  const [wlPhone, setWlPhone] = useState("")
  const [wlParty, setWlParty] = useState(2)
  const [wlSending, setWlSending] = useState(false)

  const id = eventId

  useEffect(() => {
    if (!id) return
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.event) {
          const e = body.event as EventDetail
          if (e.max_attendees != null) e.capacity = e.max_attendees
          setEvent(e)
        } else setError(body.error || "Evenement introuvable")
      })
      .catch(() => setError("Erreur reseau"))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    setWlName(guestName)
    setWlEmail(guestEmail)
    setWlPhone(guestPhone)
  }, [guestName, guestEmail, guestPhone])

  const ua = event?.pricing?.adult ?? event?.price ?? 0
  const uc = event?.pricing?.child ?? Math.round(ua * 0.6 * 100) / 100
  const uv = event?.pricing?.vip ?? ua * 1.5
  const ug = event?.pricing?.groupPerPack ?? Math.round(ua * 6 * 0.85 * 100) / 100
  const av = event?.availability

  const total = useMemo(
    () => Math.round((adults * ua + children * uc + vip * uv + groupBlocks * ug) * 100) / 100,
    [adults, children, vip, groupBlocks, ua, uc, uv, ug],
  )

  async function submitWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setWlSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/events/${id}/waiting-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: wlName,
          guestEmail: wlEmail,
          guestPhone: wlPhone,
          partySize: wlParty,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Liste d attente refusee")
        return
      }
      setError(null)
      alert("Vous etes bien inscrit sur la liste d attente.")
    } catch {
      setError("Erreur reseau")
    } finally {
      setWlSending(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!event) return
    setSubmitting(true)
    setError(null)
    try {
      let paymentMethod: string | undefined
      let payNow = false
      let deferPayment = false

      switch (payMode) {
        case "stripe_instant":
          paymentMethod = "stripe"
          payNow = true
          break
        case "stripe_hold":
          paymentMethod = "stripe"
          deferPayment = true
          payNow = false
          break
        case "cash_venue":
          paymentMethod = "cash_at_venue"
          payNow = false
          break
        case "card_venue":
          paymentMethod = "card_at_venue"
          payNow = false
          break
      }

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
          vipSeats: vip,
          groupPackages: groupBlocks,
          specialRequests,
          paymentMethod,
          payNow,
          deferPayment,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : `Erreur ${res.status}`)
        return
      }
      if (body.paymentHint) {
        const ok = typeof window !== "undefined" ? window.confirm(`${body.paymentHint}\n\nSimuler le paiement Stripe maintenant ?`) : false
        if (ok && body.ticket?.code) {
          await fetch(`/api/events/${event.id}/payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticketCode: body.ticket.code, simulateStripe: true }),
          })
        }
      }
      router.push(`/events/tickets/${body.ticket.code}`)
    } catch {
      setError("Erreur reseau")
    } finally {
      setSubmitting(false)
    }
  }

  const fullBlocked = Boolean(av?.capped && av?.isFull)

  return (
    <PageShell>
      <SiteHeader backHref="/events" backLabel="Evenements" />
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#2d2416] sm:text-4xl">Participer a l&apos;evenement</h1>
          <p className="mt-1 text-[#8b6f47]">Billets, capacite supervisee — paiement Stripe ou au restaurant.</p>
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
                  {av?.capped ? `${av.availablePlaces ?? 0} places libres · ${av.reservedPlaces} reservees` : "Sans limite de capacite renseignee"}
                </div>
                {av?.capped ? (
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>Remplissage</span>
                      <span>{av.fillPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-[#d4a574]" style={{ width: `${av.fillPercent}%` }} />
                    </div>
                    {av.isFull ? <p className="mt-2 font-semibold text-rose-700">COMPLET — utilisez la liste d&apos;attente.</p> : null}
                  </div>
                ) : null}
                <div className="mt-3 space-y-1 rounded-lg bg-[#faf8f3] p-3 text-[#2d2416]">
                  <div className="flex justify-between text-sm">
                    <span>Adulte</span>
                    <span className="font-semibold">{ua.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Enfant</span>
                    <span className="font-semibold">{uc.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VIP</span>
                    <span className="font-semibold">{uv.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Groupe (pack)</span>
                    <span className="font-semibold">{ug.toFixed(2)} EUR</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-2">
              {fullBlocked ? (
                <Card className="border-rose-200 bg-rose-50/70">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#2d2416]">
                      <ListOrdered className="h-5 w-5" /> Liste d&apos;attente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={submitWaitlist} className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nom</Label>
                          <Input value={wlName} onChange={(e) => setWlName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={wlEmail} onChange={(e) => setWlEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Telephone</Label>
                          <Input value={wlPhone} onChange={(e) => setWlPhone(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Nombre de personnes</Label>
                          <Input
                            type="number"
                            min={1}
                            value={wlParty}
                            onChange={(e) => setWlParty(Math.max(1, Number(e.target.value)))}
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={wlSending || !id}>
                        Rejoindre la liste d&apos;attente
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="text-[#2d2416]">Reservation</CardTitle>
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
                        <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Telephone</Label>
                        <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Adultes</Label>
                        <Input type="number" min={0} value={adults} onChange={(e) => setAdults(Math.max(0, Number(e.target.value)))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Enfants</Label>
                        <Input type="number" min={0} value={children} onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Places VIP</Label>
                        <Input type="number" min={0} value={vip} onChange={(e) => setVip(Math.max(0, Number(e.target.value)))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Packages groupe</Label>
                        <Input
                          type="number"
                          min={0}
                          value={groupBlocks}
                          onChange={(e) => setGroupBlocks(Math.max(0, Number(e.target.value)))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Demandes speciales</Label>
                      <Textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} placeholder="Allergie, groupe, …" />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={event?.allow_online_pay === false}
                        onClick={() => setPayMode("stripe_instant")}
                        className={`rounded-lg border px-3 py-3 text-sm font-medium transition disabled:opacity-40 ${
                          payMode === "stripe_instant"
                            ? "border-[#d4a574] bg-[#faf8f3] text-[#2d2416]"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <CreditCard className="mr-2 inline h-4 w-4" /> Carte — confirme tout de suite
                      </button>
                      <button
                        type="button"
                        disabled={event?.allow_online_pay === false}
                        onClick={() => setPayMode("stripe_hold")}
                        className={`rounded-lg border px-3 py-3 text-sm font-medium transition disabled:opacity-40 ${
                          payMode === "stripe_hold"
                            ? "border-[#d4a574] bg-[#faf8f3] text-[#2d2416]"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <CreditCard className="mr-2 inline h-4 w-4" /> Carte — bloquer la place puis payer (demo)
                      </button>
                      <button
                        type="button"
                        disabled={event?.allow_pay_at_venue === false}
                        onClick={() => setPayMode("cash_venue")}
                        className={`rounded-lg border px-3 py-3 text-sm font-medium transition disabled:opacity-40 ${
                          payMode === "cash_venue"
                            ? "border-[#d4a574] bg-[#faf8f3] text-[#2d2416]"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Wallet className="mr-2 inline h-4 w-4" /> Especes au restaurant
                      </button>
                      <button
                        type="button"
                        disabled={event?.allow_pay_at_venue === false}
                        onClick={() => setPayMode("card_venue")}
                        className={`rounded-lg border px-3 py-3 text-sm font-medium transition disabled:opacity-40 ${
                          payMode === "card_venue"
                            ? "border-[#d4a574] bg-[#faf8f3] text-[#2d2416]"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Building2 className="mr-2 inline h-4 w-4" /> TPE au restaurant
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-[#2d2416] px-4 py-3 text-white">
                      <span className="text-sm">Total EUR (TVA selon votre regle commerce)</span>
                      <span className="text-lg font-bold">{total.toFixed(2)} €</span>
                    </div>

                    {error ? (
                      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                    ) : null}

                    <Button
                      type="submit"
                      disabled={
                        submitting || adults + children + vip + groupBlocks < 1 || fullBlocked || !event
                      }
                      className="w-full bg-gradient-to-r from-[#d4a574] to-[#c19a5b]"
                    >
                      <Ticket className="mr-2 h-4 w-4" />
                      {submitting ? "Reservation..." : "Confirmer la reservation"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </PageShell>
  )
}
