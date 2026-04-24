"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Plus,
  ChevronRight,
  Search,
  Music,
  PartyPopper,
  Briefcase,
  Heart,
  Gift,
} from "lucide-react"
import Link from "next/link"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SITE } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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

        const mapped: Event[] = (body.events || []).map((ev: any) => ({
          id: ev.id,
          title: ev.title,
          type: "other",
          date: ev.event_date,
          time: ev.start_time,
          duration: 0,
          capacity: 0,
          booked: 0,
          status: "available",
          price: 0,
          description: ev.description || "",
        }))
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700"
      case "booked":
        return "bg-blue-100 text-blue-700"
      case "completed":
        return "bg-slate-100 text-slate-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible"
      case "booked":
        return "Réservé"
      case "completed":
        return "Terminé"
      default:
        return status
    }
  }

  return (
    <PageShell>
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
            <div className="font-display text-2xl font-semibold">{events.filter((e) => e.status === "booked").length}</div>
            <div className="text-xs uppercase tracking-wider text-amber-200/80">Réservés</div>
          </div>
          <div className="w-px bg-white/25" />
          <div>
            <div className="font-display text-2xl font-semibold">{events.filter((e) => e.status === "available").length}</div>
            <div className="text-xs uppercase tracking-wider text-amber-200/80">Disponibles</div>
          </div>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
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
                    <Badge className={getStatusColor(event.status ?? "available")}>
                      {getStatusText(event.status ?? "available")}
                    </Badge>
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
                        {event.booked}/{event.capacity} pers.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-semibold">{(event.price ?? 0).toFixed(0)}€</span>
                    </div>
                  </div>

                  {event.organizer && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">Organisateur</p>
                      <p className="text-sm font-medium text-slate-900">{event.organizer}</p>
                    </div>
                  )}

                  {event.status === "booked" && (
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${((event.booked ?? 0) / Math.max(event.capacity ?? 1, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {event.status === "available" ? (
                      <>
                        <Button className="flex-1 gap-2" asChild>
                          <Link href={`/events/${event.id}/book`}>
                            Réserver privée
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" className="flex-1 bg-transparent" asChild>
                          <Link href={`/events/${event.id}/participate`}>Participer (buffet / soirée)</Link>
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" className="flex-1 bg-transparent" asChild>
                        <Link href={`/events/${event.id}`}>Voir les détails</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
      <AIAgentBadge context="events" />
      <SiteFooter />
    </PageShell>
  )
}
