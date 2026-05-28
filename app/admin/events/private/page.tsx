"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Mail,
  Phone,
  Euro,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Bell,
  Pencil,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { requestMatchesFilter } from "@/lib/events/private-event-filters"

type EventPackage = {
  id: string
  name: string
  description?: string | null
  base_price: number
  min_guests?: number | null
  max_guests?: number | null
  duration_hours?: number | null
  active?: boolean
}

type QuoteRef = {
  id: string
  status?: string
  total?: number
  deposit_amount?: number
  deposit_paid?: boolean
  created_at?: string
}

type EventRequest = {
  id: string
  request_number?: string | null
  guest_name: string
  guest_email?: string | null
  guest_phone?: string | null
  event_type: string
  event_date: string
  event_time?: string | null
  guests_count: number
  estimated_budget?: number | null
  package_id?: string | null
  special_requests?: string | null
  status: string
  created_at: string
  package?: EventPackage | null
  quotes?: QuoteRef[]
}

type DetailPayload = {
  request: Record<string, unknown> & EventRequest & { quotes?: QuoteRef[] }
  enrichment?: {
    latest_quote_total?: number
    deposit_amount?: number
    deposit_paid?: boolean
    balance_due?: number
  }
  preparation_items?: Array<Record<string, unknown>>
  status_history?: Array<{ id: string; from_status: string | null; to_status: string; created_at: string; note?: string }>
  reminder_log?: Array<{ reminder_key: string; channel: string; sent_at: string }>
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "border-amber-300/70 bg-amber-50 text-amber-900 dark:bg-amber-950/40" },
  reviewing: { label: "En revue", color: "border-blue-300/70 bg-blue-50 text-blue-900 dark:bg-blue-950/40" },
  quoted: { label: "Devis envoyé", color: "border-violet-300/70 bg-violet-50 text-violet-900 dark:bg-violet-950/35" },
  confirmed: { label: "Confirmé", color: "border-emerald-300/70 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/35" },
  in_progress: { label: "En cours", color: "border-teal-300/70 bg-teal-50 text-teal-900 dark:bg-teal-950/35" },
  completed: { label: "Terminé", color: "border-slate-300/70 bg-slate-100 text-slate-900 dark:bg-slate-900/35" },
  cancelled: { label: "Annulé", color: "border-red-300/70 bg-red-50 text-red-900 dark:bg-red-950/35" },
  refused: { label: "Refusé", color: "border-slate-300/70 bg-slate-50 text-slate-600 dark:bg-slate-900/30" },
}

const EVENT_TYPES: Record<string, string> = {
  anniversaire: "Anniversaire",
  mariage: "Mariage",
  entreprise: "Entreprise",
  prive: "Privé",
  autre: "Autre",
}

const MONTH_FILTERS = ["all", "pending", "reviewing", "quoted", "confirmed", "completed", "cancelled"] as const

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`
}

function formatYM(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

function formatCurrency(v: number) {
  return `${v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} EUR`
}

function calendarMeta(ym: string) {
  const [yStr, mStr] = ym.split("-")
  const y = Number(yStr)
  const mo = Number(mStr) - 1
  const first = new Date(y, mo, 1)
  const last = new Date(y, mo + 1, 0)
  const dow = first.getDay()
  const pad = dow === 0 ? 6 : dow - 1
  const daysInMonth = last.getDate()
  const localeTitle = first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  return { pad, daysInMonth, localeTitle }
}

function displayStatusKey(r: EventRequest) {
  if (r.status === "reviewing" && (r.quotes ?? []).some((q) => String(q.status ?? "").toLowerCase() === "sent")) {
    return "quoted"
  }
  return r.status
}

function reqStatusBadge(r: EventRequest) {
  const key = displayStatusKey(r)
  const cfg = STATUS_MAP[key] ?? STATUS_MAP.pending
  return (
    <span className={`inline-flex max-w-full truncate rounded-full border px-1.5 py-0 text-[10px] font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function RequestMiniCard(props: {
  r: EventRequest
  compact?: boolean
  onPick: () => void
}) {
  const { r, compact, onPick } = props
  const time = r.event_time ? r.event_time.slice(0, 5) : "—"
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onPick()
      }}
      className={cnMiniCard(compact)}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="shrink-0 font-mono text-[10px] text-amber-800/85">{time}</span>
        {reqStatusBadge(r)}
      </div>
      <p className="truncate font-medium text-[11px] text-slate-900 dark:text-slate-100">{r.guest_name}</p>
      <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
        {(EVENT_TYPES[r.event_type] ?? r.event_type) || "Événement"} ·{" "}
        <span className="inline-flex items-center gap-0.5 font-medium text-blue-900/85 dark:text-blue-300">
          <Users className="h-3 w-3 shrink-0" />
          {r.guests_count}
        </span>
      </p>
    </button>
  )
}

