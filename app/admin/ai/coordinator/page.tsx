"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Brain,
  Activity,
  ArrowRight,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Network,
  Clock,
  Shield,
  BarChart3,
  type LucideIcon,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type AgentNode = {
  id: string
  name: string
  shortName: string
  status: "active" | "idle" | "warning"
  health: number
  lastRun: string
  metric: string
  href: string
  icon: LucideIcon
}

type CommEvent = {
  id: string
  timestamp: string
  from: string
  to: string
  type: "alert" | "sync" | "trigger" | "query" | "prediction"
  message: string
}

type DependencyLink = {
  from: string
  to: string
  label: string
  color: string
}

const AGENTS: AgentNode[] = [
  { id: "recommendation", name: "Agent Recommandation", shortName: "Recommandation", status: "active", health: 97, lastRun: "il y a 30s", metric: "847 reco.", href: "/admin/ai/recommendations", icon: Brain },
  { id: "chatbot", name: "Agent Chatbot", shortName: "Chatbot", status: "active", health: 99, lastRun: "il y a 5s", metric: "1 204 conv.", href: "/admin/ai", icon: Zap },
  { id: "stock", name: "Agent Stock Predictif", shortName: "Stock", status: "active", health: 78, lastRun: "il y a 2m", metric: "3 alertes", href: "/admin/ai/stock", icon: AlertTriangle },
  { id: "pricing", name: "Agent Pricing Dynamique", shortName: "Pricing", status: "active", health: 92, lastRun: "il y a 1m", metric: "+12% rev.", href: "/admin/ai/pricing", icon: Zap },
  { id: "anomalies", name: "Agent Detection Anomalies", shortName: "Anomalies", status: "active", health: 88, lastRun: "il y a 45s", metric: "12 alertes", href: "/admin/ai/anomalies", icon: Shield },
  { id: "kitchen", name: "Agent Optimisation Cuisine", shortName: "Cuisine", status: "active", health: 95, lastRun: "il y a 1m", metric: "18% + rapide", href: "/admin/ai/kitchen", icon: Clock },
  { id: "analytics", name: "Agent Analytics & BI", shortName: "Analytics", status: "active", health: 94, lastRun: "il y a 90s", metric: "12 insights", href: "/admin/ai/analytics", icon: BarChart3 },
  { id: "marketing", name: "Agent Marketing Intelligent", shortName: "Marketing", status: "active", health: 91, lastRun: "il y a 3m", metric: "5 campagnes", href: "/admin/ai/marketing", icon: Zap },
  { id: "loyalty", name: "Agent Fidelite", shortName: "Fidelite", status: "active", health: 94, lastRun: "il y a 2m", metric: "2 340 membres", href: "/admin/ai/loyalty", icon: Zap },
  { id: "sentiment", name: "Agent Analyse Sentiment", shortName: "Sentiment", status: "active", health: 96, lastRun: "il y a 1m", metric: "94% positifs", href: "/admin/ai/sentiment", icon: Zap },
  { id: "forecast", name: "Agent Prevision Business", shortName: "Forecast", status: "active", health: 89, lastRun: "il y a 4m", metric: "Prev. 30j", href: "/admin/ai/forecast", icon: Activity },
  { id: "vision", name: "Agent Vision IA", shortName: "Vision", status: "active", health: 93, lastRun: "il y a 2m", metric: "156 scans", href: "/admin/ai/vision", icon: Zap },
  { id: "quality", name: "Agent Qualite", shortName: "Qualite", status: "active", health: 90, lastRun: "il y a 3m", metric: "98% conforme", href: "/admin/ai/quality", icon: CheckCircle2 },
  { id: "reservation", name: "Agent Reservation", shortName: "Reservation", status: "active", health: 87, lastRun: "il y a 1m", metric: "45 reserv.", href: "/admin/ai/reservation", icon: Clock },
]

