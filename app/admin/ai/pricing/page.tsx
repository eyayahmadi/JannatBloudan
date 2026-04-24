"use client"

import { useState, useEffect } from "react"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Percent,
  Clock,
  Sun,
  Moon,
  Coffee,
  Utensils,
  CalendarDays,
  History,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

type PricingItem = {
  id: number
  name: string
  category: string
  originalPrice: number
  suggestedPrice: number
  discountPercent: number
  reasons: string[]
  revenueImpact: string
  autoEnabled: boolean
}

type PricingContext = {
  hour: number
  day: number
  isWeekend: boolean
  isHappyHour: boolean
  isLunchRush: boolean
  isDinnerRush: boolean
}

type PricingSummary = {
  increased: number
  decreased: number
  unchanged: number
  avgModifier: number
}

type PricingData = {
  pricing: PricingItem[]
  context: PricingContext
  summary: PricingSummary
  algorithm: string
}

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

const MOCK_HISTORY = [
  { id: 1, product: "Shawarma Poulet", from: 8.5, to: 8.93, reason: "Rush dejeuner", time: "il y a 2h" },
  { id: 2, product: "The a la Menthe", from: 2.5, to: 2.13, reason: "Happy Hour", time: "il y a 3h" },
  { id: 3, product: "Kebab Halabi", from: 14.5, to: 15.95, reason: "Forte demande + stock bas", time: "il y a 5h" },
  { id: 4, product: "Pizza Orientale", from: 15.99, to: 16.79, reason: "Premium weekend", time: "Hier, 20h" },
  { id: 5, product: "Cafe Turc", from: 3.0, to: 2.7, reason: "Faible demande", time: "Hier, 15h" },
]

