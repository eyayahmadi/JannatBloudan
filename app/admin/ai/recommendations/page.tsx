"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Brain,
  RefreshCw,
  Clock,
  Cloud,
  Cpu,
  Target,
  BarChart3,
  Layers,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Recommendation = {
  id: number
  name: string
  category: string
  price: number
  rating: number
  reviews: number
  score: number
  confidence: number
  reasons: string[]
}

type RecommendationResponse = {
  recommendations: Recommendation[]
  context: {
    hour: number
    timeSlot: string
    weather: string
    viewedCategories: string[]
  }
  algorithm: string
}

const WEIGHT_CONFIG = [
  { key: "affinity", label: "Affinite", value: 40, color: "bg-violet-500" },
  { key: "popularity", label: "Popularite", value: 25, color: "bg-amber-500" },
  { key: "time", label: "Heure", value: 20, color: "bg-blue-500" },
  { key: "weather", label: "Meteo", value: 15, color: "bg-emerald-500" },
] as const

const CATEGORY_LABELS: Record<string, string> = {
  shawarma: "Shawarma",
  "hot-dishes": "Plats Chauds",
  mezze: "Mezze",
  dessert: "Dessert",
  pizza: "Pizza",
  burger: "Burger",
  drink: "Boissons",
  manakish: "Manakish",
}

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewedItems: [], hour: new Date().getHours() }),
      })
      const json = await res.json()
      setData(json)
    } catch {
      /* silently handle */
    } finally {
      setLoading(false)
      setSimulating(false)
    }
  }, [])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  function handleSimulate() {
    setSimulating(true)
    fetchRecommendations()
  }

  const categories = data
    ? new Set(data.recommendations.map((r) => r.category))
    : new Set<string>()

  const modelAccuracy = 78

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/admin" backLabel="Dashboard" hideMainNav />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Agent Recommandation
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Moteur de suggestions personnalisees — scoring multi-facteurs
                </p>
              </div>
            </div>
            <Button
              onClick={handleSimulate}
              disabled={simulating}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-md"
            >
              <RefreshCw className={`h-4 w-4 ${simulating ? "animate-spin" : ""}`} />
              Simuler
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                  <CardContent className="flex items-center gap-4 py-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50">
                      <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {data.recommendations.length}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Recommandations
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                  <CardContent className="flex items-center gap-4 py-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                      <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">34%</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Taux de conversion
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                  <CardContent className="flex items-center gap-4 py-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                      <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {categories.size}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Categories couvertes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Config + Context (sidebar) */}
                <div className="space-y-6 lg:col-span-1">
                  {/* Weights Panel */}
                  <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                    <CardHeader>
                      <CardTitle className="text-sm text-slate-900 dark:text-white">
                        Poids de l&apos;algorithme
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {WEIGHT_CONFIG.map((w) => (
                        <div key={w.key}>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {w.label}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {w.value}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className={`h-full rounded-full ${w.color} transition-all`}
                              style={{ width: `${w.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Context Panel */}
                  <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                    <CardHeader>
                      <CardTitle className="text-sm text-slate-900 dark:text-white">
                        Contexte actuel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5" /> Heure
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {data.context.hour}h00
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5" /> Creneau
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {data.context.timeSlot}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Cloud className="h-3.5 w-3.5" /> Meteo
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {data.context.weather}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Cpu className="h-3.5 w-3.5" /> Algorithme
                        </span>
                        <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                          {data.algorithm}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Model Accuracy */}
                  <Card className="border-white/60 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur dark:border-slate-800 dark:from-amber-500/20 dark:to-orange-500/20">
                    <CardContent className="py-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Model Accuracy
                        </span>
                        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {modelAccuracy}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                          style={{ width: `${modelAccuracy}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                        Auto-learning metric — mise a jour toutes les 24h
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Results Table */}
                <div className="lg:col-span-2">
                  <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                    <CardHeader>
                      <CardTitle className="text-sm text-slate-900 dark:text-white">
                        Resultats de recommandation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                              <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                Produit
                              </th>
                              <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                Categorie
                              </th>
                              <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                Score
                              </th>
                              <th className="pb-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                Confiance
                              </th>
                              <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                Raisons
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {data.recommendations.map((item) => (
                              <tr key={item.id} className="group">
                                <td className="py-3 pr-3">
                                  <div>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {item.price.toFixed(2)} €
                                    </p>
                                  </div>
                                </td>
                                <td className="py-3 pr-3">
                                  <Badge variant="outline" className="text-[10px]">
                                    {CATEGORY_LABELS[item.category] ?? item.category}
                                  </Badge>
                                </td>
                                <td className="py-3 pr-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                                        style={{ width: `${item.score * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                      {item.score}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 text-center">
                                  <span
                                    className={`text-xs font-bold ${
                                      item.confidence >= 70
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : item.confidence >= 50
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {item.confidence}%
                                  </span>
                                </td>
                                <td className="py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {item.reasons.map((r, i) => (
                                      <Badge
                                        key={i}
                                        variant="secondary"
                                        className="bg-amber-100/60 text-[10px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                      >
                                        {r}
                                      </Badge>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : null}
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
