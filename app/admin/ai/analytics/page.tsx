"use client"

import { useEffect, useState } from "react"
import { BarChart3, TrendingUp, TrendingDown, FileText, Lightbulb } from "lucide-react"
import { toast } from "sonner"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Kpi = {
  id: string
  label: string
  value: number
  unit: string
  changePct: number
}

type TopProduct = {
  name: string
  category: string
  sold: number
  revenue: number
  marginPct: number
}

type AnalyticsPayload = {
  kpis: Kpi[]
  topProducts: TopProduct[]
  narrative: string
  insights: { type: string; text: string }[]
  algorithm: string
  generatedAt: string
}

export default function AnalyticsAgentPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ai/analytics")
      .then((r) => r.json())
      .then((d: AnalyticsPayload) => setData(d))
      .catch(() => toast.error("Erreur chargement Analytics"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin/ai" />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-100 sm:text-3xl">
                Agent Analytics &amp; BI
              </h1>
              <p className="text-sm text-amber-800/70 dark:text-amber-300/70">
                KPIs, classements et resume automatique (style NLG)
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-12 text-center text-amber-700 dark:text-amber-400">Chargement...</div>
          ) : data ? (
            <div className="mt-8 space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.kpis.map((k) => (
                  <Card key={k.id} className="border-amber-200/50 bg-white/80 backdrop-blur dark:border-amber-900/40 dark:bg-amber-950/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">{k.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {k.unit === "EUR"
                          ? `${k.value.toLocaleString("fr-FR")} €`
                          : k.unit === "%"
                            ? `${k.value} %`
                            : k.value.toLocaleString("fr-FR")}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-xs font-medium">
                        {k.changePct >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                        )}
                        <span className={k.changePct >= 0 ? "text-emerald-600" : "text-red-600"}>
                          {k.changePct >= 0 ? "+" : ""}
                          {k.changePct}% vs periode precedente
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-indigo-200/60 bg-gradient-to-br from-indigo-50/90 to-sky-50/80 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-slate-900/80">
                <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base text-indigo-950 dark:text-indigo-100">Rapport automatique (NLG)</CardTitle>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {data.algorithm}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-indigo-950/90 dark:text-indigo-100/90">{data.narrative}</p>
                  <p className="mt-3 text-xs text-indigo-800/60 dark:text-indigo-300/60">
                    Genere: {new Date(data.generatedAt).toLocaleString("fr-FR")}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-amber-200/50 dark:border-amber-900/40">
                  <CardHeader>
                    <CardTitle className="text-base">Top produits (CA)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.topProducts.map((p, i) => (
                      <div key={p.name} className="flex items-center justify-between gap-3 border-b border-amber-100/80 pb-2 last:border-0 dark:border-amber-900/30">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {i + 1}. {p.name}
                          </p>
                          <p className="text-xs text-slate-500">{p.category}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{p.revenue.toFixed(0)} €</p>
                          <p className="text-slate-500">{p.sold} ventes · marge {p.marginPct}%</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-amber-200/50 dark:border-amber-900/40">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-base">Insights actionnables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.insights.map((ins, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-3 text-sm text-amber-950 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-100"
                      >
                        {ins.text}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