const COMM_LOG: CommEvent[] = [
  { id: "1", timestamp: "14:32:05", from: "Stock", to: "Pricing", type: "alert", message: "Rupture prevue sur Pistaches — ajuster prix des plats concernes" },
  { id: "2", timestamp: "14:31:42", from: "Sentiment", to: "Marketing", type: "trigger", message: "Score sentiment en baisse sur Pizza — lancer campagne corrective" },
  { id: "3", timestamp: "14:30:18", from: "Anomalies", to: "Coordinator", type: "alert", message: "Pic de commandes detecte — alerter Cuisine" },
  { id: "4", timestamp: "14:29:55", from: "Forecast", to: "Stock", type: "prediction", message: "Prevision forte demande Shawarma ce weekend" },
  { id: "4b", timestamp: "14:29:20", from: "Analytics", to: "Marketing", type: "sync", message: "Rapport NLG: creneau dessert sous-performant → ajuster campagne push" },
  { id: "5", timestamp: "14:28:30", from: "Recommandation", to: "Fidelite", type: "sync", message: "Mise a jour profils clients — 234 preferences synchronisees" },
  { id: "6", timestamp: "14:27:10", from: "Cuisine", to: "Anomalies", type: "query", message: "Temps preparation moyen depasse seuil — investigation en cours" },
  { id: "7", timestamp: "14:25:45", from: "Marketing", to: "Recommandation", type: "sync", message: "Nouvelle campagne Baklava — ajuster recommendations" },
  { id: "8", timestamp: "14:24:20", from: "Vision", to: "Qualite", type: "trigger", message: "Image plat non conforme detectee — verification qualite lancee" },
  { id: "9", timestamp: "14:23:00", from: "Reservation", to: "Cuisine", type: "prediction", message: "32 couverts prevus ce soir — preparer stations supplementaires" },
  { id: "10", timestamp: "14:21:30", from: "Qualite", to: "Anomalies", type: "alert", message: "Temperature chambre froide hors norme — alerte declenchee" },
]

const DEPENDENCY_LINKS: DependencyLink[] = [
  { from: "Stock", to: "Pricing", label: "Ajustement prix sur rupture", color: "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300" },
  { from: "Sentiment", to: "Marketing", label: "Campagnes correctives", color: "bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-300" },
  { from: "Forecast", to: "Stock", label: "Previsions demande", color: "bg-cyan-100 border-cyan-300 text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-300" },
  { from: "Analytics", to: "Marketing", label: "Insights → campagnes", color: "bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-300" },
  { from: "Anomalies", to: "Cuisine", label: "Alertes preparation", color: "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300" },
  { from: "Recommandation", to: "Fidelite", label: "Profils synchronises", color: "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300" },
  { from: "Marketing", to: "Recommandation", label: "Campagnes actives", color: "bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-300" },
  { from: "Vision", to: "Qualite", label: "Verification visuelle", color: "bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300" },
  { from: "Reservation", to: "Cuisine", label: "Previsions couverts", color: "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300" },
  { from: "Qualite", to: "Anomalies", label: "Alertes conformite", color: "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300" },
  { from: "Chatbot", to: "Recommandation", label: "Requetes clients", color: "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300" },
]

