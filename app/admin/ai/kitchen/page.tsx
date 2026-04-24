"use client"

import { useState, useEffect } from "react"
import {
  ChefHat,
  Timer,
  Zap,
  TrendingDown,
  Percent,
  ArrowRight,
  CheckCircle2,
  Layers,
  BarChart3,
} from "lucide-react"
import { toast } from "sonner"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

type OrderItem = {
  name: string
  category: string
  prepTime: number
  quantity: number
}

type Batch = {
  category: string
  count: number
  totalItems: number
}

type KitchenData = {
  originalQueue: OrderItem[]
  optimizedQueue: OrderItem[]
  batches: Batch[]
  metrics: {
    fifoEstimate: number
    optimizedEstimate: number
    timeSaved: number
    savingsPercent: number
  }
  algorithm: string
}

const CATEGORY_COLORS: Record<string, string> = {
  drink: "bg-sky-100 text-sky-700 ring-sky-300 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-700",
  dessert: "bg-pink-100 text-pink-700 ring-pink-300 dark:bg-pink-900/30 dark:text-pink-400 dark:ring-pink-700",
  mezze: "bg-emerald-100 text-emerald-700 ring-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700",
  manakish: "bg-amber-100 text-amber-700 ring-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-700",
  shawarma: "bg-orange-100 text-orange-700 ring-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-700",
  burger: "bg-red-100 text-red-700 ring-red-300 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-700",
  pizza: "bg-violet-100 text-violet-700 ring-violet-300 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-700",
  "hot-dishes": "bg-rose-100 text-rose-700 ring-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-700",
}

const BATCH_BG: Record<string, string> = {
  drink: "from-sky-500/10 to-sky-600/5 border-sky-300/50 dark:from-sky-500/10 dark:to-sky-600/5 dark:border-sky-700/40",
  dessert: "from-pink-500/10 to-pink-600/5 border-pink-300/50 dark:from-pink-500/10 dark:to-pink-600/5 dark:border-pink-700/40",
  mezze: "from-emerald-500/10 to-emerald-600/5 border-emerald-300/50 dark:from-emerald-500/10 dark:to-emerald-600/5 dark:border-emerald-700/40",
  manakish: "from-amber-500/10 to-amber-600/5 border-amber-300/50 dark:from-amber-500/10 dark:to-amber-600/5 dark:border-amber-700/40",
  shawarma: "from-orange-500/10 to-orange-600/5 border-orange-300/50 dark:from-orange-500/10 dark:to-orange-600/5 dark:border-orange-700/40",
  burger: "from-red-500/10 to-red-600/5 border-red-300/50 dark:from-red-500/10 dark:to-red-600/5 dark:border-red-700/40",
  pizza: "from-violet-500/10 to-violet-600/5 border-violet-300/50 dark:from-violet-500/10 dark:to-violet-600/5 dark:border-violet-700/40",
  "hot-dishes": "from-rose-500/10 to-rose-600/5 border-rose-300/50 dark:from-rose-500/10 dark:to-rose-600/5 dark:border-rose-700/40",
}

const PREP_TIMES: Record<string, number> = {
  shawarma: 12, manakish: 10, "hot-dishes": 18, mezze: 5, pizza: 18, burger: 14, dessert: 5, drink: 3,
}

const MOCK_PREP_TREND = [
  { day: "Lun", avg: 28 },
  { day: "Mar", avg: 32 },
  { day: "Mer", avg: 25 },
  { day: "Jeu", avg: 30 },
  { day: "Ven", avg: 35 },
  { day: "Sam", avg: 22 },
  { day: "Dim", avg: 26 },
]

function categoryBadge(cat: string) {
  return CATEGORY_COLORS[cat] || "bg-gray-100 text-gray-700 ring-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-600"
}