export default function PricingPage() {
  const [data, setData] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoToggles, setAutoToggles] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetch("/api/ai/pricing")
      .then((r) => r.json())
      .then((d: PricingData) => {
        setData(d)
        const toggles: Record<number, boolean> = {}
        d.pricing.forEach((p) => { toggles[p.id] = p.autoEnabled })
        setAutoToggles(toggles)
      })
      .catch(() => toast.error("Erreur chargement tarification"))
      .finally(() => setLoading(false))
  }, [])

  const ctx = data?.context
  const summary = data?.summary

  const estimatedDailyImpact = data
    ? data.pricing.reduce((acc, p) => acc + (p.suggestedPrice - p.originalPrice) * 15, 0)
    : 0

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin/ai" />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-100 sm:text-3xl">
            Tarification Dynamique IA
          </h1>
          <p className="mt-1 text-sm text-amber-800/70 dark:text-amber-300/70">
            Ajustement automatique des prix selon la demande, le stock et le contexte
          </p>

          {loading ? (
            <div className="mt-12 text-center text-amber-700 dark:text-amber-400">Chargement...</div>
          ) : data ? (
            <div className="mt-8 space-y-10">
              {/* Context bar */}
              {ctx && (
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { icon: Clock, label: `${ctx.hour}h00`, active: true },
                    { icon: CalendarDays, label: DAY_NAMES[ctx.day], active: true },
                    { icon: ctx.isWeekend ? Sun : Utensils, label: ctx.isWeekend ? "Weekend" : "Semaine", active: ctx.isWeekend },
                    { icon: Coffee, label: "Happy Hour", active: ctx.isHappyHour },
                    { icon: Utensils, label: "Rush dejeuner", active: ctx.isLunchRush },
                    { icon: Moon, label: "Rush diner", active: ctx.isDinnerRush },
                  ].map((tag) => (
                    <span
                      key={tag.label}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        tag.active
                          ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-900 ring-1 ring-amber-400/40 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-200 dark:ring-amber-600/30"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      <tag.icon className="h-3.5 w-3.5" />
                      {tag.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Summary cards */}
              {summary && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Prix augmentes", value: summary.increased, icon: TrendingUp, color: "text-red-600 dark:text-red-400" },
                    { label: "Prix reduits", value: summary.decreased, icon: TrendingDown, color: "text-emerald-600 dark:text-emerald-400" },
                    { label: "Inchanges", value: summary.unchanged, icon: Minus, color: "text-amber-600 dark:text-amber-400" },
                    { label: "Modification moyenne", value: `${summary.avgModifier >= 0 ? "+" : ""}${summary.avgModifier}%`, icon: Percent, color: "text-orange-600 dark:text-orange-400" },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="flex items-center gap-4 rounded-2xl border border-amber-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                        <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Product pricing table */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <div className="border-b border-amber-200/40 px-6 py-4 dark:border-amber-800/30">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                    <DollarSign className="h-5 w-5 text-orange-500" /> Grille tarifaire
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-amber-200/40 dark:border-amber-800/30">
                        {["Produit", "Categorie", "Prix original", "Prix suggere", "Variation", "Raisons", "Auto"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/70">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100/60 dark:divide-amber-800/20">
                      {data.pricing.map((item) => {
                        const diff = item.suggestedPrice - item.originalPrice
                        const isUp = diff > 0
                        const isDown = diff < 0
                        return (
                          <tr key={item.id} className="transition hover:bg-amber-50/40 dark:hover:bg-amber-900/20">
                            <td className="px-4 py-3 font-medium text-amber-950 dark:text-amber-100">{item.name}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-amber-700 dark:text-amber-400">{item.originalPrice.toFixed(2)} €</td>
                            <td className={`px-4 py-3 font-semibold ${isDown ? "text-emerald-600 dark:text-emerald-400" : isUp ? "text-red-600 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                              {item.suggestedPrice.toFixed(2)} €
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                isUp ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : isDown ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}>
                                {isUp && <TrendingUp className="h-3 w-3" />}
                                {isDown && <TrendingDown className="h-3 w-3" />}
                                {!isUp && !isDown && <Minus className="h-3 w-3" />}
                                {item.discountPercent >= 0 ? "+" : ""}{item.discountPercent}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {item.reasons.map((r) => (
                                  <span key={r} className="rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => setAutoToggles((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                  autoToggles[item.id] ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"
                                }`}
                              >
                                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${autoToggles[item.id] ? "translate-x-5" : "translate-x-0"}`} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Revenue impact simulation */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <Zap className="h-5 w-5 text-orange-500" /> Impact revenus estime
                </h2>
                <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-6 dark:from-amber-950/40 dark:to-orange-950/30">
                  <p className="text-sm text-amber-700/80 dark:text-amber-400/70">
                    Variation journaliere estimee (basee sur ~15 ventes/produit)
                  </p>
                  <p className={`mt-1 text-3xl font-bold ${estimatedDailyImpact >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {estimatedDailyImpact >= 0 ? "+" : ""}{estimatedDailyImpact.toFixed(2)} €
                  </p>
                  <p className="mt-1 text-xs text-amber-600/60 dark:text-amber-500/50">
                    Projection mensuelle: {estimatedDailyImpact >= 0 ? "+" : ""}{(estimatedDailyImpact * 30).toFixed(2)} €
                  </p>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-amber-200/50 dark:bg-amber-800/30">
                    <div
                      className={`h-full rounded-full transition-all ${estimatedDailyImpact >= 0 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-red-400 to-red-500"}`}
                      style={{ width: `${Math.min(Math.abs(estimatedDailyImpact) / 50 * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </section>

              {/* History */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <History className="h-5 w-5 text-orange-500" /> Historique recent
                </h2>
                <div className="space-y-3">
                  {MOCK_HISTORY.map((h) => {
                    const isUp = h.to > h.from
                    return (
                      <div key={h.id} className="flex items-center justify-between rounded-xl border border-amber-100/60 bg-amber-50/30 px-4 py-3 dark:border-amber-800/20 dark:bg-amber-950/20">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isUp ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                            {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-amber-950 dark:text-amber-100">{h.product}</p>
                            <p className="text-xs text-amber-600/70 dark:text-amber-400/60">{h.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                            {h.from.toFixed(2)} € → {h.to.toFixed(2)} €
                          </p>
                          <p className="text-xs text-amber-600/60 dark:text-amber-500/50">{h.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Algorithm info */}
              <div className="text-center text-xs text-amber-600/50 dark:text-amber-500/40">
                Algorithme: {data.algorithm}
              </div>
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