const EVENT_STYLES: Record<CommEvent["type"], { bg: string; text: string; label: string }> = {
  alert: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", label: "Alerte" },
  sync: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", label: "Sync" },
  trigger: { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300", label: "Trigger" },
  query: { bg: "bg-slate-100 dark:bg-slate-700/40", text: "text-slate-700 dark:text-slate-300", label: "Query" },
  prediction: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", label: "Prediction" },
}

function getHealthColor(h: number) {
  if (h >= 90) return "bg-emerald-500"
  if (h >= 75) return "bg-amber-500"
  return "bg-red-500"
}

function getHealthTrack(h: number) {
  if (h >= 90) return "bg-emerald-100 dark:bg-emerald-900/30"
  if (h >= 75) return "bg-amber-100 dark:bg-amber-900/30"
  return "bg-red-100 dark:bg-red-900/30"
}

export default function CoordinatorPage() {
  const [loading, setLoading] = useState(false)
  const [runSuccess, setRunSuccess] = useState(false)
  const [paused, setPaused] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/ai/coordinator")
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => null)
  }, [])

  const activeCount = AGENTS.filter((a) => a.status === "active").length
  const avgHealth = Math.round(AGENTS.reduce((s, a) => s + a.health, 0) / AGENTS.length)

  const handleRunAll = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 2200))
    setLoading(false)
    setRunSuccess(true)
    setTimeout(() => setRunSuccess(false), 3000)
  }

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell className="bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/admin/ai" backLabel="AI Hub" hideMainNav />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-500/30">
                <Network className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Agent Coordinator
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Cerveau central — orchestration de tous les agents IA
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaused(!paused)}
                className={paused ? "border-red-300 text-red-600" : ""}
              >
                {paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                {paused ? "Reprendre" : "Pause systeme"}
              </Button>
              <Button
                size="sm"
                onClick={handleRunAll}
                disabled={loading}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-purple-700"
              >
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : runSuccess ? (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {loading ? "Execution..." : runSuccess ? "Succes!" : "Executer tous les agents"}
              </Button>
            </div>
          </div>

          {/* Health Overview */}
          <Card className="mb-8 overflow-hidden border-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-xl shadow-violet-500/20">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-5">
                <div className="col-span-2 sm:col-span-1">
                  <p className="mb-1 text-sm font-medium text-violet-200">Sante globale</p>
                  <p className="text-5xl font-black tracking-tight">{avgHealth}<span className="text-2xl font-bold text-violet-300">/100</span></p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-violet-200">Agents actifs</p>
                  <p className="text-4xl font-bold">{activeCount}<span className="text-lg text-violet-300">/{AGENTS.length}</span></p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-violet-200">Evenements 24h</p>
                  <p className="text-4xl font-bold">1 847</p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-violet-200">Alertes resolues</p>
                  <p className="text-4xl font-bold text-emerald-300">38</p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-violet-200">Alertes en attente</p>
                  <p className="text-4xl font-bold text-amber-300">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Grid */}
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <Activity className="h-5 w-5 text-violet-600" />
              Agents ({AGENTS.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {AGENTS.map((agent) => (
                <Link key={agent.id} href={agent.href}>
                  <Card className="group relative overflow-hidden border-white/60 bg-gradient-to-br from-white via-slate-50 to-violet-50/30 transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{agent.shortName}</span>
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Actif
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Sante</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{agent.health}%</span>
                        </div>
                        <div className={`h-2 w-full overflow-hidden rounded-full ${getHealthTrack(agent.health)}`}>
                          <div
                            className={`h-full rounded-full ${getHealthColor(agent.health)} transition-all duration-700`}
                            style={{ width: `${agent.health}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{agent.lastRun}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{agent.metric}</span>
                      </div>
                    </CardContent>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Communication Log + Dependency Graph */}
          <div className="mb-8 grid gap-6 lg:grid-cols-5">
            {/* Communication Log */}
            <Card className="lg:col-span-3 border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4 text-violet-600" />
                  Communication inter-agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {COMM_LOG.map((evt) => {
                    const style = EVENT_STYLES[evt.type]
                    return (
                      <div key={evt.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                        <span className="mt-0.5 shrink-0 text-xs font-mono text-slate-400 dark:text-slate-500 w-16">{evt.timestamp}</span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{evt.from}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{evt.to}</span>
                            <Badge className={`ml-1 text-[10px] px-1.5 py-0 ${style.bg} ${style.text} border-0`}>
                              {style.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{evt.message}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Dependency Graph */}
            <Card className="lg:col-span-2 border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Network className="h-4 w-4 text-purple-600" />
                  Graphe de dependances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {DEPENDENCY_LINKS.map((link, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-medium ${link.color}`}
                    >
                      <span className="font-bold">{link.from}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 opacity-60" />
                      <span className="font-bold">{link.to}</span>
                      <span className="ml-auto text-[10px] opacity-75">{link.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success Toast */}
          {runSuccess && (
            <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-4 w-4" />
                Tous les agents ont ete executes avec succes
              </div>
            </div>
          )}
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
