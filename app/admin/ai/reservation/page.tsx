"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CalendarCheck,
  Users,
  Armchair,
  Percent,
  AlertTriangle,
  Star,
  BarChart3,
  ShieldAlert,
  Sparkles,
  Calculator,
  MapPin,
} from "lucide-react"
import { toast } from "sonner"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

type TableSuggestion = {
  id: number
  capacity: number
  zone: string
  reason: string
}

type NoShowPrediction = {
  id: string
  name: string
  guests: number
  time: string
  riskLevel: "high" | "medium" | "low"
  recommendation: string
}

type Overbooking = {
  enabled: boolean
  extraSlots: number
  noShowRate: number
  reason: string
}

type Metrics = {
  totalTables: number
  reservationsTonight: number
  occupancyRate: number
  highRiskNoShows: number
}

type ReservationData = {
  suggestedTable: TableSuggestion | null
  alternatives: TableSuggestion[]
  noShowPredictions: NoShowPrediction[]
  occupancyForecast: Record<string, number>
  overbooking: Overbooking
  metrics: Metrics
}

const FALLBACK: ReservationData = {
  suggestedTable: { id: 7, capacity: 4, zone: "interieur", reason: "Proximite fenetre, ambiance calme, capacite ideale pour 4 convives" },
  alternatives: [
    { id: 12, capacity: 6, zone: "terrasse", reason: "Table spacieuse en terrasse couverte" },
    { id: 3, capacity: 4, zone: "interieur", reason: "Proche de l'entree, service rapide" },
    { id: 15, capacity: 4, zone: "vip", reason: "Zone VIP, experience premium" },
  ],
  noShowPredictions: [
    { id: "r1", name: "M. Dupont", guests: 4, time: "19:00", riskLevel: "high", recommendation: "Appeler pour confirmer 2h avant" },
    { id: "r2", name: "Mme. Laurent", guests: 2, time: "19:30", riskLevel: "low", recommendation: "Client fidele, aucun risque" },
    { id: "r3", name: "M. Bernard", guests: 6, time: "20:00", riskLevel: "medium", recommendation: "Envoyer SMS de rappel" },
    { id: "r4", name: "Mme. Petit", guests: 3, time: "20:00", riskLevel: "high", recommendation: "Historique de 2 no-shows, demander acompte" },
    { id: "r5", name: "M. Martin", guests: 2, time: "20:30", riskLevel: "low", recommendation: "Reservation confirmee par email" },
    { id: "r6", name: "M. Moreau", guests: 5, time: "21:00", riskLevel: "medium", recommendation: "Premiere visite, envoyer rappel" },
  ],
  occupancyForecast: {
    "18:00": 20,
    "18:30": 35,
    "19:00": 55,
    "19:30": 75,
    "20:00": 90,
    "20:30": 95,
    "21:00": 85,
    "21:30": 70,
    "22:00": 45,
    "22:30": 25,
  },
  overbooking: {
    enabled: true,
    extraSlots: 3,
    noShowRate: 15,
    reason: "Taux de no-show historique de 15% — 3 reservations supplementaires recommandees pour optimiser le remplissage",
  },
  metrics: { totalTables: 20, reservationsTonight: 18, occupancyRate: 78, highRiskNoShows: 2 },
}

const RISK_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
}

const RISK_LABEL: Record<string, string> = {
  high: "Eleve",
  medium: "Moyen",
  low: "Faible",
}

const ZONES = ["interieur", "terrasse", "vip", "gaming"]

