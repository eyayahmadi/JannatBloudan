"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Calendar, Clock, Users, MapPin, Check, CreditCard, User, Mail, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

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

export default function BookEventPage() {
  const params = useParams<{ eventId: string | string[] }>()
  const eventId =
    typeof params?.eventId === "string" ? params.eventId : Array.isArray(params?.eventId) ? params.eventId[0] : null
  const router = useRouter()
  const [step, setStep] = useState<"info" | "confirmation">("info")
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guests: 1,
    message: "",
  })

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true)
      setError(null)
      try {
        const id = eventId
        if (!id) {
          setError("Identifiant d'événement manquant")
          return
        }

        const res = await fetch(`/api/events/${id}`)
        const body = await res.json()
        if (!res.ok) {
          setError(body?.error || "Impossible de charger l'événement")
          return
        }
        setEvent(body.event)
      } catch (err) {
        setError("Erreur réseau")
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("confirmation")
  }

  const handleConfirm = async () => {
    if (!event) return
    setError(null)
    try {
      const res = await fetch("/api/event-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          guests: formData.guests,
          message: formData.message,
        }),
      })

      const body = await res.json()
      if (!res.ok) {
        setError(body?.error || "Impossible d'enregistrer la réservation")
        return
      }

      router.push("/reservation/my-reservations")
    } catch (err) {
      setError("Erreur réseau")
    }
  }

  return (
    <PageShell>
      <SiteHeader backHref="/events" backLabel="Événements" />
      <div className="mx-auto max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-12">
        {loading && <p className="text-center text-[#8b6f47]">Chargement de l'événement...</p>}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 text-center">
            {error}
          </div>
        )}
        {!loading && !event && !error && (
          <div className="text-center text-[#8b6f47]">Événement introuvable ou non disponible.</div>
        )}

        {!loading && event && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Pour les <strong>billets</strong> (tarifs multiples), le paiement en ligne ou sur place et la{" "}
            <strong>liste d&apos;attente</strong> lorsque l&apos;événement est complet, utilisez la{" "}
            <Link href={`/events/${event.id}/participate`} className="font-semibold underline underline-offset-2">
              page Participer / billetterie
            </Link>
            . Cette page enregistre une demande simple sans billet.
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2d2416] mb-2 animate-fade-up">Réserver un Événement</h1>
          <p className="text-[#8b6f47]">Jannat Bloudan — événements et célébrations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up [animation-delay:100ms]">
          {/* Event Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-[#2d2416]">Détails de l'événement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-bold text-[#2d2416] text-lg mb-2">{event?.title ?? "Titre à venir"}</h3>
                <p className="text-sm text-[#8b6f47]">{event?.description ?? "Description non fournie"}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#d4a574]/20">
                <div className="flex items-center gap-2 text-[#2d2416]">
                  <Calendar className="w-4 h-4 text-[#d4a574]" />
                  <span className="text-sm">
                    {event
                      ? new Date(event.event_date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Date à confirmer"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#2d2416]">
                  <Clock className="w-4 h-4 text-[#d4a574]" />
                  <span className="text-sm">
                    {event ? `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ""}` : "Horaires à venir"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#2d2416]">
                  <Users className="w-4 h-4 text-[#d4a574]" />
                  <span className="text-sm">
                    {event?.capacity ? `${event.capacity} places disponibles` : "Capacité à confirmer"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#2d2416]">
                  <MapPin className="w-4 h-4 text-[#d4a574]" />
                  <span className="text-sm font-bold">
                    {event?.price ? `${event.price.toFixed(0)}€` : "Tarif à confirmer"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#d4a574]/20">
                <Badge className="bg-green-100 text-green-700">Disponible</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            {step === "info" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#2d2416]">Informations de réservation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[#2d2416]">
                          Nom complet
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-[#d4a574]" />
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#2d2416]">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-[#d4a574]" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-[#2d2416]">
                          Téléphone
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 w-4 h-4 text-[#d4a574]" />
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#2d2416]">Nombre d'invités</Label>
                        <div className="flex items-center gap-3 bg-white border border-[#d4a574] rounded-lg px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setFormData((prev) => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                          >
                            <span className="sr-only">Diminuer</span>
                            -
                          </Button>
                          <span className="font-semibold text-[#2d2416] w-8 text-center">{formData.guests}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setFormData((prev) => ({ ...prev, guests: prev.guests + 1 }))}
                          >
                            <span className="sr-only">Augmenter</span>
                            +
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-[#2d2416]">
                        Demande spéciale
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Précisez vos attentes (décoration, menu, musique...)"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="min-h-[120px] border-[#d4a574]"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#d4a574] to-[#c19a5b]"
                      disabled={!event || !!error}
                    >
                      Continuer
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#2d2416]">Confirmation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-[#f5edd5] rounded-lg p-4">
                    <h3 className="font-semibold text-[#2d2416] mb-3">Récapitulatif</h3>
                    <div className="space-y-2 text-[#5d4e37]">
                      <p>
                        <span className="font-medium">Événement:</span> {event?.title ?? "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {event ? new Date(event.event_date).toLocaleDateString("fr-FR") : "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Heure:</span>{" "}
                        {event ? `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ""}` : "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Invités:</span> {formData.guests} personnes
                      </p>
                      <p>
                        <span className="font-medium">Contact:</span> {formData.name} ({formData.email}) {formData.phone}
                      </p>
                      <p>
                        <span className="font-medium">Demande spéciale:</span> {formData.message || "Aucune"}
                      </p>
                      <p>
                        <span className="font-medium">Montant estimé:</span>{" "}
                        {event?.price ? `${event.price.toFixed(0)}€` : "À confirmer"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep("info")}
                      className="border-[#d4a574] text-[#2d2416] hover:bg-[#faf8f3]"
                    >
                      <CreditCard className="w-4 h-4 mr-2 text-[#d4a574]" />
                      Modifier
                    </Button>
                    <Button
                      className="w-full bg-[#6b7c3a] hover:bg-[#5a6a2e]"
                      onClick={handleConfirm}
                      disabled={!event || !eventId}
                    >
                      Confirmer la réservation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </PageShell>
  )
}
