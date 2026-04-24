"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Lightbulb, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

type Prediction = {
  date: string
  dayName: string
  predictedRevenue: number
  predictedOrders: number
  predictedCustomers: number
  confidence: number
  lower: number
  upper: number
}

type ForecastData = {
  predictions: Prediction[]
  weeklyTrend: number
  peakHours: Record<string, Record<string, number>>
  healthScore: number
  historicalSummary: {
    avgDailyRevenue: number
    avgDailyOrders: number
    totalRevenue: number
    bestDay: { date: string; revenue: number }
  }
  recommendations: string[]
}

function heatColor(intensity: number): string {
  if (intensity >= 80) return "bg-orange-600 text-white"
  if (intensity >= 60) return "bg-orange-400 text-white"
  if (intensity >= 40) return "bg-amber-300 text-amber-950"
  if (intensity >= 20) return "bg-yellow-200 text-amber-900"
  return "bg-yellow-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-500"
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 40) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function scoreRingColor(score: number): string {
  if (score >= 70) return "border-emerald-500"
  if (score >= 40) return "border-amber-500"
  return "border-red-500"
}

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)

  const [promo, setPromo] = useState(-10)
  const [budget, setBudget] = useState(0)

  useEffect(() => {
    fetch("/api/ai/forecast")
      .then((r) => r.json())
      .then((d: ForecastData) => setData(d))
      .catch(() => toast.error("Erreur chargement previsions"))
      .finally(() => setLoading(false))
  }, [])

  const baseRevenue7d = data?.predictions.reduce((s, p) => s + p.predictedRevenue, 0) ?? 0
  const promoMultiplier = 1 + Math.abs(promo) * 0.008
  const budgetMultiplier = 1 + budget * 0.0004
  const simulatedRevenue = Math.round(baseRevenue7d * promoMultiplier * budgetMultiplier)

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin/ai" />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-100 sm:text-3xl">
            Previsions Business IA
          </h1>
          <p className="mt-1 text-sm text-amber-800/70 dark:text-amber-300/70">
            Previsions, tendances et analyse predictive
          </p>

          {loading ? (
            <div className="mt-12 text-center text-amber-700 dark:text-amber-400">Chargement...</div>
          ) : data ? (
            <div className="mt-8 space-y-10">
              {/* Health score + trend */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-center justify-center rounded-2xl border border-amber-200/60 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                  <div className="text-center">
                    <div className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[6px] ${scoreRingColor(data.healthScore)}`}>
                      <span className={`text-4xl font-bold ${scoreColor(data.healthScore)}`}>{data.healthScore}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-amber-950 dark:text-amber-100">Sante Business</p>
                    <p className="text-xs text-amber-700/60 dark:text-amber-400/60">sur 100</p>
                  </div>
                </div>

                <div className="flex items-center justify-center rounded-2xl border border-amber-200/60 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                  <div className="flex items-center gap-3">
                    {data.weeklyTrend >= 0 ? (
                      <TrendingUp className="h-10 w-10 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-10 w-10 text-red-500" />
                    )}
                    <div>
                      <p className={`text-4xl font-bold ${data.weeklyTrend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {data.weeklyTrend >= 0 ? "+" : ""}{data.weeklyTrend}%
                      </p>
                      <p className="text-sm font-medium text-amber-700/70 dark:text-amber-400/70">Tendance hebdomadaire</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 prediction cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Revenue prevue (7 jours)",
                    value: `${data.predictions.reduce((s, p) => s + p.predictedRevenue, 0).toLocaleString()} EUR`,
                    icon: DollarSign,
                  },
                  {
                    label: "Commandes prevues",
                    value: data.predictions.reduce((s, p) => s + p.predictedOrders, 0),
                    icon: ShoppingCart,
                  },
                  {
                    label: "Clients prevus",
                    value: data.predictions.reduce((s, p) => s + p.predictedCustomers, 0),
                    icon: Users,
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="flex items-center gap-4 rounded-2xl border border-amber-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-950 dark:text-amber-100">{card.value}</p>
                      <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70">{card.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 7-day bar chart */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Previsions 7 jours</h2>
                <div className="flex items-end gap-2">
                  {data.predictions.map((p) => {
                    const maxUpper = Math.max(...data.predictions.map((d) => d.upper))
                    const barH = (p.predictedRevenue / maxUpper) * 180
                    const upperH = (p.upper / maxUpper) * 180
                    const lowerH = (p.lower / maxUpper) * 180
                    return (
                      <div key={p.date} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
                          {p.predictedRevenue}
                        </span>
                        <div className="relative w-full" style={{ height: `${upperH}px` }}>
                          <div
                            className="absolute inset-x-0 bottom-0 rounded-t-md bg-amber-200/50 dark:bg-amber-800/30"
                            style={{ height: `${upperH}px` }}
                          />
                          <div
                            className="absolute inset-x-0 bottom-0 rounded-t-md bg-amber-300/60 dark:bg-amber-700/40"
                            style={{ height: `${lowerH}px` }}
                          />
                          <div
                            className="absolute inset-x-0 bottom-0 rounded-t-md bg-gradient-to-t from-orange-500 to-amber-400"
                            style={{ height: `${barH}px` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-amber-700/70 dark:text-amber-400/60">{p.dayName}</span>
                        <span className="text-[9px] text-amber-600/50 dark:text-amber-500/40">{p.confidence}%</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 flex items-center gap-4 text-[10px] text-amber-700/60 dark:text-amber-400/50">
                  <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-gradient-to-t from-orange-500 to-amber-400" /> Prevu</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-amber-300/60 dark:bg-amber-700/40" /> Min</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-amber-200/50 dark:bg-amber-800/30" /> Max</span>
                </div>
              </section>

              {/* Peak hours heatmap */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Heures de pointe</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 text-left text-amber-700/70 dark:text-amber-400/70">Heure</th>
                        {Object.keys(data.peakHours).map((day) => (
                          <th key={day} className="px-2 py-1 font-semibold text-amber-950 dark:text-amber-100">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(Object.values(data.peakHours)[0] ?? {}).map((hour) => (
                        <tr key={hour}>
                          <td className="px-2 py-1 text-left font-medium text-amber-800 dark:text-amber-300">{hour}</td>
                          {Object.keys(data.peakHours).map((day) => {
                            const val = data.peakHours[day][hour] ?? 0
                            return (
                              <td key={day} className="px-1 py-1">
                                <div className={`mx-auto flex h-7 w-10 items-center justify-center rounded ${heatColor(val)}`}>
                                  {val}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Recommendations */}
              {data.recommendations.length > 0 && (
                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                    <Lightbulb className="h-5 w-5 text-orange-500" /> Recommandations
                  </h2>
                  <ul className="space-y-2">
                    {data.recommendations.map((r, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-white/70 p-4 text-sm text-amber-800 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300"
                      >
                        <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-amber-500 to-orange-500" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* What-If simulation */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <SlidersHorizontal className="h-5 w-5 text-orange-600" /> Simulation What-If
                </h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-amber-800 dark:text-amber-300">
                      Promotion: {promo}%
                    </label>
                    <input
                      type="range"
                      min={-30}
                      max={-10}
                      value={promo}
                      onChange={(e) => setPromo(Number(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-amber-600/60 dark:text-amber-500/50">
                      <span>-30%</span><span>-10%</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-amber-800 dark:text-amber-300">
                      Budget marketing: {budget} EUR
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={500}
                      step={10}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-amber-600/60 dark:text-amber-500/50">
                      <span>0 EUR</span><span>500 EUR</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:from-amber-950/40 dark:to-orange-950/30">
                  <p className="text-sm text-amber-700/80 dark:text-amber-400/70">Revenue projetee (7 jours)</p>
                  <p className="text-3xl font-bold text-amber-950 dark:text-amber-100">{simulatedRevenue.toLocaleString()} EUR</p>
                  {simulatedRevenue > baseRevenue7d && (
                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      +{((simulatedRevenue / baseRevenue7d - 1) * 100).toFixed(1)}% vs base
                    </p>
                  )}
                </div>
              </section>

              {/* Historical summary */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Resume historique</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Revenue moy. / jour", value: `${data.historicalSummary.avgDailyRevenue} EUR` },
                    { label: "Commandes moy. / jour", value: data.historicalSummary.avgDailyOrders },
                    { label: "Revenue totale (90j)", value: `${data.historicalSummary.totalRevenue.toLocaleString()} EUR` },
                    { label: "Meilleur jour", value: `${data.historicalSummary.bestDay.date} — ${data.historicalSummary.bestDay.revenue} EUR` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-amber-50/50 p-4 dark:bg-amber-950/40">
                      <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/60">{item.label}</p>
                      <p className="mt-1 text-lg font-bold text-amber-950 dark:text-amber-100">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="mt-12 text-center text-red-600">Erreur de chargement</div>
          )}
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