export default function ReservationPage() {
  const [data, setData] = useState<ReservationData | null>(null)
  const [loading, setLoading] = useState(true)

  const [simGuests, setSimGuests] = useState(4)
  const [simZone, setSimZone] = useState("")
  const [simLoading, setSimLoading] = useState(false)

  const fetchData = useCallback((guests = 4, zone?: string) => {
    const body: Record<string, unknown> = { guests, date: "2024-12-15", time: "19:00" }
    if (zone) body.zone = zone

    fetch("/api/ai/reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => {
        setData(FALLBACK)
        toast.error("Donnees de demonstration chargees")
      })
      .finally(() => {
        setLoading(false)
        setSimLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSimulate = () => {
    setSimLoading(true)
    fetchData(simGuests, simZone || undefined)
  }

  const d = data ?? FALLBACK
  const forecastEntries = Object.entries(d.occupancyForecast).sort(([a], [b]) => a.localeCompare(b))
  const maxForecast = Math.max(...forecastEntries.map(([, v]) => v), 1)

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin/ai" />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-100 sm:text-3xl">
                Reservation Intelligente
              </h1>
              <p className="text-sm text-amber-800/70 dark:text-amber-300/70">
                Optimisation IA des reservations et prediction des no-shows
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-12 text-center text-amber-700 dark:text-amber-400">Chargement...</div>
          ) : (
            <div className="mt-8 space-y-10">
              {/* Metrics row */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total tables", value: d.metrics.totalTables, icon: Armchair, color: "text-amber-600 dark:text-amber-400" },
                  { label: "Reservations ce soir", value: d.metrics.reservationsTonight, icon: CalendarCheck, color: "text-orange-600 dark:text-orange-400" },
                  { label: "Taux occupation", value: `${d.metrics.occupancyRate}%`, icon: Percent, color: "text-violet-600 dark:text-violet-400" },
                  { label: "No-shows haut risque", value: d.metrics.highRiskNoShows, icon: AlertTriangle, color: "text-red-600 dark:text-red-400" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="flex items-center gap-4 rounded-2xl border border-amber-200/60 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                      <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70">{card.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggested table */}
              {d.suggestedTable && (
                <section>
                  <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
                    <Sparkles className="mr-2 inline h-5 w-5 text-orange-500" />
                    Table Suggeree par l&apos;IA
                  </h2>
                  <div className="rounded-2xl border-2 border-amber-400/70 bg-gradient-to-br from-amber-50/80 to-orange-50/80 p-6 shadow-lg dark:border-amber-600/50 dark:from-amber-950/40 dark:to-orange-950/40">
                    <div className="flex flex-wrap items-start gap-6">
                      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                        <Star className="mb-1 h-5 w-5" />
                        <span className="text-2xl font-bold">T{d.suggestedTable.id}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/70 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-800/40 dark:text-amber-300">
                            <MapPin className="h-3 w-3" /> {d.suggestedTable.zone}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-200/70 px-3 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-800/40 dark:text-orange-300">
                            <Users className="h-3 w-3" /> {d.suggestedTable.capacity} places
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                          {d.suggestedTable.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Alternative tables */}
              {d.alternatives.length > 0 && (
                <section>
                  <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Tables Alternatives</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {d.alternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className="rounded-2xl border border-amber-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            <span className="text-lg font-bold">T{alt.id}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{alt.zone}</span>
                              <span className="text-xs text-amber-500 dark:text-amber-500">•</span>
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{alt.capacity} places</span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-amber-700/80 dark:text-amber-400/70">{alt.reason}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* No-show predictions */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <ShieldAlert className="mr-2 inline h-5 w-5 text-orange-500" />
                  Prediction des No-Shows
                </h2>
                <div className="space-y-3">
                  {d.noShowPredictions.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center gap-4 rounded-xl border border-amber-200/60 bg-white/70 px-5 py-4 shadow-sm dark:border-amber-800/40 dark:bg-amber-950/30"
                    >
                      <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${RISK_STYLE[r.riskLevel]}`}>
                        {RISK_LABEL[r.riskLevel]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                          {r.name}
                          <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
                            {r.guests} pers. — {r.time}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-amber-700/70 dark:text-amber-400/60">{r.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Occupancy forecast bar chart */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <BarChart3 className="mr-2 inline h-5 w-5 text-orange-500" />
                  Prevision d&apos;occupation
                </h2>
                <div className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                  <div className="flex items-end gap-2 sm:gap-3" style={{ height: 200 }}>
                    {forecastEntries.map(([time, pct]) => {
                      const h = (pct / maxForecast) * 100
                      const barColor =
                        pct >= 90
                          ? "bg-red-500 dark:bg-red-600"
                          : pct >= 70
                            ? "bg-orange-500 dark:bg-orange-600"
                            : pct >= 40
                              ? "bg-amber-500 dark:bg-amber-600"
                              : "bg-emerald-500 dark:bg-emerald-600"
                      return (
                        <div key={time} className="flex flex-1 flex-col items-center gap-1">
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">{pct}%</span>
                          <div className="w-full flex-1 flex items-end">
                            <div
                              className={`w-full rounded-t-lg ${barColor} transition-all`}
                              style={{ height: `${h}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-amber-600/70 dark:text-amber-400/60">{time}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>

              {/* Overbooking */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <AlertTriangle className="mr-2 inline h-5 w-5 text-orange-500" />
                  Strategie d&apos;Overbooking
                </h2>
                <div className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                  <div className="flex flex-wrap items-center gap-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        d.overbooking.enabled
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                      }`}
                    >
                      {d.overbooking.enabled ? "Active" : "Desactive"}
                    </span>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-100">{d.overbooking.extraSlots}</span>
                        <span className="ml-1 text-amber-600/70 dark:text-amber-400/60">places suppl.</span>
                      </div>
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-100">{d.overbooking.noShowRate}%</span>
                        <span className="ml-1 text-amber-600/70 dark:text-amber-400/60">taux no-show</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-amber-700/80 dark:text-amber-400/70">
                    {d.overbooking.reason}
                  </p>
                </div>
              </section>

              {/* Simulator */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <Calculator className="mr-2 inline h-5 w-5 text-orange-500" />
                  Simuler une Reservation
                </h2>
                <div className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Nombre de convives
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={simGuests}
                        onChange={(e) => setSimGuests(Number(e.target.value))}
                        className="w-28 rounded-xl border border-amber-300/60 bg-white px-3 py-2 text-sm text-amber-900 shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-amber-700/40 dark:bg-amber-950/50 dark:text-amber-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Zone preferee
                      </label>
                      <select
                        value={simZone}
                        onChange={(e) => setSimZone(e.target.value)}
                        className="w-40 rounded-xl border border-amber-300/60 bg-white px-3 py-2 text-sm text-amber-900 shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-amber-700/40 dark:bg-amber-950/50 dark:text-amber-100"
                      >
                        <option value="">Toutes zones</option>
                        {ZONES.map((z) => (
                          <option key={z} value={z}>{z.charAt(0).toUpperCase() + z.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={simLoading}
                      onClick={handleSimulate}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-amber-700 hover:to-orange-700 hover:shadow-xl disabled:opacity-50"
                    >
                      <Calculator className="h-4 w-4" />
                      {simLoading ? "Calcul..." : "Calculer"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
