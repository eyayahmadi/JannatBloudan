"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { RefreshCw, type LucideIcon } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AIInsightPageProps = {
  title: string
  subtitle?: string
  endpoint: string
  icon: LucideIcon
  children?: ReactNode
}

export function AIInsightPage({ title, subtitle, endpoint, icon: Icon, children }: AIInsightPageProps) {
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(endpoint)
      const json = await res.json()
      setData(json)
    } catch {
      setData({ error: "Erreur reseau" })
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    load()
  }, [load])

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/admin/ai" backLabel="Centre AI" hideMainNav />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
                {subtitle ? <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Rafraichir
            </Button>
          </div>

          {children}

          <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-white">Payload API</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[480px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-emerald-300">
                {loading ? "Chargement..." : JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
