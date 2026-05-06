"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles, ArrowLeft, Lightbulb, BarChart3 } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type Payload = {
  ok?: boolean
  disabled?: boolean
  period_days?: number
  kpis?: { orders_in_period?: number; revenue_sum_approx?: number; avg_basket_approx?: number }
  weekday_stats?: Array<{ label: string; share_pct: number; revenue: number }>
  top_products?: Array<{ name: string; qty: number; revenue: number }>
  insights?: Array<{ id: string; severity: string; title: string; detail: string }>
  copilot_suggestions?: string[]
  meta?: { unresolved_caisse_alerts_week?: number }
}

export default function AdminInsightsPage() {
  const [data, setData] = useState<Payload | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    void fetch("/api/admin/ops-insights")
      .then((r) => r.json())
      .then((j: Payload) => {
        if (!j.ok && !j.disabled) setErr("Chargement incomplet")
        setData(j)
      })
      .catch(() => setErr("Erreur réseau"))
  }, [])

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell className="min-h-screen bg-[color:var(--lux-cream)] dark:bg-neutral-950">
        <SiteHeader
          hideMainNav
          backHref="/admin"
          backLabel="Admin"
          trailing={null}
        />
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Retour tableau de bord
            </Link>
            <h1 className="font-display text-3xl font-semibold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-amber-600" />
              Insights opérationnels
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Règles + statistiques sur les{" "}
              <strong>{data?.period_days ?? "—"}</strong> derniers jours — sans LLM obligatoire.
            </p>
          </div>

          {data?.disabled ? (
            <Card className="border-amber-200 bg-amber-50/60">
              <CardContent className="py-4 text-sm">Connectez Supabase pour activer les agrégats.</CardContent>
            </Card>
          ) : null}

          {err ? <p className="text-sm text-rose-600">{err}</p> : null}

          {data?.kpis ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Commandes</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{data.kpis.orders_in_period ?? "—"}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">CA (somme totaux)</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {data.kpis.revenue_sum_approx != null ? `${data.kpis.revenue_sum_approx.toFixed(2)} €` : "—"}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Panier moyen (approx.)</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {data.kpis.avg_basket_approx != null ? `${data.kpis.avg_basket_approx.toFixed(2)} €` : "—"}
                </CardContent>
              </Card>
            </div>
          ) : null}

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[color:var(--lux-gold-deep)]" />
              <CardTitle className="text-lg">Insights</CardTitle>
              {data?.meta?.unresolved_caisse_alerts_week ? (
                <Badge variant="destructive">Alertes caisse : {data.meta.unresolved_caisse_alerts_week}</Badge>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(data?.insights ?? []).length === 0 ? (
                <p className="text-muted-foreground">Pas encore d’insight (données insuffisantes).</p>
              ) : (
                <ul className="space-y-2">
                  {(data?.insights ?? []).map((i) => (
                    <li key={i.id} className="rounded-lg border border-neutral-200/80 p-3 dark:border-neutral-800">
                      <span className="font-medium">{i.title}</span>
                      <span className="ml-2 text-xs uppercase text-muted-foreground">{i.severity}</span>
                      <p className="mt-1 text-muted-foreground">{i.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle className="text-lg">Top produits (période)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {(data?.top_products ?? []).map((p) => (
                  <li key={p.name} className="flex justify-between py-2">
                    <span>{p.name}</span>
                    <span className="text-muted-foreground">
                      {p.qty} u. · {p.revenue.toFixed(2)} €
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" /> Suggestions (copilot léger)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {(data?.copilot_suggestions ?? []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Spécification complète : fichier <code className="rounded bg-muted px-1">docs/SMART_GESTION_SPEC.md</code> dans le dépôt.
          </p>
        </div>
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
