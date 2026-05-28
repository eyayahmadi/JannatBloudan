"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  Clock,
  Users,
  Search,
  Music,
  PartyPopper,
  Briefcase,
  Heart,
  Gift,
  Euro,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type EventAvailabilitySummary = {
  capped: boolean
  reservedPlaces: number
  availablePlaces: number | null
  isFull: boolean
  fillPercent: number
}

type Event = {
  id: string
  title: string
  type: "wedding" | "birthday" | "corporate" | "anniversary" | "other"
  date: string
  time: string
  duration?: number
  capacity?: number
  booked?: number
  status?: "available" | "booked" | "completed"
  price?: number
  organizer?: string
  description: string
  availability?: EventAvailabilitySummary
}

function listEventBadge(event: Event): { label: string; className: string } {
  if (event.availability?.isFull) {
    return { label: "Complet", className: "bg-red-100 text-red-800" }
  }
  if (
    event.availability?.capped &&
    event.availability.availablePlaces != null &&
    event.availability.availablePlaces > 0 &&
    event.availability.availablePlaces <= 10
  ) {
    return {
      label: `Plus que ${event.availability.availablePlaces} places`,
      className: "bg-amber-100 text-amber-900",
    }
  }
  if (event.availability?.capped) {
    return { label: "Places disponibles", className: "bg-green-100 text-green-800" }
  }
  return { label: "Capacité ouverte", className: "bg-slate-100 text-slate-700" }
}

const eventTypes = [
  { id: "all", name: "Tous", icon: Calendar },
  { id: "wedding", name: "Mariages", icon: Heart },
  { id: "birthday", name: "Anniversaires", icon: Gift },
  { id: "corporate", name: "Entreprise", icon: Briefcase },
  { id: "anniversary", name: "Célébrations", icon: PartyPopper },
  { id: "other", name: "Autres", icon: Music },
]

export function EventsBrowsePanel() {
  const [selectedType, setSelectedType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/events")
        const body = await res.json()
        if (!res.ok) {
          setError(body?.error || "Impossible de charger les événements")
          return
        }

        const mapped: Event[] = (body.events || []).map((ev: Record<string, unknown> & { id: string }) => {
          const avail = ev.availability as EventAvailabilitySummary | undefined
          const capRaw = ev.max_attendees as unknown
          const cap =
            typeof capRaw === "number" && Number.isFinite(capRaw)
              ? capRaw
              : capRaw != null && String(capRaw).trim() !== ""
                ? Number(capRaw)
                : undefined
          const capacity = typeof cap === "number" && Number.isFinite(cap) ? cap : undefined
          const priceAdult =
            typeof ev.price_adult_eur === "number"
              ? ev.price_adult_eur
              : typeof ev.price === "number"
                ? ev.price
                : 0

          return {
            id: ev.id,
            title: String(ev.title ?? ""),
            type: "other" as const,
            date: String(ev.event_date ?? ""),
            time: String(ev.start_time ?? ""),
            duration: 0,
            capacity,
            booked: avail?.reservedPlaces ?? 0,
            status: avail?.isFull ? ("booked" as const) : ("available" as const),
            price: priceAdult,
            description: String(ev.description ?? ""),
            availability: avail,
          }
        })
        setEvents(mapped)
      } catch {
        setError("Erreur réseau")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const filteredEvents = events.filter((event) => {
    const matchesType = selectedType === "all" || event.type === selectedType
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const getEventIcon = (type: string) => {
    const typeObj = eventTypes.find((t) => t.id === type)
    return typeObj ? typeObj.icon : Calendar
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-amber-950">Réserver un événement</h2>
        <p className="mt-1 text-sm text-amber-900/65">
          Parcourez les soirées et formules, puis réservez ou rejoignez la liste d&apos;attente.
        </p>
      </div>

      <Card className="border-[color:var(--lux-bordeaux)]/10 bg-white/85 shadow-[var(--lux-shadow-soft)]">
        <CardContent className="p-4 sm:p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((type) => {
              const Icon = type.icon
              return (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type.id)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {type.name}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-amber-900/10 bg-white/75 p-6"
            >
              <div className="mb-4 flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-amber-200/70 bg-amber-50/30 p-10 text-center">
          <PartyPopper className="mx-auto mb-3 h-10 w-10 text-amber-700/60" />
          <p className="font-display text-base font-semibold text-amber-950">Aucun événement pour le moment</p>
          <p className="mt-1 text-sm text-amber-900/65">Revenez bientôt ou élargissez votre recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredEvents.map((event) => {
            const Icon = getEventIcon(event.type)
            const badge = listEventBadge(event)
            return (
              <Card
                key={event.id}
                className="border-[color:var(--lux-bordeaux)]/10 bg-white/90 shadow-[var(--lux-shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--lux-shadow-gold)]"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-3 text-white">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="mb-1 font-display text-lg font-semibold text-amber-950">{event.title}</h3>
                        <p className="text-sm text-amber-900/70">{event.description}</p>
                      </div>
                    </div>
                    <Badge className={cn("shrink-0", badge.className)}>{badge.label}</Badge>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm text-amber-900/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[color:var(--lux-bordeaux)]" />
                      {new Date(event.date).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[color:var(--lux-bordeaux)]" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[color:var(--lux-bordeaux)]" />
                      {event.availability?.capped && event.capacity != null
                        ? `${event.booked ?? 0}/${event.capacity} pers.`
                        : `${event.booked ?? 0} inscrit(s)`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-[color:var(--lux-bordeaux)]" />
                      <span className="font-semibold">
                        {event.price != null && event.price > 0 ? `À partir de ${event.price.toFixed(2)} €` : "Gratuit"}
                      </span>
                    </div>
                  </div>

                  {event.availability?.capped ? (
                    <div className="mb-4 h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0, event.availability.fillPercent))}%`,
                        }}
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button className="flex-1 gap-2 rounded-full" variant="gold" asChild>
                      <Link href={`/events/${event.id}/participate`}>
                        Billetterie
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-full border-[color:var(--lux-gold)]/40" asChild>
                      <Link href={`/events/${event.id}/book`}>Réservation simple</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
