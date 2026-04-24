"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, ChevronRight, Users } from "lucide-react"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Event = {
  id: string
  title: string
  description?: string
  event_date: string
  start_time: string
  end_time?: string
  capacity?: number
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((body) => setEvents(body.events ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/admin" backLabel="Dashboard" hideMainNav />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion evenements</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ticketing, participants, scan d'entree et calendrier
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/events/calendar">
                <Calendar className="mr-2 h-4 w-4" /> Calendrier
              </Link>
            </Button>
          </div>

          {loading ? (
            <p className="text-slate-500">Chargement...</p>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">Aucun evenement publie.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <Card key={e.id} className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                  <CardContent className="space-y-3 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{e.title}</h3>
                    <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{e.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(e.event_date).toLocaleDateString("fr-FR")}
                      <span>•</span>
                      {e.start_time}
                      {e.end_time ? ` - ${e.end_time}` : ""}
                    </div>
                    {e.capacity ? (
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Users className="h-3.5 w-3.5" />
                        Capacite {e.capacity}
                      </div>
                    ) : null}
                    <div className="flex gap-2 pt-2">
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link href={`/admin/events/${e.id}/participants`}>
                          Participants
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600">
                        <Link href={`/admin/events/${e.id}/scan`}>Scan</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
