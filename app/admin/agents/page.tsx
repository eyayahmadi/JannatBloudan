"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bot,
  Zap,
  AlertCircle,
  Clock,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type AgentStat = {
  name: string
  type: string
  version?: string | null
  executions: number
  avgLatencyMs: number
  totalTokens: number
  totalCost: number
  errors: number
  errorRate: number
  lastRunAt?: string | null
}

type RecentExecution = {
  id: string
  agent_name: string
  status: string
  latency_ms: number | null
  tokens_used: number | null
  cost_usd: number | null
  created_at: string
}

type StatsResponse = {
  agents: AgentStat[]
  recent: RecentExecution[]
  totalExecutions: number
  totalCost: number
  errorsRate: number
  source: string
}

const AGENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  agent_chatbot: { label: "Chatbot", color: "bg-blue-100 text-blue-700", icon: "💬" },
  agent_recommendation: { label: "Recommandation", color: "bg-purple-100 text-purple-700", icon: "🎯" },
  agent_stock: { label: "Stock", color: "bg-green-100 text-green-700", icon: "📦" },
  agent_pricing: { label: "Pricing", color: "bg-amber-100 text-amber-700", icon: "💰" },
  agent_anomaly: { label: "Anomalies", color: "bg-red-100 text-red-700", icon: "🚨" },
  agent_sentiment: { label: "Sentiment", color: "bg-pink-100 text-pink-700", icon: "😊" },
  agent_upsell: { label: "Upsell", color: "bg-orange-100 text-orange-700", icon: "📈" },
  agent_memory: { label: "Memoire (RAG)", color: "bg-cyan-100 text-cyan-700", icon: "🧠" },
  agent_marketing: { label: "Marketing", color: "bg-rose-100 text-rose-700", icon: "📣" },
  agent_coordinator: { label: "Coordinator", color: "bg-violet-100 text-violet-700", icon: "🎼" },
}

const formatCost = (v: number) => `$${v.toFixed(4)}`
const formatLatency = (ms: number) => (ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`)
const formatDate = (iso: string) => {
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60000) return "il y a qqs s"
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)}min`
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export default function AgentsDashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/agents/stats?days=${days}`)
      if (res.ok) {
        const data = (await res.json()) as StatsResponse
        setStats(data)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  const maxExecutions = useMemo(
    () => Math.max(1, ...(stats?.agents ?? []).map((a) => a.executions)),
    [stats],
  )

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell>
        <SiteHeader
          backHref="/admin"
          hideMainNav
          trailing={
            <div className="flex items-center gap-2">
              {[7, 30, 90].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={days === d ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setDays(d)}
                >
                  {d}j
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={load} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          }
        />

        <div className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="h-7 w-7 text-violet-600" />
              Observability Agents
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Monitoring en temps reel des agents IA (latence, tokens, erreurs, couts)
              {stats?.source === "supabase" ? (
                <span className="ml-2 inline-flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1" />
                  Live
                </span>
              ) : (
                <span className="ml-2 inline-flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-orange-500 mr-1" />
                  Demo
                </span>
              )}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="dark:bg-slate-800/60 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Zap className="h-6 w-6 text-amber-600" />
                      <Badge variant="outline" className="text-xs">
                        {days}j
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">Executions totales</p>
                    <p className="text-3xl font-bold">{stats?.totalExecutions ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="dark:bg-slate-800/60 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-slate-500">Cout total</p>
                    <p className="text-3xl font-bold">{formatCost(stats?.totalCost ?? 0)}</p>
                  </CardContent>
                </Card>
                <Card className="dark:bg-slate-800/60 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <AlertCircle
                        className={`h-6 w-6 ${
                          (stats?.errorsRate ?? 0) > 0.05 ? "text-red-600" : "text-slate-400"
                        }`}
                      />
                    </div>
                    <p className="text-sm text-slate-500">Taux d'erreur</p>
                    <p
                      className={`text-3xl font-bold ${
                        (stats?.errorsRate ?? 0) > 0.05 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {((stats?.errorsRate ?? 0) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="dark:bg-slate-800/60 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-500">Agents actifs</p>
                    <p className="text-3xl font-bold">{stats?.agents.length ?? 0}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Agents ranking */}
                <div className="lg:col-span-2">
                  <Card className="dark:bg-slate-800/60 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-violet-600" />
                        Performance par agent
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(stats?.agents ?? []).length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          Aucune donnee sur la periode.
                          <br />
                          <span className="text-xs">
                            Les executions d'agents seront visibles ici.
                          </span>
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {stats!.agents
                            .sort((a, b) => b.executions - a.executions)
                            .map((agent) => {
                              const meta = AGENT_LABELS[agent.name] ?? {
                                label: agent.name,
                                color: "bg-slate-100 text-slate-700",
                                icon: "🤖",
                              }
                              const pct = (agent.executions / maxExecutions) * 100
                              const hasErrors = agent.errorRate > 0.05
                              return (
                                <div
                                  key={agent.name}
                                  className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{meta.icon}</span>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-semibold text-slate-900 dark:text-white">
                                            {meta.label}
                                          </h3>
                                          {agent.version && (
                                            <Badge variant="outline" className="text-xs">
                                              v{agent.version}
                                            </Badge>
                                          )}
                                          {hasErrors && (
                                            <Badge className="bg-red-100 text-red-700 text-xs">
                                              <AlertCircle className="h-3 w-3 mr-1" />
                                              {(agent.errorRate * 100).toFixed(1)}% err
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono">
                                          {agent.name}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {agent.executions}
                                      </p>
                                      <p className="text-xs text-slate-500">exec.</p>
                                    </div>
                                  </div>

                                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-3">
                                    <div
                                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>

                                  <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatLatency(agent.avgLatencyMs)}
                                    </span>
                                    <span>
                                      {agent.totalTokens.toLocaleString()} tokens
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {formatCost(agent.totalCost)}
                                    </span>
                                    {agent.lastRunAt && (
                                      <span className="ml-auto text-slate-400">
                                        {formatDate(agent.lastRunAt)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent executions feed */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-4 dark:bg-slate-800/60 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Flux temps reel
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {(stats?.recent ?? []).length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-4">
                            Aucune execution.
                          </p>
                        ) : (
                          (stats?.recent ?? []).map((exec) => {
                            const meta = AGENT_LABELS[exec.agent_name] ?? {
                              label: exec.agent_name,
                              color: "",
                              icon: "🤖",
                            }
                            const isOk = exec.status === "success"
                            return (
                              <div
                                key={exec.id}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                              >
                                {isOk ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                )}
                                <span className="text-lg flex-shrink-0">{meta.icon}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium truncate">
                                    {meta.label}
                                  </p>
                                  <p className="text-[10px] text-slate-500 flex gap-2">
                                    <span>{formatLatency(exec.latency_ms ?? 0)}</span>
                                    <span>{exec.tokens_used ?? 0}t</span>
                                    <span>{formatDate(exec.created_at)}</span>
                                  </p>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
