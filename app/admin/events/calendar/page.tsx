"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Event = {
  id: string
  title: string
  event_date: string
  start_time: string
}

const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

function monthDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const dayOfWeekMondayZero = (first.getDay() + 6) % 7
  const cells: Array<{ date: Date | null }> = []
  for (let i = 0; i < dayOfWeekMondayZero; i += 1) cells.push({ date: null })
  for (let d = 1; d <= last.getDate(); d += 1) cells.push({ date: new Date(year, month, d) })
  while (cells.length % 7 !== 0) cells.push({ date: null })
  return cells
}

export default function EventCalendarPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((body) => setEvents(body.events ?? []))
      .catch(() => setEvents([]))
  }, [])

  const byDay = useMemo(() => {
    const map = new Map<string, Event[]>()
    for (const e of events) {
      const key = e.event_date.slice(0, 10)
      const arr = map.get(key) ?? []
      arr.push(e)
      map.set(key, arr)
    }
    return map
  }, [events])

  const cells = monthDays(cursor.year, cursor.month)
  const monthLabel = new Date(cursor.year, cursor.month).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  })

  function shift(delta: number) {
    setCursor((c) => {
      const nm = c.month + delta
      const year = c.year + Math.floor(nm / 12)
      const month = ((nm % 12) + 12) % 12
      return { year, month }
    })
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/admin/events" backLabel="Evenements" hideMainNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendrier evenements</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{monthLabel}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => shift(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => shift(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-2 grid grid-cols-7 text-xs font-semibold uppercase text-slate-500">
                {DOW.map((d) => (
                  <div key={d} className="py-1 text-center">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, i) => {
                  if (!cell.date) return <div key={i} className="min-h-24 rounded bg-slate-50 dark:bg-slate-900/50" />
                  const key = cell.date.toISOString().slice(0, 10)
                  const list = byDay.get(key) ?? []
                  const isToday = new Date().toDateString() === cell.date.toDateString()
                  return (
                    <div
                      key={i}
                      className={`min-h-24 rounded border p-1.5 text-xs ${
                        isToday
                          ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                      }`}
                    >
                      <div className="mb-1 font-semibold text-slate-700 dark:text-slate-200">
                        {cell.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {list.slice(0, 3).map((ev) => (
                          <Link
                            key={ev.id}
                            href={`/admin/events/${ev.id}/participants`}
                            className="block truncate rounded bg-gradient-to-r from-amber-100 to-orange-100 px-1.5 py-0.5 text-[11px] text-amber-900 hover:from-amber-200 hover:to-orange-200 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-200"
                          >
                            {ev.start_time?.slice(0, 5)} • {ev.title}
                          </Link>
                        ))}
                        {list.length > 3 ? (
                          <p className="text-[11px] text-slate-500">+{list.length - 3}</p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