function ItemCard({ item, index }: { item: OrderItem; index: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-100/60 bg-white/60 px-4 py-3 dark:border-amber-800/20 dark:bg-amber-950/20">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-amber-950 dark:text-amber-100">{item.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${categoryBadge(item.category)}`}>
            {item.category}
          </span>
          <span className="text-[11px] text-amber-600/70 dark:text-amber-400/50">
            {item.prepTime} min
          </span>
          <span className="text-[11px] text-amber-600/70 dark:text-amber-400/50">
            x{item.quantity}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function KitchenOptimizationPage() {
  const [data, setData] = useState<KitchenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    fetch("/api/ai/kitchen")
      .then((r) => r.json())
      .then((d: KitchenData) => setData(d))
      .catch(() => toast.error("Erreur chargement optimisation cuisine"))
      .finally(() => setLoading(false))
  }, [])

  const handleApply = () => {
    setApplied(true)
    toast.success("Ordre optimise applique a la cuisine !")
  }

  const maxTrend = Math.max(...MOCK_PREP_TREND.map((t) => t.avg))

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin/ai" />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-100 sm:text-3xl">
            Optimisation Cuisine IA
          </h1>
          <p className="mt-1 text-sm text-amber-800/70 dark:text-amber-300/70">
            Reorganisation intelligente de la file de preparation
          </p>

          {loading ? (
            <div className="mt-12 text-center text-amber-700 dark:text-amber-400">Chargement...</div>
          ) : data ? (
            <div className="mt-8 space-y-10">
              {/* Metrics row */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Temps FIFO", value: `${data.metrics.fifoEstimate} min`, icon: Timer, color: "text-amber-600 dark:text-amber-400" },
                  { label: "Temps optimise", value: `${data.metrics.optimizedEstimate} min`, icon: Zap, color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Temps economise", value: `${data.metrics.timeSaved} min`, icon: TrendingDown, color: "text-orange-600 dark:text-orange-400" },
                  { label: "Gain en %", value: `${data.metrics.savingsPercent}%`, icon: Percent, color: "text-green-600 dark:text-green-400" },
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

              {/* Side-by-side comparison */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* FIFO order */}
                <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                    <Layers className="h-5 w-5 text-amber-500" /> Ordre actuel (FIFO)
                  </h2>
                  <div className="space-y-2">
                    {data.originalQueue.map((item, i) => (
                      <ItemCard key={`fifo-${i}`} item={item} index={i} />
                    ))}
                  </div>
                  <div className="mt-4 rounded-lg bg-amber-50/60 px-4 py-2 text-center text-sm font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    Temps total: {data.metrics.fifoEstimate} min
                  </div>
                </section>

                {/* Optimized order */}
                <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                    <Zap className="h-5 w-5 text-emerald-500" /> Ordre optimise
                  </h2>
                  <div className="space-y-2">
                    {data.optimizedQueue.map((item, i) => (
                      <ItemCard key={`opt-${i}`} item={item} index={i} />
                    ))}
                  </div>
                  <div className="mt-4 rounded-lg bg-emerald-50/60 px-4 py-2 text-center text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Temps total: {data.metrics.optimizedEstimate} min
                    <span className="ml-2 text-xs font-normal">
                      (-{data.metrics.timeSaved} min)
                    </span>
                  </div>
                </section>
              </div>

              {/* Batch visualization */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <ChefHat className="h-5 w-5 text-orange-500" /> Visualisation des lots
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.batches.map((batch, i) => {
                    const catTime = PREP_TIMES[batch.category] || 10
                    const estTime = catTime * Math.ceil(batch.totalItems / 3)
                    return (
                      <div
                        key={batch.category}
                        className={`rounded-xl border bg-gradient-to-br p-4 ${BATCH_BG[batch.category] || "from-gray-500/10 to-gray-600/5 border-gray-300/50 dark:from-gray-500/10 dark:to-gray-600/5 dark:border-gray-700/40"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${categoryBadge(batch.category)}`}>
                            {batch.category}
                          </span>
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                            Lot {i + 1}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-amber-950 dark:text-amber-100">{batch.count}</p>
                            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/50">articles</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-amber-950 dark:text-amber-100">{batch.totalItems}</p>
                            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/50">portions</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-amber-950 dark:text-amber-100">~{estTime}</p>
                            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/50">min</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Apply button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applied}
                  className={`inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold shadow-lg transition ${
                    applied
                      ? "cursor-not-allowed bg-emerald-500 text-white"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-xl"
                  }`}
                >
                  {applied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Applique avec succes
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" /> Appliquer a la cuisine
                    </>
                  )}
                </button>
              </div>

              {/* Average preparation time trend */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <BarChart3 className="h-5 w-5 text-orange-500" /> Temps de preparation moyen (7 jours)
                </h2>
                <div className="flex items-end gap-3">
                  {MOCK_PREP_TREND.map((t) => {
                    const barH = maxTrend > 0 ? (t.avg / maxTrend) * 160 : 0
                    return (
                      <div key={t.day} className="flex flex-1 flex-col items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{t.avg}</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-orange-500 to-amber-400 transition-all"
                          style={{ height: `${barH}px`, minHeight: "4px" }}
                        />
                        <span className="text-[11px] font-medium text-amber-700/70 dark:text-amber-400/60">{t.day}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-3 text-center text-xs text-amber-600/50 dark:text-amber-500/40">
                  Temps moyen en minutes par commande
                </p>
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
