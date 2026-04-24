"use client"

import { useState, useEffect } from "react"
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  EyeOff,
  Activity,
  Cpu,
} from "lucide-react"
import { toast } from "sonner"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

type Anomaly = {
  id: string
  type: string
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  affectedEntity: string
  suggestedAction: string
  detectedAt: string
  resolved: boolean
}

type AnomalyData = {
  anomalies: Anomaly[]
  summary: {
    total: number
    critical: number
    warning: number
    info: number
    unresolved: number
  }
  algorithm: string
  generatedAt: string
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    badge: "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-700",
    iconColor: "text-red-600 dark:text-red-400",
    border: "border-l-red-500",
    label: "Critique",
  },
  warning: {
    icon: AlertTriangle,
    badge: "bg-orange-100 text-orange-700 ring-1 ring-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-700",
    iconColor: "text-orange-600 dark:text-orange-400",
    border: "border-l-orange-500",
    label: "Avertissement",
  },
  info: {
    icon: Info,
    badge: "bg-blue-100 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-700",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "border-l-blue-500",
    label: "Info",
  },
}

const MOCK_TREND = [
  { day: "Lun", count: 3 },
  { day: "Mar", count: 5 },
  { day: "Mer", count: 2 },
  { day: "Jeu", count: 8 },
  { day: "Ven", count: 4 },
  { day: "Sam", count: 6 },
  { day: "Dim", count: 3 },
]

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "a l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export default function AnomaliesPage() {
  const [data, setData] = useState<AnomalyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [localAnomalies, setLocalAnomalies] = useState<Anomaly[]>([])

  useEffect(() => {
    fetch("/api/ai/anomalies")
      .then((r) => r.json())
      .then((d: AnomalyData) => {
        setData(d)
        setLocalAnomalies(d.anomalies)
      })
      .catch(() => toast.error("Erreur chargement anomalies"))
      .finally(() => setLoading(false))
  }, [])

  const resolveAnomaly = (id: string) => {
    setLocalAnomalies((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)))
    toast.success("Anomalie marquee comme resolue")
  }

  const ignoreAnomaly = (id: string) => {
    setLocalAnomalies((prev) => prev.filter((a) => a.id !== id))
    toast("Anomalie ignoree")
  }

  const unresolvedCount = localAnomalies.filter((a) => !a.resolved).length
  const maxTrend = Math.max(...MOCK_TREND.map((t) => t.count))

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin/ai" />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-100 sm:text-3xl">
            Detection d&apos;Anomalies IA
          </h1>
          <p className="mt-1 text-sm text-amber-800/70 dark:text-amber-300/70">
            Surveillance intelligente des operations en temps reel
          </p>

          {loading ? (
            <div className="mt-12 text-center text-amber-700 dark:text-amber-400">Chargement...</div>
          ) : data ? (
            <div className="mt-8 space-y-10">
              {/* Summary cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: "Total anomalies", value: data.summary.total, icon: ShieldAlert, color: "text-amber-600 dark:text-amber-400" },
                  { label: "Critiques", value: data.summary.critical, icon: AlertCircle, color: "text-red-600 dark:text-red-400" },
                  { label: "Avertissements", value: data.summary.warning, icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400" },
                  { label: "Info", value: data.summary.info, icon: Info, color: "text-blue-600 dark:text-blue-400" },
                  { label: "Non resolues", value: unresolvedCount, icon: ShieldCheck, color: "text-purple-600 dark:text-purple-400" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="flex items-center gap-3 rounded-2xl border border-amber-200/60 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                      <p className="text-[11px] font-medium text-amber-700/70 dark:text-amber-400/70">{card.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Anomaly feed */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <Activity className="h-5 w-5 text-orange-500" /> Flux d&apos;anomalies
                </h2>
                <div className="space-y-4">
                  {localAnomalies.map((anomaly) => {
                    const config = SEVERITY_CONFIG[anomaly.severity]
                    const Icon = config.icon
                    return (
                      <div
                        key={anomaly.id}
                        className={`rounded-2xl border border-l-4 border-amber-200/60 bg-white/70 p-5 shadow-sm backdrop-blur transition dark:border-amber-800/40 dark:bg-amber-950/30 ${config.border} ${anomaly.resolved ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${config.iconColor}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                                  {anomaly.title}
                                </h3>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}>
                                  {config.label}
                                </span>
                                {anomaly.resolved && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" /> Resolu
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/70">
                                {anomaly.description}
                              </p>
                              <p className="mt-2 text-xs text-amber-600/70 dark:text-amber-400/60">
                                Entite affectee: <span className="font-semibold">{anomaly.affectedEntity}</span>
                              </p>
                              <div className="mt-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 dark:from-amber-950/40 dark:to-orange-950/30">
                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Action suggeree</p>
                                <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">{anomaly.suggestedAction}</p>
                              </div>
                              <p className="mt-2 text-[11px] text-amber-500/60 dark:text-amber-500/40">
                                Detecte {relativeTime(anomaly.detectedAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {!anomaly.resolved && (
                          <div className="mt-4 flex items-center gap-2 border-t border-amber-100/60 pt-3 dark:border-amber-800/20">
                            <button
                              type="button"
                              onClick={() => resolveAnomaly(anomaly.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:from-amber-600 hover:to-orange-600"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Resoudre
                            </button>
                            <button
                              type="button"
                              onClick={() => ignoreAnomaly(anomaly.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/60 bg-white/70 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-900/40"
                            >
                              <EyeOff className="h-3.5 w-3.5" /> Ignorer
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {localAnomalies.length === 0 && (
                    <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-8 text-center dark:border-emerald-800/30 dark:bg-emerald-950/20">
                      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                      <p className="mt-2 font-medium text-emerald-700 dark:text-emerald-400">Aucune anomalie active</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Trend chart */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-6 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  Tendance des anomalies (7 derniers jours)
                </h2>
                <div className="flex items-end gap-3">
                  {MOCK_TREND.map((t) => {
                    const barH = maxTrend > 0 ? (t.count / maxTrend) * 160 : 0
                    return (
                      <div key={t.day} className="flex flex-1 flex-col items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{t.count}</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-orange-500 to-amber-400 transition-all"
                          style={{ height: `${barH}px`, minHeight: "4px" }}
                        />
                        <span className="text-[11px] font-medium text-amber-700/70 dark:text-amber-400/60">{t.day}</span>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Algorithm info */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <Cpu className="h-5 w-5 text-orange-500" /> Algorithme
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Modele", value: data.algorithm },
                    { label: "Derniere analyse", value: new Date(data.generatedAt).toLocaleTimeString("fr-FR") },
                    { label: "Seuils adaptatifs", value: "Actifs" },
                  ].map((info) => (
                    <div key={info.label} className="rounded-xl bg-amber-50/50 p-4 dark:bg-amber-950/40">
                      <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/60">{info.label}</p>
                      <p className="mt-1 text-sm font-bold text-amber-950 dark:text-amber-100">{info.value}</p>
                    </div>
                  ))}
                </div>
              </section>
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
