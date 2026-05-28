"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import type { AIInsightDashboardContext } from "@/components/admin/AIInsightPage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  Cpu,
  FlaskConical,
  Gauge,
  GitBranch,
  Lightbulb,
  LineChart,
  Sparkles,
  Target,
  Timer,
  ToggleLeft,
  TrendingDown,
  TrendingUp,
  Zap,
  CheckCircle2,
  XCircle,
  CircleDot,
} from "lucide-react"
import { cn } from "@/lib/utils"

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-red-200 bg-red-50/90 dark:border-red-900 dark:bg-red-950/40">
      <CardHeader>
        <CardTitle className="text-red-900 dark:text-red-100">Erreur de chargement</CardTitle>
        <CardDescription className="text-red-800/90">{message}</CardDescription>
      </CardHeader>
    </Card>
  )
}

/** ---- Auto decisions ---- */
export function AutoDecisionsDashboard({ data, loading, error }: AIInsightDashboardContext) {
  const [mode, setMode] = useState<"auto" | "manual">("auto")

  const p = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  const decisions = Array.isArray(p.decisions) ? p.decisions : []
  const governance = p.governance && typeof p.governance === "object" ? (p.governance as Record<string, unknown>) : {}
  const notifications = Array.isArray(p.notifications) ? p.notifications : []
  const generatedAt = typeof p.generatedAt === "string" ? p.generatedAt : null

  if (loading && !decisions.length) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl lg:col-span-3" />
      </div>
    )
  }

  if (error) return <ErrorCard message={error} />

  const riskTone = (r: string) => {
    if (r === "high") return "border-rose-200 bg-rose-50/60 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30"
    if (r === "medium") return "border-amber-200 bg-amber-50/60 text-amber-950 dark:border-amber-900 dark:bg-amber-950/25"
    return "border-emerald-200 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20"
  }

  const prioLabel = (x: string) =>
    ({ high: "Priorité haute", medium: "Priorité moyenne", low: "Priorité basse" }[x] ?? x)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white/95 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Mode décision</span>
          <div className="flex rounded-xl border border-stone-200 p-1 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMode("auto")}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-semibold transition",
                mode === "auto"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow"
                  : "text-slate-600 hover:bg-stone-50 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
            >
              Automatique
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-semibold transition",
                mode === "manual"
                  ? "bg-slate-900 text-white shadow dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-stone-50 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
            >
              Manuel
            </button>
          </div>
          <Badge variant="outline" className="font-normal">
            Validation au-delà de {String(governance.humanApprovalRequiredAboveEUR ?? 500)}&nbsp;€
          </Badge>
          <Badge className="bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-100">
            Audit&nbsp;: {String(governance.auditLog ?? "activé")}
          </Badge>
        </div>
        {generatedAt ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Synthèse&nbsp;: {new Date(generatedAt).toLocaleString("fr-FR")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {decisions.map((raw, idx) => {
          const d = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
          const id = String(d.id ?? idx)
          const title = String(d.title ?? "Décision")
          const dtype = String(d.type ?? "")
          const active = Boolean(d.active)
          const auto = Boolean(d.auto)
          const reason = String(d.reason ?? "")
          const priority = String(d.priority ?? "medium")
          const risk = String(d.risk ?? "low")
          const confidence = typeof d.confidence === "number" ? d.confidence : 0
          const impact = typeof d.impactEUR === "number" ? d.impactEUR : 0
          const approval = Boolean(d.humanApprovalRequired)

          return (
            <Card
              key={id}
              className={cn(
                "border-stone-200/90 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90",
                !active && "opacity-85",
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="mb-2 font-mono uppercase">
                      {dtype}
                    </Badge>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">{title}</CardTitle>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {active ? (
                      <Badge className="bg-emerald-600 text-white">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">En veille</Badge>
                    )}
                    {auto && mode === "auto" ? (
                      <Badge className="bg-sky-600 text-white">IA auto</Badge>
                    ) : null}
                    {approval ? (
                      <Badge className="border border-amber-400 bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                        Validation humaine
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-400">{reason}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", riskTone(risk))}>
                    Risque {risk}
                  </span>
                  <Badge variant="secondary">{prioLabel(priority)}</Badge>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Confiance modèle</span>
                    <span>{Math.round(confidence * 100)}%</span>
                  </div>
                  <Progress value={Math.round(confidence * 100)} className="h-2 bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 dark:bg-slate-950/60">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Impact estimé</span>
                  <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{impact}&nbsp;€</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => toast.success(`Décision « ${title} » approuvée (démo)`)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-200 text-rose-800 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200"
                    onClick={() => toast.message(`Décision « ${title} » rejetée (démo)`)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeter
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-stone-200 bg-white dark:border-slate-800 dark:bg-slate-900/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-amber-600" />
              Centre de notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune alerte temps réel.</p>
            ) : (
              notifications.map((raw, i) => {
                const n = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
                const level = String(n.level ?? "info")
                return (
                  <div
                    key={String(n.id ?? i)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm",
                      level === "warning" && "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
                      level === "success" && "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/25",
                      level === "info" && "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40",
                    )}
                  >
                    {String(n.text ?? "")}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white dark:border-slate-800 dark:bg-slate-900/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-5 w-5 text-sky-600" />
              Fil des décisions
            </CardTitle>
            <CardDescription>Timeline opérationnelle (démonstration).</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-0 border-l border-sky-200 pl-6 dark:border-sky-800">
              {[...decisions].slice(0, 5).map((raw, idx) => {
                const d = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
                const title = String(d.title ?? "?")
                const active = Boolean(d.active)
                return (
                  <li key={idx} className="relative mb-6 last:mb-0">
                    <span className="absolute -left-[7px] top-1.5 flex h-3 w-3 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-900" />
                    <p className="font-mono text-[10px] uppercase tracking-wider text-sky-700 dark:text-sky-400">
                      T —{30 - idx * 7} min
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
                    <p className="text-xs text-slate-500">{active ? "En application" : "Suspendu"}</p>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-500">
        Mode&nbsp;:{" "}
        <strong>{mode === "auto" ? "pilote automatique (règles + IA)" : "revue humaine systématique"}</strong> — données
        de démo.
      </p>
    </div>
  )
}

/** ---- Menu engineering ---- */
const QUAD_TOP: Record<string, string> = {
  star: "from-amber-400 to-orange-600",
  cash_cow: "from-emerald-500 to-teal-700",
  puzzle: "from-violet-500 to-indigo-700",
  dog: "from-slate-500 to-slate-800",
}

const QUAD_STYLE: Record<string, string> = {
  star: "from-amber-400/90 to-orange-600 shadow-amber-500/25",
  cash_cow: "from-emerald-500 to-teal-700 shadow-emerald-500/20",
  puzzle: "from-violet-500 to-indigo-700 shadow-violet-500/25",
  dog: "from-slate-500 to-slate-800",
}

export function MenuEngineeringDashboard({ data, loading, error }: AIInsightDashboardContext) {
  const p = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  const matrix = Array.isArray(p.matrix) ? p.matrix : []
  const legend = p.legend && typeof p.legend === "object" ? (p.legend as Record<string, string>) : {}
  const kpis = p.kpis && typeof p.kpis === "object" ? (p.kpis as Record<string, unknown>) : {}
  const charts = p.charts && typeof p.charts === "object" ? (p.charts as Record<string, unknown>) : {}

  const topProfitable = Array.isArray(charts.topProfitable) ? charts.topProfitable : []
  const topOrdered = Array.isArray(charts.topOrdered) ? charts.topOrdered : []
  const lowPerformers = Array.isArray(charts.lowPerformers) ? charts.lowPerformers : []

  if (loading && !matrix.length) {
    return <Skeleton className="h-[480px] w-full rounded-2xl" />
  }
  if (error) return <ErrorCard message={error} />

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white dark:border-amber-900/40 dark:from-amber-950/30 dark:to-slate-900">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-amber-800/80 dark:text-amber-200/80">Marge pondérée</p>
            <p className="text-3xl font-bold text-amber-950 dark:text-amber-100">
              {String(kpis.avgWeightedMarginPercent ?? "—")}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Étoiles</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{String(kpis.starsCount ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">À réviser</p>
            <p className="text-3xl font-bold text-rose-700 dark:text-rose-400">{String(kpis.dogsCount ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-stone-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-violet-600" />
              Matrice popularité × marge
            </CardTitle>
            <CardDescription>Positionnement relatif des plats (démo).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto aspect-[5/4] max-h-[340px] w-full rounded-2xl border border-dashed border-stone-200 bg-gradient-to-br from-stone-50 to-white dark:border-slate-700 dark:from-slate-950 dark:to-slate-900">
              <span className="absolute left-2 top-2 text-[10px] font-medium uppercase text-slate-400">Marge ↑</span>
              <span className="absolute bottom-2 right-2 text-[10px] font-medium uppercase text-slate-400">
                Popularité →
              </span>
              <div className="absolute left-1/2 top-0 h-full w-px bg-stone-200 dark:bg-slate-700" />
              <div className="absolute left-0 top-1/2 h-px w-full bg-stone-200 dark:bg-slate-700" />
              {matrix.map((raw, idx) => {
                const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
                const pop = typeof r.popularity === "number" ? r.popularity : 50
                const marg = typeof r.margin === "number" ? r.margin : 50
                const quad = String(r.quad ?? "dog")
                const emoji = String(r.emoji ?? "🍽️")
                const name = String(r.name ?? idx)
                return (
                  <motion.div
                    key={String(r.id ?? idx)}
                    layout
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl text-lg shadow-lg",
                      "bg-gradient-to-br text-white",
                      QUAD_STYLE[quad] ?? QUAD_STYLE.dog,
                    )}
                    style={{
                      left: `${pop}%`,
                      bottom: `${marg}%`,
                    }}
                    title={name}
                  >
                    <span aria-hidden>{emoji}</span>
                  </motion.div>
                )
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(legend).map(([k, label]) => (
                <Badge key={k} variant="outline" className="font-normal">
                  <span className="mr-1 capitalize">{k}:</span> {label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-stone-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top rentabilité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topProfitable.map((raw, idx) => {
                const x = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      {String(x.name ?? "")}
                    </span>
                    <span className="font-semibold tabular-nums">{String(x.margin ?? "")}%</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
          <Card className="border-stone-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top commandés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topOrdered.map((raw, idx) => {
                const x = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-sky-600" />
                      {String(x.name ?? "")}
                    </span>
                    <span className="font-semibold tabular-nums">{String(x.popularity ?? "")}%</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
          <Card className="border-rose-100 dark:border-rose-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-rose-800 dark:text-rose-200">
                <TrendingDown className="h-4 w-4" />
                Sous-performeurs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {lowPerformers.length === 0 ? (
                <p className="text-slate-500">Aucun signal critique.</p>
              ) : (
                lowPerformers.map((raw, idx) => {
                  const x = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
                  return <p key={idx}>• {String(x.name ?? "")}</p>
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matrix.map((raw, idx) => {
          const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
          const quad = String(r.quad ?? "dog")
          return (
            <Card key={String(r.id ?? idx)} className="overflow-hidden border-stone-200 dark:border-slate-800">
              <div className={cn("h-2 bg-gradient-to-r", QUAD_TOP[quad] ?? QUAD_TOP.dog)} />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-2xl dark:bg-slate-800">
                    {String(r.emoji ?? "🍽️")}
                  </div>
                  <div>
                    <CardTitle className="text-base">{String(r.name ?? "")}</CardTitle>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {quad.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Popularité</span>
                  <span className="font-semibold">{String(r.popularity ?? "")}%</span>
                </div>
                <Progress value={Number(r.popularity ?? 0)} className="h-1.5" />
                <div className="flex justify-between">
                  <span className="text-slate-500">Marge</span>
                  <span className="font-semibold">{String(r.margin ?? "")}%</span>
                </div>
                <Progress value={Number(r.margin ?? 0)} className="h-1.5" />
                <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs leading-relaxed text-violet-950 dark:bg-violet-950/30 dark:text-violet-100">
                  <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                  {String(r.aiRecommendation ?? "")}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/** ---- Customer journey ---- */
export function CustomerJourneyDashboard({ data, loading, error }: AIInsightDashboardContext) {
  const p = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  const funnel = Array.isArray(p.funnel) ? p.funnel : []
  const insights = Array.isArray(p.insights) ? p.insights : []
  const recovery = Array.isArray(p.recoverySuggestions) ? p.recoverySuggestions : []
  const notifIdeas = Array.isArray(p.notificationIdeas) ? p.notificationIdeas : []
  const wins = Array.isArray(p.winOpportunities) ? p.winOpportunities : []
  const pain = Array.isArray(p.painPoints) ? p.painPoints : []
  const gcr = typeof p.globalConversionRate === "number" ? p.globalConversionRate : 0

  if (loading && !funnel.length) return <Skeleton className="h-96 w-full rounded-2xl" />
  if (error) return <ErrorCard message={error} />

  const maxV = funnel.length ? Math.max(...funnel.map((x) => (x as { visitors?: number }).visitors ?? 0), 1) : 1

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-violet-200 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/20">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-violet-800 dark:text-violet-200">Conversion globale</p>
            <p className="text-3xl font-bold text-violet-950 dark:text-violet-100">
              {(gcr * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Étapes suivies</p>
            <p className="text-3xl font-bold">{funnel.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Points de friction</p>
            <p className="text-3xl font-bold text-amber-700">{pain.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Idées de relance</p>
            <p className="text-3xl font-bold text-sky-700">{recovery.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-stone-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowRight className="h-5 w-5 text-sky-600" />
            Entonnoir client
          </CardTitle>
          <CardDescription>Entrée → Menu → Panier → Paiement → Confirmé</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            {funnel.map((raw, idx) => {
              const s = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
              const label = String(s.label ?? s.stage ?? idx)
              const visitors = typeof s.visitors === "number" ? s.visitors : 0
              const h = Math.max(18, Math.round((visitors / maxV) * 120))
              const conv = typeof s.conversionToNext === "number" ? s.conversionToNext : 0
              return (
                <div key={idx} className="flex flex-1 flex-col items-center gap-2" style={{ minWidth: "72px" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: h }}
                    className="w-full max-w-[100px] rounded-t-xl bg-gradient-to-t from-amber-600 to-orange-400 shadow-md"
                  />
                  <p className="text-center text-[11px] font-semibold text-slate-800 dark:text-slate-200">{label}</p>
                  <p className="text-[10px] text-slate-500">{visitors} vis.</p>
                  {idx < funnel.length - 1 ? (
                    <p className="text-[10px] font-medium text-emerald-700">{(conv * 100).toFixed(0)}% →</p>
                  ) : null}
                </div>
              )
            })}
          </div>

          {funnel.map((raw, idx) => {
            const s = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
            const drops = Array.isArray(s.dropReasons) ? s.dropReasons : []
            const label = String(s.label ?? s.stage ?? idx)
            if (!drops.length) return null
            return (
              <div key={`d-${idx}`} className="rounded-xl border border-stone-100 bg-stone-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Abandons — {label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {drops.map((d, j) => {
                    const o = d && typeof d === "object" ? (d as Record<string, unknown>) : {}
                    return (
                      <Badge key={j} variant="secondary" className="font-normal">
                        {String(o.reason ?? "")}{" "}
                        {typeof o.pct === "number" ? `(${o.pct}%)` : ""}
                      </Badge>
                    )
                  })}
                </div>
                {typeof s.mobileFriction === "number" && s.mobileFriction > 0 ? (
                  <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                    Friction mobile estimée : {String(s.mobileFriction)}%
                  </p>
                ) : null}
                {typeof s.abandonedApprox === "number" && s.abandonedApprox > 0 ? (
                  <p className="text-xs text-slate-600">
                    Paniers / sorties approx. : {String(s.abandonedApprox)}
                  </p>
                ) : null}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Recommandations IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((raw, i) => {
              const x = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
              const sev = String(x.severity ?? "medium")
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm",
                    sev === "high" && "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30",
                    sev === "medium" && "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/25",
                  )}
                >
                  {String(x.text ?? "")}
                </div>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Douleurs clients (top)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {pain.map((t, i) => (
              <div key={i} className="flex gap-2">
                <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{String(t)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-emerald-100 dark:border-emerald-900/40">
          <CardHeader>
            <CardTitle className="text-base">Récupération & conversion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {recovery.map((t, i) => (
              <p key={i} className="rounded-lg bg-emerald-50/80 px-3 py-2 dark:bg-emerald-950/25">
                {String(t)}
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Idées de notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifIdeas.map((raw, i) => {
              const n = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
              return (
                <div key={i} className="rounded-xl border border-stone-100 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <Badge className="mb-1">{String(n.channel ?? "")}</Badge>
                  <p>{String(n.text ?? "")}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leviers prioritaires</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {wins.map((t, i) => (
            <Badge key={i} variant="outline" className="text-sm font-normal">
              {String(t)}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/** ---- Realtime ops ---- */
export function RealtimeOpsDashboard({ data, loading, error }: AIInsightDashboardContext) {
  const p = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  const latency = p.latency && typeof p.latency === "object" ? (p.latency as Record<string, unknown>) : {}
  const throughput = p.throughput && typeof p.throughput === "object" ? (p.throughput as Record<string, unknown>) : {}
  const stations = Array.isArray(p.stations) ? p.stations : []
  const actions = Array.isArray(p.actions) ? p.actions : []
  const aiRec = Array.isArray(p.aiRecommendations) ? p.aiRecommendations : []
  const live = Boolean(p.live)

  if (loading && !stations.length) return <Skeleton className="h-[420px] w-full rounded-2xl" />
  if (error) return <ErrorCard message={error} />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white/95 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/90">
        {live ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
          >
            <span className="h-2 w-2 rounded-full bg-white" />
            Live
          </motion.span>
        ) : null}
        <span className="text-sm text-slate-600 dark:text-slate-400">Optimisation opérationnelle temps réel</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs uppercase text-slate-500">
              <Timer className="h-4 w-4" />
              Préparation moy.
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {String(latency.preparationAvgSec ?? latency.p50 ?? "—")} s
            </p>
            <p className="text-xs text-slate-500">File + cuisine (démo)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs uppercase text-slate-500">
              <Gauge className="h-4 w-4" />
              Charge cuisine
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {String(throughput.kitchenLoadPercent ?? "—")}%
            </p>
            <Progress value={Number(throughput.kitchenLoadPercent ?? 0)} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs uppercase text-slate-500">
              <Zap className="h-4 w-4" />
              Commandes / min
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{String(throughput.ordersPerMin ?? "—")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs uppercase text-slate-500">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Délai livraison
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {String(throughput.deliveryDelayEstimateMin ?? latency.dispatchDelayMin ?? "—")} min
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stations cuisine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stations.map((raw, idx) => {
              const s = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
              const st = String(s.status ?? "ok")
              return (
                <div key={String(s.id ?? idx)}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{String(s.label ?? "")}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        st === "saturated" && "border-red-300 text-red-800",
                        st === "watch" && "border-amber-400 text-amber-900",
                      )}
                    >
                      {st}
                    </Badge>
                  </div>
                  <Progress value={Number(s.loadPercent ?? 0)} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="border-amber-100 dark:border-amber-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="h-5 w-5 text-amber-600" />
                Recommandations IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {aiRec.map((t, i) => (
                <p key={i} className="rounded-xl bg-amber-50 px-3 py-2 dark:bg-amber-950/25">
                  {String(t)}
                </p>
              ))}
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Goulet&nbsp;:{" "}
                <strong>{String(p.bottleneck ?? "—")}</strong>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Trafic&nbsp;: {String(p.trafficPrediction ?? "—")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actions automatiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actions.map((raw, idx) => {
                const a = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2 text-sm dark:border-slate-800"
                  >
                    <span className="font-medium">{String(a.type ?? "")}</span>
                    <span className="text-slate-600">
                      {String(a.target ?? "")}: {String(a.value ?? "")}
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/** ---- Learning ---- */
export function LearningDashboard({ data, loading, error }: AIInsightDashboardContext) {
  const p = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  const online = p.onlineLearning && typeof p.onlineLearning === "object" ? (p.onlineLearning as Record<string, unknown>) : {}
  const reinforce = p.reinforcement && typeof p.reinforcement === "object" ? (p.reinforcement as Record<string, unknown>) : {}
  const abTests = Array.isArray(p.abTests) ? p.abTests : []
  const alerts = Array.isArray(p.alerts) ? p.alerts : []
  const modelHealth = typeof p.modelHealthScore === "number" ? p.modelHealthScore : 0
  const drift = typeof online.driftScore === "number" ? online.driftScore : 0
  const explore = typeof p.explorationPercent === "number" ? p.explorationPercent : (Number(reinforce.explorationRate ?? 0) * 100)
  const learnProg = typeof p.learningProgressPercent === "number" ? p.learningProgressPercent : 65

  if (loading && !p.modelVersion) return <Skeleton className="h-[500px] w-full rounded-2xl" />
  if (error) return <ErrorCard message={error} />

  return (
    <div className="space-y-6">
      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 via-white to-indigo-50 dark:border-violet-900 dark:from-violet-950/30 dark:to-slate-900">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-violet-700 dark:text-violet-300">Modèle actif</p>
            <p className="font-mono text-xl font-bold text-violet-950 dark:text-violet-100">
              {String(p.modelVersion ?? "—")}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Dernière formation&nbsp;:{" "}
              {p.lastTrainingAt ? new Date(String(p.lastTrainingAt)).toLocaleDateString("fr-FR") : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-slate-500">Santé globale</p>
            <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">{modelHealth}</p>
            <Progress value={modelHealth} className="mt-2 h-2 w-48" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Apprentissage en ligne</p>
            <Badge className="mt-2 bg-emerald-600">{String(online.status ?? "—")}</Badge>
            <p className="mt-3 text-xs text-slate-500">
              Échantillons (24h)&nbsp;: <strong>{String(online.samplesProcessedToday ?? "—")}</strong>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dérive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(drift * 100).toFixed(2)}%</p>
            <Progress value={Math.min(100, drift * 400)} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Exploration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{explore.toFixed(1)}%</p>
            <Progress value={explore * 5} className="mt-2 h-2" />
            <p className="mt-2 text-xs text-slate-500">{String(reinforce.policy ?? "")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChart className="h-5 w-5" />
            Progression apprentissage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={learnProg} className="h-3" />
          <p className="mt-2 text-xs text-slate-500">Signal de récompense : {String(reinforce.rewardSignal ?? "")}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {abTests.map((raw, idx) => {
          const a = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
          const winner = String(a.winner ?? "?")
          const lift = typeof a.upliftPercent === "number" ? a.upliftPercent : 0
          const conf = typeof a.confidencePercent === "number" ? a.confidencePercent : 0
          return (
            <Card key={idx} className="border-indigo-100 dark:border-indigo-900/40">
              <CardHeader>
                <CardTitle className="text-base">{String(a.name ?? "Test A/B")}</CardTitle>
                <CardDescription>
                  {String(a.variantA ?? "A")} vs {String(a.variantB ?? "B")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-amber-500">Variante {winner} en tête</Badge>
                  <Badge variant="outline">Uplift +{lift}%</Badge>
                  <Badge variant="outline">Confiance {conf}%</Badge>
                </div>
                <Progress value={conf} className="h-2" />
                <Badge variant={String(a.status) === "running" ? "secondary" : "outline"}>
                  {String(a.status ?? "")}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {Array.isArray(alerts) && alerts.length ? (
        <Card className="border-amber-200 bg-amber-50/90 dark:border-amber-900 dark:bg-amber-950/25">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              Alertes drift
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {(alerts as unknown[]).map((raw, i) => {
              const x = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
              return <p key={i}>{String(x.text ?? "")}</p>
            })}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={() => toast.success("Ré-entraînement planifié (démo)")}>
          Re-entraîner
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.message("Pause learning (simulation)")}>
          Pause apprentissage
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.success("Export métriques généré (démo)")}>
          Exporter métriques
        </Button>
      </div>

      <p className="text-center text-xs text-slate-500">
        Prochain ré-train suggéré&nbsp;:{" "}
        {p.nextRetrainAt ? new Date(String(p.nextRetrainAt)).toLocaleString("fr-FR") : "—"}
      </p>
    </div>
  )
}

/** ---- Upsell ---- */
export function UpsellDashboard({ data, loading, error }: AIInsightDashboardContext) {
  const p = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  const suggestions = Array.isArray(p.suggestions) ? p.suggestions : []
  const analytics = p.analytics && typeof p.analytics === "object" ? (p.analytics as Record<string, unknown>) : {}
  const hints = Array.isArray(p.adaptationHints) ? p.adaptationHints : []

  if (loading && !suggestions.length) return <Skeleton className="h-[400px] w-full rounded-2xl" />
  if (error) return <ErrorCard message={error} />

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-slate-900">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Panier moyen +</p>
            <p className="text-3xl font-bold text-rose-800 dark:text-rose-200">
              +{String(analytics.avgBasketUpliftEUR ?? "—")}&nbsp;€
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Taux acceptation</p>
            <p className="text-3xl font-bold">{String(analytics.acceptanceRatePercent ?? "—")}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Catégorie star</p>
            <p className="text-3xl font-bold capitalize">{String(analytics.bestCategory ?? "—")}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-stone-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-sky-600" />
            Contexte temps réel
          </CardTitle>
          <CardDescription>Rush / calme — suggestions adaptées.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {hints.map((t, i) => (
            <Badge key={i} variant="secondary" className="font-normal">
              {String(t)}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {suggestions.map((raw, idx) => {
          const s = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
          const conf = typeof s.confidenceScore === "number" ? s.confidenceScore : 0
          return (
            <Card key={idx} className="overflow-hidden border-stone-200 shadow-md dark:border-slate-800">
              <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-white">
                <span className="text-3xl">{String(s.emoji ?? "✨")}</span>
                <p className="mt-2 font-semibold">{String(s.title ?? "")}</p>
                <Badge className="mt-2 bg-white/20 capitalize">{String(s.type ?? "")}</Badge>
              </div>
              <CardContent className="space-y-3 pt-4 text-sm">
                <p className="italic text-slate-700 dark:text-slate-300">{String(s.pitch ?? "")}</p>
                <p className="text-xs text-violet-800 dark:text-violet-200">{String(s.reason ?? "")}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-stone-50 p-2 dark:bg-slate-950/60">
                    <p className="text-slate-500">Conversion est.</p>
                    <p className="font-bold">{String(s.estimatedConversionPercent ?? "—")}%</p>
                  </div>
                  <div className="rounded-lg bg-stone-50 p-2 dark:bg-slate-950/60">
                    <p className="text-slate-500">Rev. attendue</p>
                    <p className="font-bold">{String(s.expectedRevenueIncreaseEUR ?? "—")}&nbsp;€</p>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Confiance</span>
                    <span>{Math.round(conf * 100)}%</span>
                  </div>
                  <Progress value={Math.round(conf * 100)} className="h-2" />
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Timing</strong>&nbsp;: {String(s.bestTiming ?? "—")}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/** ---- Next gen ---- */
const STATUS_FR: Record<string, string> = {
  pilot: "Pilote",
  beta: "Bêta",
  planned: "Planifié",
  concept: "Concept",
  production: "Production",
}

const IMPACT_FR: Record<string, string> = {
  high: "Impact majeur",
  medium: "Impact moyen",
  low: "Exploration",
}

export function NextGenDashboard({ data, loading, error }: AIInsightDashboardContext) {
  const p = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  const features = Array.isArray(p.features) ? p.features : []
  const stack = p.stackHints && typeof p.stackHints === "object" ? (p.stackHints as Record<string, unknown>) : {}
  const score = typeof p.innovationScore === "number" ? p.innovationScore : 0

  const [localOn, setLocalOn] = useState<Record<string, boolean>>({})

  if (loading && !features.length) return <Skeleton className="h-[560px] w-full rounded-2xl" />
  if (error) return <ErrorCard message={error} />

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50 via-violet-50 to-white p-6 dark:border-indigo-900 dark:from-indigo-950/40 dark:to-slate-900">
        <div>
          <p className="text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Laboratoire innovation</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">NEXT GEN Operating System</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{String(p.roadmapHorizon ?? "")}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase text-slate-500">Innovation score</p>
          <motion.p
            key={score}
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            className="text-5xl font-black text-transparent bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text"
          >
            {score}
          </motion.p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((raw, idx) => {
          const f = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
          const id = String(f.id ?? idx)
          const status = String(f.status ?? "concept")
          const impact = String(f.impactLevel ?? "medium")
          const roi = typeof f.estimatedROI === "number" ? f.estimatedROI : 1
          const prog = typeof f.progressPercent === "number" ? f.progressPercent : 0
          const tech = Array.isArray(f.technologies) ? f.technologies : []
          const on = localOn[id] ?? status === "pilot"

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="relative h-full overflow-hidden border-indigo-100/90 bg-white/95 dark:border-indigo-900/50 dark:bg-slate-900/95">
                <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400/25 to-purple-500/15 blur-2xl" />
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{String(f.name ?? "")}</CardTitle>
                    <FlaskConical className="h-5 w-5 shrink-0 text-indigo-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-indigo-600">{STATUS_FR[status] ?? status}</Badge>
                    <Badge variant="outline">{IMPACT_FR[impact] ?? impact}</Badge>
                    <Badge variant="secondary">ROI ×{roi.toFixed(2)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-slate-600 dark:text-slate-400">{String(f.description ?? "")}</p>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Avancement</span>
                      <span>{prog}%</span>
                    </div>
                    <Progress value={prog} className="h-2 bg-indigo-100 dark:bg-indigo-950/50" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tech.map((t, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] font-normal">
                        {String(t)}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-stone-100 pt-3 dark:border-slate-800">
                    <span className="text-xs text-slate-500">Activation lab</span>
                    <Button
                      size="sm"
                      variant={on ? "default" : "outline"}
                      className={on ? "bg-indigo-600" : ""}
                      onClick={() => {
                        const next = !on
                        setLocalOn((prev) => ({ ...prev, [id]: next }))
                        toast.success(next ? "Fonctionnalité activée (simulation)" : "Désactivée (simulation)")
                      }}
                    >
                      <ToggleLeft className="mr-2 h-4 w-4" />
                      {on ? "On" : "Off"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <Card className="border-indigo-100 dark:border-indigo-900/40">
        <CardHeader>
          <CardTitle className="text-base">Timeline feuille de route tech</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative border-l border-indigo-200 pl-6 dark:border-indigo-900">
            {["Concept · exploration", "Bêta interne · pilotes salon", "Production progressive · observabilité"].map(
              (label, i) => (
                <li key={i} className="relative mb-6 last:mb-0">
                  <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                  <p className="text-xs text-slate-500">Phase {i + 1}</p>
                </li>
              ),
            )}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stack cible</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {Object.entries(stack).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950/50">
              <p className="font-semibold capitalize text-slate-800 dark:text-slate-200">{k}</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{Array.isArray(v) ? v.join(" · ") : String(v)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
        <Sparkles className="mx-auto mb-3 h-8 w-8 text-amber-500" />
        Prochains chantiers&nbsp;: empathie comportementale, commerce vocal contextuel, expériences AR carte.
      </div>
    </div>
  )
}
