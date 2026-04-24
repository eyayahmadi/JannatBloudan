"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Calendar,
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

type EventPackage = {
  id: string
  name: string
  description?: string | null
  base_price: number
  min_guests?: number | null
  max_guests?: number | null
  duration_hours?: number | null
  included_items?: unknown
  active?: boolean
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
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
  reviewing: { label: "En revue", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: FileText },
  quoted: { label: "Devis envoye", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", icon: FileText },
  confirmed: { label: "Confirme", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
  completed: { label: "Termine", color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300", icon: CheckCircle2 },
  cancelled: { label: "Annule", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: XCircle },
}

const EVENT_TYPES: Record<string, string> = {
  anniversaire: "Anniversaire",
  mariage: "Mariage",
  entreprise: "Evenement entreprise",
  prive: "Prive",
  autre: "Autre",
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })

const formatCurrency = (v: number) => `${v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} EUR`

export default function PrivateEventsAdminPage() {
  const [requests, setRequests] = useState<EventRequest[]>([])
  const [packages, setPackages] = useState<EventPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [selected, setSelected] = useState<EventRequest | null>(null)
  const [quoteAmount, setQuoteAmount] = useState("")
  const [quoteNotes, setQuoteNotes] = useState("")
  const [submittingQuote, setSubmittingQuote] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/events/private")
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests ?? [])
        setPackages(data.packages ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    if (filter === "all") return requests
    return requests.filter((r) => r.status === filter)
  }, [requests, filter])

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      confirmed: requests.filter((r) => r.status === "confirmed").length,
      revenue: requests
        .filter((r) => r.status === "confirmed" || r.status === "completed")
        .reduce((s, r) => s + Number(r.estimated_budget ?? 0), 0),
    }
  }, [requests])

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/events/private/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      )
      if (selected?.id === id) setSelected({ ...selected, status })
    }
  }

  const sendQuote = async () => {
    if (!selected || !quoteAmount) return
    setSubmittingQuote(true)
    try {
      const amount = parseFloat(quoteAmount)
      const res = await fetch(`/api/events/private/${selected.id}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal: amount,
          notes: quoteNotes,
        }),
      })
      if (res.ok) {
        setQuoteAmount("")
        setQuoteNotes("")
        await load()
      }
    } finally {
      setSubmittingQuote(false)
    }
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin" hideMainNav />

        <div className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-amber-500" />
              Evenements prives
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gestion des demandes de reservation privee (anniversaires, mariages, entreprises)
            </p>
          </div>

          {/* KPI */}
          <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="dark:bg-slate-800/60 dark:border-slate-700">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">Total demandes</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-800/60 dark:border-slate-700">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">En attente</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-800/60 dark:border-slate-700">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">Confirmes</p>
                <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-800/60 dark:border-slate-700">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">CA evenements</p>
                <p className="text-3xl font-bold text-amber-600">
                  {formatCurrency(stats.revenue)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Packages disponibles */}
          {packages.length > 0 && (
            <Card className="mb-8 dark:bg-slate-800/60 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  Formules proposees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-lg border border-amber-200 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-950/10 p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">{p.name}</h3>
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          {formatCurrency(Number(p.base_price))}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {p.description}
                      </p>
                      <div className="flex gap-3 text-xs text-slate-500">
                        {p.min_guests && p.max_guests && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {p.min_guests}-{p.max_guests} pers.
                          </span>
                        )}
                        {p.duration_hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {p.duration_hours}h
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filtres */}
          <div className="mb-4 flex flex-wrap gap-2">
            {["all", "pending", "reviewing", "quoted", "confirmed", "completed", "cancelled"].map(
              (s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={filter === s ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setFilter(s)}
                >
                  {s === "all" ? "Tout" : STATUS_MAP[s]?.label ?? s}
                </Button>
              ),
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste */}
            <div className="lg:col-span-2 space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                </div>
              ) : filtered.length === 0 ? (
                <Card className="dark:bg-slate-800/60 dark:border-slate-700">
                  <CardContent className="py-12 text-center text-slate-500">
                    Aucune demande{filter !== "all" ? ` avec le statut "${STATUS_MAP[filter]?.label}"` : ""}.
                  </CardContent>
                </Card>
              ) : (
                filtered.map((req) => {
                  const statusInfo = STATUS_MAP[req.status] ?? STATUS_MAP.pending
                  const StatusIcon = statusInfo.icon
                  const isSelected = selected?.id === req.id
                  return (
                    <Card
                      key={req.id}
                      className={`cursor-pointer transition-all dark:bg-slate-800/60 dark:border-slate-700 ${
                        isSelected
                          ? "border-amber-400 dark:border-amber-500 shadow-lg"
                          : "hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                      onClick={() => setSelected(req)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {EVENT_TYPES[req.event_type] ?? req.event_type} — {req.guest_name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              #{req.request_number ?? req.id.slice(0, 8)}
                            </p>
                          </div>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mt-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            {formatDate(req.event_date)}
                            {req.event_time && ` a ${req.event_time.slice(0, 5)}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-600" />
                            {req.guests_count} invites
                          </span>
                          {req.estimated_budget && (
                            <span className="flex items-center gap-1">
                              <Euro className="h-4 w-4 text-green-600" />
                              {formatCurrency(Number(req.estimated_budget))}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-1">
              {selected ? (
                <Card className="sticky top-4 dark:bg-slate-800/60 dark:border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">Detail de la demande</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(null)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500">Client</p>
                      <p className="font-semibold">{selected.guest_name}</p>
                      {selected.guest_email && (
                        <p className="text-sm flex items-center gap-1 text-slate-600">
                          <Mail className="h-3 w-3" /> {selected.guest_email}
                        </p>
                      )}
                      {selected.guest_phone && (
                        <p className="text-sm flex items-center gap-1 text-slate-600">
                          <Phone className="h-3 w-3" /> {selected.guest_phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Type</p>
                      <p className="font-semibold">
                        {EVENT_TYPES[selected.event_type] ?? selected.event_type}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Date</p>
                        <p className="font-semibold">{formatDate(selected.event_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Invites</p>
                        <p className="font-semibold">{selected.guests_count}</p>
                      </div>
                    </div>

                    {selected.package && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-950/20 p-3">
                        <p className="text-xs text-amber-700 dark:text-amber-400">Formule</p>
                        <p className="font-semibold">{selected.package.name}</p>
                        <p className="text-sm">{formatCurrency(Number(selected.package.base_price))}</p>
                      </div>
                    )}

                    {selected.special_requests && (
                      <div>
                        <p className="text-xs text-slate-500">Demandes speciales</p>
                        <p className="text-sm italic">{selected.special_requests}</p>
                      </div>
                    )}

                    {/* Envoyer un devis */}
                    {(selected.status === "pending" || selected.status === "reviewing") && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-semibold mb-2">Envoyer un devis</p>
                        <div className="space-y-2">
                          <Input
                            type="number"
                            placeholder="Montant HT (EUR)"
                            value={quoteAmount}
                            onChange={(e) => setQuoteAmount(e.target.value)}
                          />
                          <Textarea
                            placeholder="Notes (optionnel)"
                            value={quoteNotes}
                            onChange={(e) => setQuoteNotes(e.target.value)}
                            rows={2}
                          />
                          <Button
                            className="w-full"
                            onClick={sendQuote}
                            disabled={submittingQuote || !quoteAmount}
                          >
                            {submittingQuote ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Generer devis"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="border-t pt-4 space-y-2">
                      {selected.status !== "confirmed" && selected.status !== "cancelled" && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => updateStatus(selected.id, "confirmed")}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirmer
                        </Button>
                      )}
                      {selected.status !== "cancelled" && (
                        <Button
                          variant="outline"
                          className="w-full text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => updateStatus(selected.id, "cancelled")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Annuler
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="dark:bg-slate-800/60 dark:border-slate-700">
                  <CardContent className="py-12 text-center text-slate-500">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">Selectionnez une demande pour voir le detail</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
