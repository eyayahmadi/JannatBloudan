"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, Users, MapPin, Edit2, Trash2, Check, X, Sparkles } from "lucide-react"
import Link from "next/link"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Reservation = {
  id: string
  date: string
  time: string
  guests: number
  tableNumber: number
  zone: string
  specialRequest?: string
  status: "confirmed" | "pending" | "completed" | "cancelled"
  createdAt: string
}

type EventReservation = {
  id: string
  eventId: string
  title: string
  date: string
  time: string
  guests: number
  status: "confirmed" | "cancelled"
  createdAt: string
  specialRequest?: string
}

const zones = [
  { id: "terrasse", name: "Terrasse", icon: "🌿" },
  { id: "interieur", name: "Intérieur", icon: "🏠" },
  { id: "vip", name: "VIP", icon: "⭐" },
  { id: "gaming", name: "Gaming Room", icon: "🎮" },
]

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [eventReservations, setEventReservations] = useState<EventReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    date: "",
    time: "",
    guests: 2,
    specialRequest: "",
  })
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)

  const getStatusBadge = (status: Reservation["status"]) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmée</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">En attente</Badge>
      case "completed":
        return <Badge className="bg-slate-500">Terminée</Badge>
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>
    }
  }

  const handleStartEdit = (reservation: Reservation) => {
    setEditingId(reservation.id)
    setEditForm({
      date: reservation.date,
      time: reservation.time,
      guests: reservation.guests,
      specialRequest: reservation.specialRequest || "",
    })
  }

  const handleSaveEdit = (id: string) => {
    setReservations((prev) => prev.map((res) => (res.id === id ? { ...res, ...editForm } : res)))
    setEditingId(null)
  }

  const handleCancel = (id: string) => {
    setReservations((prev) => prev.map((res) => (res.id === id ? { ...res, status: "cancelled" as const } : res)))
    setShowCancelConfirm(null)
  }

  const upcomingReservations = reservations.filter((r) => new Date(r.date) >= new Date() && r.status === "confirmed")

  const pastReservations = reservations.filter((r) => new Date(r.date) < new Date() || r.status !== "confirmed")
  const upcomingEventReservations = eventReservations.filter((r) => new Date(r.date) >= new Date())
  const pastEventReservations = eventReservations.filter((r) => new Date(r.date) < new Date())

  useEffect(() => {
    const loadReservations = async () => {
      setLoading(true)
      setError(null)
      try {
        const [tablesRes, eventsRes] = await Promise.all([fetch("/api/reservations"), fetch("/api/event-reservations")])

        const tableBody = await tablesRes.json()
        if (!tablesRes.ok) {
          setError(tableBody?.error || "Impossible de charger vos réservations")
          return
        }

        const eventBody = await eventsRes.json()
        if (!eventsRes.ok) {
          setError(eventBody?.error || "Impossible de charger vos réservations d'événements")
          return
        }

        const mappedTables: Reservation[] = (tableBody.reservations || []).map((item: any) => ({
          id: item.id,
          date: item.reservation_date,
          time: item.reservation_time,
          guests: item.number_of_guests,
          tableNumber: item.table_number ?? 0,
          zone: item.zone ?? "interieur",
          specialRequest: item.special_requests || "",
          status:
            (item.status === "terminée"
              ? "completed"
              : item.status === "annulée"
              ? "cancelled"
              : "confirmed") as Reservation["status"],
          createdAt: item.created_at || item.reservation_date,
        }))

        const mappedEvents: EventReservation[] = (eventBody.reservations || []).map((item: any) => ({
          id: item.id,
          eventId: item.event_id,
          title: item.events?.title ?? "Événement",
          date: item.events?.event_date ?? item.created_at,
          time: item.events?.start_time ?? "",
          guests: item.number_of_guests ?? 0,
          status: "confirmed",
          createdAt: item.created_at,
          specialRequest: item.special_requests || "",
        }))

        setReservations(mappedTables)
        setEventReservations(mappedEvents)
      } catch (err) {
        setError("Erreur réseau")
      } finally {
        setLoading(false)
      }
    }

    loadReservations()
  }, [])

  return (
    <PageShell>
      <SiteHeader backHref="/reservation" backLabel="Réserver" />
      <div className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-amber-950 animate-fade-up">Mes réservations</h1>
          <p className="mt-1 text-amber-900/75">À venir et historique, au même endroit.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {/* Upcoming Reservations */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Réservations à venir</h2>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-5 w-40 animate-pulse rounded bg-amber-200/50" />
                      <div className="h-5 w-20 animate-pulse rounded-full bg-green-200/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {Array.from({ length: 4 }).map((__, j) => (
                        <div key={j} className="h-12 animate-pulse rounded bg-amber-100/40" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingReservations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Aucune réservation à venir</p>
                <Button asChild>
                  <Link href="/reservation">Réserver une table</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingReservations.map((reservation) => (
                <Card key={reservation.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {editingId === reservation.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Modifier la réservation #{reservation.id}
                          </h3>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveEdit(reservation.id)}>
                              <Check className="w-4 h-4 mr-1" />
                              Enregistrer
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              <X className="w-4 h-4 mr-1" />
                              Annuler
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-date">Date</Label>
                            <Input
                              id="edit-date"
                              type="date"
                              value={editForm.date}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-time">Heure</Label>
                            <Input
                              id="edit-time"
                              type="time"
                              value={editForm.time}
                              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-guests">Personnes</Label>
                            <Input
                              id="edit-guests"
                              type="number"
                              min="1"
                              max="10"
                              value={editForm.guests}
                              onChange={(e) =>
                                setEditForm({ ...editForm, guests: Number.parseInt(e.target.value, 10) || 1 })
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="edit-request" className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            Demande spéciale
                          </Label>
                          <Textarea
                            id="edit-request"
                            placeholder="Ex: Anniversaire, décorations..."
                            value={editForm.specialRequest}
                            onChange={(e) => setEditForm({ ...editForm, specialRequest: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-4">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Réservation #{reservation.id}</h3>
                            {getStatusBadge(reservation.status)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="text-xs text-slate-600">Date</p>
                                <p className="font-medium">{new Date(reservation.date).toLocaleDateString("fr-FR")}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="text-xs text-slate-600">Heure</p>
                                <p className="font-medium">{reservation.time}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="text-xs text-slate-600">Personnes</p>
                                <p className="font-medium">{reservation.guests}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="text-xs text-slate-600">Table</p>
                                <p className="font-medium">
                                  N°{reservation.tableNumber} - {zones.find((z) => z.id === reservation.zone)?.name}
                                </p>
                              </div>
                            </div>
                          </div>

                          {reservation.specialRequest && (
                            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-yellow-600 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-yellow-800">Demande spéciale</p>
                                  <p className="text-sm text-yellow-900">{reservation.specialRequest}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-200">
                          {showCancelConfirm === reservation.id ? (
                            <div className="flex gap-2 w-full">
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleCancel(reservation.id)}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Confirmer l'annulation
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 bg-transparent"
                                onClick={() => setShowCancelConfirm(null)}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Ne pas annuler
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                className="flex-1 bg-transparent"
                                onClick={() => handleStartEdit(reservation)}
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Modifier la réservation
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => setShowCancelConfirm(reservation.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Annuler la réservation
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Event Reservations */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Réservations d'événements</h2>
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center text-slate-600">Chargement...</CardContent>
            </Card>
          ) : upcomingEventReservations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-slate-600">Aucun événement réservé</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingEventReservations.map((reservation) => (
                <Card key={reservation.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{reservation.title}</h3>
                        <p className="text-sm text-slate-600">ID: {reservation.eventId}</p>
                      </div>
                      <Badge className="bg-green-500 text-white">Confirmée</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(reservation.date).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{reservation.time || "À confirmer"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{reservation.guests} invités</span>
                      </div>
                    </div>
                    {reservation.specialRequest && (
                      <div className="text-sm text-slate-700">
                        <span className="font-medium">Demande spéciale: </span>
                        {reservation.specialRequest}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Past Reservations */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Historique</h2>
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-12 text-center text-slate-600">Chargement...</CardContent>
              </Card>
            ) : pastReservations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-slate-600">Aucune réservation passée</CardContent>
              </Card>
            ) : (
              pastReservations.map((reservation) => (
                <Card key={reservation.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-lg font-semibold text-slate-900">Réservation #{reservation.id}</h3>
                          {getStatusBadge(reservation.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-600">Date</p>
                              <p className="font-medium text-slate-700">
                                {new Date(reservation.date).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-600">Heure</p>
                              <p className="font-medium text-slate-700">{reservation.time}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-600">Personnes</p>
                              <p className="font-medium text-slate-700">{reservation.guests}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-600">Table</p>
                              <p className="font-medium text-slate-700">
                                N°{reservation.tableNumber} - {zones.find((z) => z.id === reservation.zone)?.name}
                              </p>
                            </div>
                          </div>
                        </div>

                        {reservation.specialRequest && (
                          <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-slate-400 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-slate-600">Demande spéciale</p>
                                <p className="text-sm text-slate-700">{reservation.specialRequest}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Past Event Reservations */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Historique événements</h2>
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center text-slate-600">Chargement...</CardContent>
            </Card>
          ) : pastEventReservations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-600">Aucun historique d'événement</CardContent>
            </Card>
          ) : (
            pastEventReservations.map((reservation) => (
              <Card key={reservation.id} className="opacity-75 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{reservation.title}</h3>
                      <p className="text-sm text-slate-600">ID: {reservation.eventId}</p>
                    </div>
                    <Badge className="bg-slate-200 text-slate-700">Passé</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(reservation.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{reservation.time || "À confirmer"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{reservation.guests} invités</span>
                    </div>
                  </div>
                  {reservation.specialRequest && (
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">Demande spéciale: </span>
                      {reservation.specialRequest}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </div>
      <SiteFooter />
    </PageShell>
  )
}