function cnMiniCard(compact?: boolean) {
  return [
    "w-full rounded-lg border border-amber-200/65 bg-white/90 text-left shadow-sm transition hover:border-amber-400/85 hover:bg-amber-50/65 dark:border-slate-600/65 dark:bg-slate-900/45 dark:hover:border-amber-600/65",
    compact ? "p-1" : "p-2",
  ].join(" ")
}

/** Contenu métier événements privés (calendrier + détail). */
export function PrivateEventsPlannerClient() {
  const [packages, setPackages] = useState<EventPackage[]>([])
  const [monthYM, setMonthYM] = useState(() => formatYM(new Date()))
  const [filter, setFilter] = useState<string>("all")
  const [requests, setRequests] = useState<EventRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailPayload | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [quoteAmount, setQuoteAmount] = useState("")
  const [quoteNotes, setQuoteNotes] = useState("")
  const [submittingQuote, setSubmittingQuote] = useState(false)

  const [prepLabel, setPrepLabel] = useState("")
  const [prepQty, setPrepQty] = useState("")
  const [prepDeadline, setPrepDeadline] = useState("")
  const [prepNotes, setPrepNotes] = useState("")

  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const [upcoming, setUpcoming] = useState<Record<string, unknown>[]>([])

  const loadMonth = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      qs.set("month", monthYM)
      qs.set("status", filter === "quoted" ? "all" : filter)
      const res = await fetch(`/api/admin/private-events?${qs.toString()}`, { cache: "no-store" })
      const json = await res.json()
      if (json?.requests && Array.isArray(json.requests)) {
        let rr = json.requests as EventRequest[]
        if (filter === "quoted") {
          rr = rr.filter((x) => requestMatchesFilter(x, "quoted"))
        }
        setRequests(rr)
      } else setRequests([])
      setPackages(Array.isArray(json?.packages) ? json.packages : [])
    } finally {
      setLoading(false)
    }
  }, [monthYM, filter])

  useEffect(() => {
    void loadMonth()
  }, [loadMonth])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/private-events/upcoming", { cache: "no-store" })
        const j = await res.json()
        setUpcoming(Array.isArray(j?.upcoming) ? (j.upcoming as Record<string, unknown>[]) : [])
      } catch {
        setUpcoming([])
      }
    })()
  }, [monthYM, requests])

  const filteredCalendar = requests

  const stats = useMemo(() => {
    const base = filteredCalendar
    return {
      total: base.length,
      pending: base.filter((r) => r.status === "pending").length,
      confirmed: base.filter((r) => r.status === "confirmed" || r.status === "in_progress").length,
      revenue: base
        .filter((r) => r.status === "confirmed" || r.status === "completed" || r.status === "in_progress")
        .reduce((s, r) => s + Number(r.estimated_budget ?? 0), 0),
    }
  }, [filteredCalendar])

  const byDay = useMemo(() => {
    const m = new Map<string, EventRequest[]>()
    for (const r of filteredCalendar) {
      const k = r.event_date.slice(0, 10)
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(r)
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => String(a.event_time ?? "").localeCompare(String(b.event_time ?? "")))
    }
    return m
  }, [filteredCalendar])

  const { pad, daysInMonth, localeTitle } = calendarMeta(monthYM)

  const loadDetail = useCallback(async (id: string) => {
    setLoadingDetail(true)
    setSelectedId(id)
    try {
      const res = await fetch(`/api/admin/private-events/${id}`, { cache: "no-store" })
      const j = await res.json()
      if (j?.ok && j.request) {
        setDetail(j as DetailPayload)
        const rq = j.request as EventRequest
        setEditName(rq.guest_name ?? "")
        setEditEmail(rq.guest_email ?? "")
        setEditPhone(rq.guest_phone ?? "")
        setEditNotes((rq.special_requests as string) ?? "")
      } else setDetail(null)
    } catch {
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  const patchRequest = async (body: Record<string, unknown>) => {
    if (!selectedId) return
    const res = await fetch(`/api/admin/private-events/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      await loadMonth()
      await loadDetail(selectedId)
    }
  }

  const sendQuote = async () => {
    if (!selectedId || !quoteAmount) return
    setSubmittingQuote(true)
    try {
      const amount = parseFloat(quoteAmount)
      const res = await fetch(`/api/events/private/${selectedId}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtotal: amount, notes: quoteNotes }),
      })
      if (res.ok) {
        setQuoteAmount("")
        setQuoteNotes("")
        await loadMonth()
        await loadDetail(selectedId)
      }
    } finally {
      setSubmittingQuote(false)
    }
  }

  const addPrepItem = async () => {
    if (!selectedId || !prepLabel.trim()) return
    const res = await fetch(`/api/admin/private-events/${selectedId}/preparation-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: prepLabel.trim(),
        quantity: prepQty ? Number(prepQty) : null,
        deadline: prepDeadline || null,
        notes: prepNotes || null,
      }),
    })
    if (res.ok) {
      setPrepLabel("")
      setPrepQty("")
      setPrepDeadline("")
      setPrepNotes("")
      await loadDetail(selectedId)
    }
  }

  const saveEdits = async () => {
    if (!selectedId) return
    setSavingEdit(true)
    await patchRequest({
      guestName: editName.trim(),
      guestEmail: editEmail.trim() || null,
      guestPhone: editPhone.trim() || null,
      specialRequests: editNotes.trim() || null,
    })
    setSavingEdit(false)
  }

  function shiftMonth(delta: number) {
    const [y0, mo0] = monthYM.split("-").map(Number)
    const d = new Date(y0, mo0 - 1 + delta, 1)
    setMonthYM(formatYM(d))
  }

  const detailInner = loadingDetail ? (
    <div className="flex justify-center py-10">
      <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
    </div>
  ) : detail?.request ? (
    <DetailBody
      detail={detail}
      quoteAmount={quoteAmount}
      setQuoteAmount={setQuoteAmount}
      quoteNotes={quoteNotes}
      setQuoteNotes={setQuoteNotes}
      submittingQuote={submittingQuote}
      sendQuote={sendQuote}
      patchRequest={patchRequest}
      prepLabel={prepLabel}
      setPrepLabel={setPrepLabel}
      prepQty={prepQty}
      setPrepQty={setPrepQty}
      prepDeadline={prepDeadline}
      setPrepDeadline={setPrepDeadline}
      prepNotes={prepNotes}
      setPrepNotes={setPrepNotes}
      addPrepItem={addPrepItem}
      editName={editName}
      setEditName={setEditName}
      editEmail={editEmail}
      setEditEmail={setEditEmail}
      editPhone={editPhone}
      setEditPhone={setEditPhone}
      editNotes={editNotes}
      setEditNotes={setEditNotes}
      saveEdits={saveEdits}
      savingEdit={savingEdit}
      refreshDetail={async () => {
        if (selectedId) await loadDetail(selectedId)
      }}
    />
  ) : selectedId ? (
    <p className="py-10 text-center text-sm text-slate-500">Impossible de charger le détail.</p>
  ) : (
    <div className="py-14 text-center text-slate-500">
      <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Choisissez une réservation</p>
      <p className="mt-1 text-xs text-slate-500">Cliquez sur une carte dans le calendrier</p>
    </div>
  )

  const weekLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

  const cells = [
    ...Array.from({ length: pad }).map(() => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  while (cells.length < 42) cells.push(null)

  return (
    <div className="mx-auto max-w-[1480px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[220px]">
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              <Sparkles className="h-7 w-7 text-amber-500" />
              Événements privés
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Vue calendrier, détail et préparation — données via API admin (mois&nbsp;
              <span className="font-mono">{monthYM}</span>).
            </p>
          </div>

          {/* mois */}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setMonthYM(formatYM(new Date()))}>
              Aujourd’hui
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="rounded-full bg-amber-100/85 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
              <CalendarDays className="mr-2 inline h-4 w-4 pb-px" aria-hidden />
              <span className="capitalize">{localeTitle}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Demandes ce mois" value={stats.total.toString()} />
        <KpiCard label="En attente" value={stats.pending.toString()} accent="amber" />
        <KpiCard label="Confirmées (+ en cours)" value={stats.confirmed.toString()} accent="emerald" />
        <KpiCard label="CA estimé confirmé/progrès" value={formatCurrency(stats.revenue)} accent="gold" />
      </div>

      {/* Proche & préparation */}
      {upcoming.length > 0 ? (
        <Card className="mb-8 border border-amber-200/60 bg-gradient-to-r from-white to-amber-50/70 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-amber-600" />
              Réservations à venir — prochains 14 jours
            </CardTitle>
            <Sheet>
              <SheetTrigger asChild>
                <button type="button" className="text-xs font-medium text-amber-900 underline underline-offset-4 hover:text-amber-700 dark:text-amber-200">
                  Ouverture liste complète
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Rappels automatiques</SheetTitle>
                  <SheetDescription className="text-left text-xs">
                    Planifier un cron GET quotidien :{" "}
                    <span className="font-mono">/api/cron/private-event-reminders</span>
                    avec en-tête <span className="font-mono">Authorization: Bearer CRON_SECRET</span>. Les lignes sont
                    écrites dans <span className="font-mono">event_reminder_log</span> (email/SMS réels à brancher).
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-3 text-xs">
                  {upcoming.slice(0, 12).map((u) => (
                    <Card key={String(u.id)} className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{String(u.guest_name ?? "")}</div>
                      <div className="text-slate-500">
                        {String(u.event_date ?? "")}{" "}
                        {u.event_time ? `· ${String((u.event_time as string).slice(0, 5))}` : ""} ·{" "}
                        {String(u.guests_count ?? "")} pers.
                      </div>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {(u.package as { name?: string } | null)?.name ?? "Sans pack"}
                      </Badge>
                    </Card>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </CardHeader>
          <CardContent>
            <div className="-mx-1 flex gap-3 overflow-x-auto pb-2">
              {upcoming.slice(0, 6).map((u) => (
                <Card
                  key={String(u.id)}
                  className="min-w-[200px] flex-1 shrink-0 cursor-pointer border border-amber-200/65 p-4 transition hover:shadow-md"
                  onClick={() => void loadDetail(String(u.id))}
                  role="button"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/85">
                    {(u.event_date as string) ?? ""}
                  </p>
                  <p className="mt-2 font-semibold text-slate-900 dark:text-slate-50">{String(u.guest_name)}</p>
                  <div className="mt-3 flex justify-between gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                    <span>
                      {(u.event_time as string)?.slice?.(0, 5)} · {EVENT_TYPES[u.event_type as string] ?? u.event_type}
                    </span>
                    <span className="font-medium">{String(u.guests_count)} pers.</span>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {packages.length > 0 && (
        <Card className="mb-8 dark:border-slate-700 dark:bg-slate-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-amber-600" />
              Formules proposées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {packages.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-amber-100/95 bg-white/95 p-4 shadow-[0_1px_10px_-4px_rgba(120,80,40,0.25)] dark:border-slate-600 dark:bg-slate-900"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</h3>
                    <Badge variant="secondary" className="shrink-0">
                      {formatCurrency(Number(p.base_price))}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{p.description ?? ""}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {MONTH_FILTERS.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            className="rounded-full text-xs font-medium sm:text-sm"
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "Tout" : STATUS_MAP[s]?.label ?? s}
          </Button>
        ))}
      </div>

      {/* Calendrier + détail */}
      <div className="grid gap-6 lg:grid-cols-[1fr,minmax(312px,400px)]">
        <Card className="overflow-hidden rounded-3xl border border-amber-200/65 bg-[linear-gradient(180deg,#fffdf8_0%,#fffefb_58%,#fcf8ef_100%)] dark:border-slate-700 dark:bg-slate-950/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold capitalize text-slate-900 dark:text-slate-100">{localeTitle}</CardTitle>
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-amber-500" aria-hidden /> : null}
          </CardHeader>
          <CardContent className="overflow-x-auto px-3 pb-4 sm:px-5">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-7 gap-px bg-amber-200/65 dark:bg-slate-600">
                {weekLabels.map((w) => (
                  <div
                    key={w}
                    className="border-b border-amber-200/85 bg-white/92 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-amber-950/95 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200"
                  >
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-amber-200/50 dark:bg-slate-600">
                {cells.map((day, idx) =>
                  day == null ? (
                    <div key={`pad-${idx}`} className="min-h-[88px] border border-white/95 bg-[#faf9f6] dark:bg-slate-900/65 dark:border-transparent" />
                  ) : (
                    <CalendarDayCell key={idx} ym={monthYM} day={day} byDay={byDay} loadDetail={loadDetail} compact />
                  ),
                )}
              </div>
              {!loading && filteredCalendar.length === 0 ? (
                <div className="mt-12 rounded-xl border border-dashed border-amber-300/70 px-8 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
                  Aucune réservation pour ce mois-ci (avec le filtre choisi).
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Desktop */}
        <div className="hidden lg:block">
          <Card className="sticky top-[5.75rem] max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-amber-200/65 dark:border-slate-700 dark:bg-slate-900">
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle>Détail</CardTitle>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-800/85 dark:text-amber-300/95">
                  {selectedId ? `#${selectedId.slice(0, 8)}` : ""}
                </p>
              </div>
              {detail?.request ? (
                <Button variant="outline" size="sm" type="button" className="shrink-0 rounded-full gap-2" asChild>
                  <Link
                    href={
                      detail.request?.guest_email
                        ? `mailto:${encodeURIComponent(detail.request.guest_email as string)}?subject=${encodeURIComponent("Jannat Bloudan — votre événement")}`
                        : "#"
                    }
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="text-sm">{detailInner}</CardContent>
          </Card>
        </div>

        {/* Mobile sheet */}
        <div className="lg:hidden">
          <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
            <SheetContent side="bottom" className="h-[88vh] overflow-y-auto rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Détails événement</SheetTitle>
                <SheetDescription>Actions et préparation</SheetDescription>
              </SheetHeader>
              <div className="pb-24 pt-2">{detailInner}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}

function CalendarDayCell(props: {
  ym: string
  day: number
  byDay: Map<string, EventRequest[]>
  loadDetail: (id: string) => Promise<void>
  compact?: boolean
}) {
  const { ym, day, byDay, loadDetail } = props
  const key = `${ym}-${pad2(day)}`
  const list = byDay.get(key) ?? []
  const vis = list.slice(0, 2)
  const extra = list.length - vis.length

  return (
    <div className={`min-h-[98px] border border-white/92 bg-[#fcfbf9] px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900 ${list.length ? "shadow-[inset_0_0_0_1px_rgba(245,218,169,0.35)] dark:shadow-none" : ""}`}>
      <span className="mb-1 block font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">{day}</span>
      <div className="flex flex-col gap-1">
        {vis.map((r) => (
          <RequestMiniCard key={r.id} r={r} onPick={() => void loadDetail(r.id)} compact />
        ))}
        {extra > 0 ? (
          <span className="text-center font-mono text-[10px] font-semibold text-amber-800/95 dark:text-amber-200">+{extra} autres</span>
        ) : null}
      </div>
    </div>
  )
}

function KpiCard(props: {
  label: string
  value: string
  accent?: "amber" | "emerald" | "gold"
}) {
  const { label, value, accent } = props
  const ring =
    accent === "gold"
      ? "ring-amber-300/85"
      : accent === "emerald"
        ? "ring-emerald-300/80"
        : accent === "amber"
          ? "ring-amber-200/95"
          : ""
  return (
    <Card className={`rounded-2xl shadow-sm ring-1 ring-transparent ${ring} dark:bg-slate-800/65 dark:border-slate-700`}>
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1.5 truncate text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">{value}</p>
      </CardContent>
    </Card>
  )
}

function DetailBody(props: {
  detail: DetailPayload
  quoteAmount: string
  setQuoteAmount: (s: string) => void
  quoteNotes: string
  setQuoteNotes: (s: string) => void
  submittingQuote: boolean
  sendQuote: () => void
  patchRequest: (body: Record<string, unknown>) => Promise<void>
  prepLabel: string
  setPrepLabel: (s: string) => void
  prepQty: string
  setPrepQty: (s: string) => void
  prepDeadline: string
  setPrepDeadline: (s: string) => void
  prepNotes: string
  setPrepNotes: (s: string) => void
  addPrepItem: () => Promise<void>
  editName: string
  setEditName: (s: string) => void
  editEmail: string
  setEditEmail: (s: string) => void
  editPhone: string
  setEditPhone: (s: string) => void
  editNotes: string
  setEditNotes: (s: string) => void
  saveEdits: () => Promise<void>
  savingEdit: boolean
  refreshDetail: () => Promise<void>
}) {
  const rq = props.detail.request
  const en = props.detail.enrichment
  const st = rq.status ?? "pending"
  const displaySt = displayStatusKey(rq)

  return (
    <div className="space-y-5">
      {/* modifier */}
      <div className="rounded-2xl border border-slate-200/85 bg-white/85 p-3 dark:border-slate-700 dark:bg-slate-950/55">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Pencil className="h-3 w-3" />
          Modifier
        </p>
        <div className="grid gap-2">
          <Input value={props.editName} onChange={(e) => props.setEditName(e.target.value)} placeholder="Nom" />
          <Input value={props.editEmail} type="email" onChange={(e) => props.setEditEmail(e.target.value)} placeholder="Email" />
          <Input value={props.editPhone} onChange={(e) => props.setEditPhone(e.target.value)} placeholder="Téléphone" />
          <Textarea value={props.editNotes} onChange={(e) => props.setEditNotes(e.target.value)} placeholder="Demandes spéciales" rows={2} />
          <Button size="pillSm" variant="outline" className="w-full rounded-full" type="button" disabled={props.savingEdit} onClick={props.saveEdits}>
            Enregistrer les modifications
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
        <div className="col-span-2">
          <Badge variant="outline" className={`${STATUS_MAP[displaySt]?.color ?? STATUS_MAP.pending.color} capitalize`}>
            {STATUS_MAP[displaySt]?.label ?? displaySt}
          </Badge>
        </div>
        <DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Date" val={`${rq.event_date}${rq.event_time ? ` · ${String(rq.event_time).slice(0, 5)}` : ""}`} />
        <DetailRow icon={<Users className="h-4 w-4" />} label="Pers." val={String(rq.guests_count)} />
        <div className="col-span-2">
          <p className="text-[11px] font-medium text-slate-500">Montants</p>
          <div className="mt-2 flex justify-between rounded-xl bg-amber-50/95 px-3 py-2 text-sm dark:bg-amber-950/35">
            <span>Total estim.</span>
            <span>{formatCurrency(Number(en?.latest_quote_total ?? rq.estimated_budget ?? 0))}</span>
          </div>
          <div className="mt-2 flex justify-between rounded-xl border border-green-300/85 bg-green-50/70 px-3 py-2 text-sm dark:bg-green-950/25 dark:border-green-800">
            <span>Acompte</span>
            <span>
              {(en?.deposit_paid ?? false ? "✓ Payé · " : "Non payé · ") +
                `${formatCurrency(Number(en?.deposit_amount ?? 0))}`}
            </span>
          </div>
          <div className="mt-2 flex justify-between rounded-xl bg-rose-50/70 px-3 py-2 text-sm font-semibold dark:bg-rose-950/25">
            <span>Reste à payer</span>
            <span>{formatCurrency(Number(en?.balance_due ?? 0))}</span>
          </div>
        </div>
      </div>

      {rq.package ? (
        <div className="rounded-xl border border-amber-200/75 bg-white/92 p-4 dark:bg-amber-950/15 dark:border-amber-800/40">
          <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">Pack</p>
          <p className="font-semibold text-slate-900 dark:text-slate-50">{(rq.package as EventPackage).name}</p>
        </div>
      ) : null}

      {(props.detail.status_history?.length ?? 0) > 0 ? (
        <div className="rounded-xl border border-slate-200/95 p-3 dark:border-slate-700 dark:bg-slate-950">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Historique des changements</p>
          <ul className="max-h-[180px] space-y-2 overflow-y-auto text-[11px]">
            {(props.detail.status_history ?? []).map((h) => (
              <li key={h.id} className="flex flex-wrap gap-1 rounded-lg bg-slate-50/92 px-2 py-1.5 dark:bg-slate-900/95">
                <span className="font-mono text-slate-500">{new Date(h.created_at).toLocaleString("fr-FR")}</span>
                <span>
                  {(h.from_status ?? "∅") ?? "∅"} → <strong>{h.to_status}</strong>
                </span>
                {h.note ? <span className="w-full italic text-slate-600">{h.note}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {(props.detail.reminder_log?.length ?? 0) > 0 ? (
        <div className="rounded-xl border border-sky-300/95 bg-sky-50/40 p-3 text-[11px] dark:bg-sky-950/35 dark:border-sky-900">
          <p className="mb-3 font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-200">Notifications envoyées / planifiées (log)</p>
          <ul className="max-h-[120px] space-y-2 overflow-y-auto">
            {(props.detail.reminder_log ?? []).map((r) => (
              <li key={`${r.reminder_key}_${r.sent_at}`} className="flex justify-between gap-2 rounded-md bg-white/94 px-2 py-2 dark:bg-slate-950/70">
                <span className="font-mono text-[11px] text-sky-950 dark:text-sky-200">{r.reminder_key}</span>
                <span className="shrink-0 text-sky-950/95 dark:text-sky-400">{new Date(r.sent_at).toLocaleDateString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Prep */}
        <div className="rounded-2xl border border-amber-200/95 bg-gradient-to-br from-[#fefdfa] via-white to-[#fff9ef] px-4 py-4 shadow-[0_14px_40px_-30px_rgba(120,60,40,0.38)] dark:border-amber-800/65 dark:bg-slate-950">
        <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          <ClipboardList className="h-4 w-4" />
          Préparations nécessaires
        </p>
        <div className="mb-5 flex flex-wrap gap-2">
          {(props.detail.preparation_items ?? []).map((it) => (
            <div key={String(it.id)} className="flex grow basis-[48%] items-center gap-3 rounded-xl border border-amber-200/75 bg-white/95 px-3 py-2 text-[11px] dark:border-slate-600 dark:bg-slate-950">
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-slate-900 dark:text-white">{String(it.label ?? "")}</span>
                <div className="text-[10px] uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  {String(it.quantity ?? "").trim()}
                  {String(it.unit ?? "").trim()} · Deadline {String(it.deadline ?? "—")}
                  <span className="ml-1 font-semibold text-amber-800 dark:text-amber-200">&nbsp;[{String(it.status)}]</span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full text-[11px]"
                disabled={String(it.status) !== "to_buy"}
                onClick={async () => {
                  const res = await fetch(`/api/admin/private-events/${rq.id}/preparation-items/${it.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "purchased" }),
                  })
                  if (res.ok) await props.refreshDetail()
                }}
              >
                Acheté
              </Button>
            </div>
          ))}
          {(props.detail.preparation_items?.length ?? 0) === 0 ? (
            <p className="py-6 text-xs text-slate-500">Aucun item encore — ajoutez une ligne ci-dessous.</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-amber-200/95 bg-[#fcfbf9] px-3 py-3 dark:bg-slate-900">
          <p className="mb-3 text-[10px] font-semibold uppercase text-slate-600 dark:text-slate-400">Ajouter une tâche achat/préparation</p>
          <div className="grid gap-2">
            <Input placeholder="Élément ex: gâteau" value={props.prepLabel} onChange={(e) => props.setPrepLabel(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Qté" type="number" step="any" value={props.prepQty} onChange={(e) => props.setPrepQty(e.target.value)} />
              <Input placeholder="Deadline (yyyy-mm-dd)" value={props.prepDeadline} onChange={(e) => props.setPrepDeadline(e.target.value)} />
            </div>
            <Textarea placeholder="Notes" rows={2} value={props.prepNotes} onChange={(e) => props.setPrepNotes(e.target.value)} />
            <Button type="button" size="sm" variant="outline" className="w-full rounded-full" onClick={props.addPrepItem}>
              Ajouter
            </Button>
          </div>
        </div>
      </div>

      {/* Devis */}
      {(st === "pending" || st === "reviewing") && (
        <div className="rounded-xl border border-slate-200/85 p-3 dark:border-slate-700 dark:bg-slate-950">
          <p className="mb-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">Envoyer un devis</p>
          <Input type="number" placeholder="Montant HT (EUR)" value={props.quoteAmount} onChange={(e) => props.setQuoteAmount(e.target.value)} />
          <Textarea className="mt-2" rows={2} placeholder="Notes devis" value={props.quoteNotes} onChange={(e) => props.setQuoteNotes(e.target.value)} />
          <Button className="mt-3 w-full rounded-full bg-amber-600 hover:bg-amber-700" type="button" disabled={props.submittingQuote} onClick={props.sendQuote}>
            {props.submittingQuote ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Générer / envoyer devis"}
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {!["confirmed", "in_progress"].includes(st) && st !== "cancelled" && (
          <>
            <Button className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700" type="button" onClick={() => props.patchRequest({ status: "confirmed" })}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmer
            </Button>
            <Button variant="outline" className="w-full rounded-full" type="button" onClick={() => props.patchRequest({ status: "reviewing" })}>
              <Clock className="mr-2 h-4 w-4" /> Mettre en revue
            </Button>
            <Button variant="outline" className="w-full rounded-full" type="button" onClick={() => props.patchRequest({ status: "reviewing", note: "Devis envoyé (manuel)" })}>
              Marquer « devis envoyé »
            </Button>
          </>
        )}
        {st !== "cancelled" && (
          <>
            <Button variant="destructive" className="w-full rounded-full" type="button" onClick={() => props.patchRequest({ status: "cancelled", note: "Annulée admin" })}>
              Annuler réservation
            </Button>
            <Button variant="outline" className="w-full rounded-full" type="button" asChild>
              <a href={rq.guest_phone ? `https://wa.me/${String(rq.guest_phone).replace(/\D/g, "")}` : "#"}>
                WhatsApp client
              </a>
            </Button>
          </>
        )}
        {["completed"].includes(st) ? null : st === "confirmed" ? (
          <Button variant="secondary" type="button" className="w-full rounded-full" onClick={() => props.patchRequest({ status: "completed", note: "Terminée" })}>
            Marquer comme terminée
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function DetailRow(props: { icon: React.ReactNode; label: string; val: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-[#fcfbf9] px-3 py-2 dark:bg-slate-950/52">
      <span className="mt-px text-amber-700 dark:text-amber-500">{props.icon}</span>
      <span>
        <span className="block text-[10px] uppercase tracking-wide text-slate-600 dark:text-slate-400">{props.label}</span>
        <span className="block font-semibold">{props.val}</span>
      </span>
    </div>
  )
}

export default function PrivateEventsAdminPage() {
  return (
    <RequireAuth roles={["ADMIN", "SERVER", "CASHIER", "KITCHEN", "BAR", "SHISHA", "DELIVERY"]}>
      <PageShell>
        <SiteHeader backHref="/admin" hideMainNav />
        <PrivateEventsPlannerClient />
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
