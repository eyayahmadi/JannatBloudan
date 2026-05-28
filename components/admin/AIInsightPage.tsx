"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { RefreshCw, type LucideIcon } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { TechnicalPayloadCollapsible } from "@/components/admin/ai/TechnicalPayloadCollapsible"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Button } from "@/components/ui/button"

export type AIInsightDashboardContext = {
  data: unknown
  loading: boolean
  error: string | null
  refresh: () => void
}

type AIInsightPageProps = {
  title: string
  subtitle?: string
  endpoint: string
  icon: LucideIcon
  /** Tableau de bord principal — jamais du JSON brut */
  dashboard: (ctx: AIInsightDashboardContext) => ReactNode
  /** Bloc optionnel sous l’en-tête (filtres, formulaires) */
  children?: ReactNode
}

function extractError(data: unknown): string | null {
  if (!data || typeof data !== "object") return null
  const e = (data as Record<string, unknown>).error
  return typeof e === "string" ? e : null
}

export function AIInsightPage({ title, subtitle, endpoint, icon: Icon, dashboard, children }: AIInsightPageProps) {
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(endpoint)
      const json = await res.json().catch(() => ({}))
      if (!res.ok && !Object.keys(json).length) {
        setData({ error: `Erreur ${res.status}` })
        return
      }
      setData(json)
    } catch {
      setData({ error: "Erreur reseau" })
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    void load()
  }, [load])

  const error = useMemo(() => extractError(data), [data])

  const ctx: AIInsightDashboardContext = useMemo(
    () => ({
      data,
      loading,
      error,
      refresh: load,
    }),
    [data, loading, error, load],
  )

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-gradient-to-b from-stone-50 via-white to-amber-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <SiteHeader backHref="/admin/ai" backLabel="Centre AI" hideMainNav />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
                {subtitle ? <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p> : null}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
              className="shrink-0 border-stone-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/90"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>

          {children}

          {dashboard(ctx)}

          <TechnicalPayloadCollapsible data={data} loading={loading} />
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
