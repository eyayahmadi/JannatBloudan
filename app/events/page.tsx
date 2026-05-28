"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ChevronRight,
  Search,
  Music,
  PartyPopper,
  Briefcase,
  Heart,
  Gift,
  Euro,
} from "lucide-react"
import Link from "next/link"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { MobileBottomNav } from "@/components/site/MobileBottomNav"
import { SITE } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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
    return { label: "Complet", className: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200" }
  }
  if (
    event.availability?.capped &&
    event.availability.availablePlaces != null &&
    event.availability.availablePlaces > 0 &&
    event.availability.availablePlaces <= 10
  ) {
    return {
      label: `Plus que ${event.availability.availablePlaces} places`,
      className: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100",
    }
  }
  if (event.availability?.capped) {
    return { label: "Places disponibles", className: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-100" }
  }
  return { label: "Capacité ouverte", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" }
}

const eventTypes = [
  { id: "all", name: "Tous", icon: Calendar },
  { id: "wedding", name: "Mariages", icon: Heart },
  { id: "birthday", name: "Anniversaires", icon: Gift },
  { id: "corporate", name: "Entreprise", icon: Briefcase },
  { id: "anniversary", name: "Célébrations", icon: PartyPopper },
  { id: "other", name: "Autres", icon: Music },
]

export default function EventsPage() {
  const [selectedType, setSelectedType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
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
            capacity: capacity,
            booked: avail?.reservedPlaces ?? 0,
            status: avail?.isFull ? ("booked" as const) : ("available" as const),
            price: priceAdult,
            description: String(ev.description ?? ""),
            availability: avail,
          }
        })
        setEvents(mapped)
      } catch (err) {
        setError("Erreur réseau")
      } finally {
        setLoading(false)
      }
    }

    load()
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
    <PageShell contentClassName="pb-20 lg:pb-0">
      <SiteHeader
        backHref="/"
        trailing={
          <Button size="pillSm" className="gap-1.5" asChild>
            <Link href="/events/create">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Créer</span>
            </Link>
          </Button>
        }
      />

      <PageHero
        imageSrc={SITE.images.events}
        imageAlt="Réception"
        kicker="Moments d’exception"
        title="Événements & célébrations"
        subtitle="Mariages, anniversaires, soirées d’entreprise — nous orchestrons chaque détail avec élégance."
        height="md"
      >
        <div className="hidden gap-6 text-right sm:flex">
          <div>
            <div className="font-display text-2xl font-semibold">{events.length}</div>
            <div className="text-xs uppercase tracking-wider text-amber-200/80">Total</div>
          </div>
          <div className="w-px bg-white/25" />
          <div>
            <div className="font-display text-2xl font-semibold">{events.filter((e) => e.availability?.isFull).length}</div>
            <div className="text-xs uppercase tracking-wider text-amber-200/80">Complets</div>
          </div>
          <div className="w-px bg-white/25" />
          <div>
            <div className="font-display text-2xl font-semibold">{events.filter((e) => !e.availability?.isFull).length}</div>
            <div className="text-xs uppercase tracking-wider text-amber-200/80">Ouverts</div>
          </div>
        </div>
      </PageHero>

      <div className="site-container flex-1 py-10">
        {/* Filters */}
        <Card className="mb-8 border-white/50 bg-white/70 shadow-sm backdrop-blur-md animate-fade-up">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Rechercher un événement..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  Liste
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                >
                  Calendrier
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                    <Icon className="w-4 h-4" />
                    {type.name}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md">
                <div className="flex items-start gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredEvents.map((event) => {
            const Icon = getEventIcon(event.type)
            const badge = listEventBadge(event)
            return (
              <Card
                key={event.id}
                className="border-white/50 bg-white/75 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg mb-1">{event.title}</h3>
                        <p className="text-sm text-slate-600">{event.description}</p>
                      </div>
                    </div>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">{new Date(event.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">
                        {event.time} ({event.duration}h)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">
                        {event.availability?.capped && event.capacity != null
                          ? `${event.booked ?? 0}/${event.capacity} pers.`
                          : `${event.booked ?? 0} inscrit(s)`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Euro className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-semibold">
                        {event.price != null && event.price > 0 ? `À partir de ${event.price.toFixed(2)} €` : "Gratuit"}
                      </span>
                    </div>
                  </div>

                  {event.organizer && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">Organisateur</p>
                      <p className="text-sm font-medium text-slate-900">{event.organizer}</p>
                    </div>
                  )}

                  {event.availability?.capped ? (
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0, event.availability.fillPercent))}%`,
                        }}
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button className="flex-1 gap-2" asChild>
                      <Link href={`/events/${event.id}/participate`}>
                        Billetterie &amp; liste d&apos;attente
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent" asChild>
                      <Link href={`/events/${event.id}/book`}>Réservation simple (sans billet)</Link>
                    </Button>
                    <Button variant="ghost" className="w-full shrink-0 sm:w-auto" asChild>
                      <Link href={`/events/${event.id}`}>Voir la fiche</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
      <AIAgentBadge context="events" />
      <SiteFooter />
      <MobileBottomNav />
    </PageShell>
  )
}
