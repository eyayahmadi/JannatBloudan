"use client"

import { useState, useEffect } from "react"
import {
  Eye,
  Users,
  Armchair,
  SprayCan,
  Clock,
  Percent,
  AlertTriangle,
  Camera,
  MapPin,
} from "lucide-react"
import { toast } from "sonner"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

type TableInfo = {
  id: number
  zone: string
  capacity: number
  status: "occupied" | "empty" | "needs_cleaning" | "reserved"
}

type ZoneInfo = {
  name: string
  label: string
  occupancy: number
  total: number
  occupied: number
}

type Alert = {
  id: string
  severity: "high" | "medium" | "low"
  message: string
  timestamp: string
}

type VisionData = {
  tables: TableInfo[]
  zones: ZoneInfo[]
  alerts: Alert[]
  metrics: {
    total: number
    occupied: number
    empty: number
    needsCleaning: number
    queue: number
    occupancyRate: number
  }
}

const FALLBACK: VisionData = {
  tables: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    zone: i < 8 ? "interieur" : i < 14 ? "terrasse" : i < 17 ? "vip" : "gaming",
    capacity: [2, 4, 6, 4, 2, 6, 4, 2, 4, 6, 2, 4, 4, 2, 6, 4, 2, 4, 6, 4][i],
    status: (["occupied", "empty", "needs_cleaning", "reserved", "occupied", "occupied", "empty", "empty",
      "occupied", "occupied", "empty", "needs_cleaning", "reserved", "occupied", "occupied", "empty",
      "reserved", "occupied", "empty", "occupied"] as TableInfo["status"][])[i],
  })),
  zones: [
    { name: "interieur", label: "Interieur", occupancy: 62, total: 8, occupied: 5 },
    { name: "terrasse", label: "Terrasse", occupancy: 67, total: 6, occupied: 4 },
    { name: "vip", label: "VIP", occupancy: 67, total: 3, occupied: 2 },
    { name: "gaming", label: "Gaming", occupancy: 75, total: 3, occupied: 2 },
  ],
  alerts: [
    { id: "a1", severity: "high", message: "Table 12 non nettoyee depuis 25 min", timestamp: "19:42" },
    { id: "a2", severity: "medium", message: "File d'attente > 10 personnes detectee", timestamp: "19:38" },
    { id: "a3", severity: "low", message: "Zone terrasse faiblement eclairee", timestamp: "19:30" },
    { id: "a4", severity: "high", message: "Table 3 — objet oublie detecte", timestamp: "19:25" },
    { id: "a5", severity: "medium", message: "Mouvement suspect pres de la caisse", timestamp: "19:15" },
  ],
  metrics: { total: 20, occupied: 11, empty: 5, needsCleaning: 2, queue: 8, occupancyRate: 55 },
}

const CAMERAS = [
  { label: "Camera 1", location: "Entree" },
  { label: "Camera 2", location: "Salle" },
  { label: "Camera 3", location: "Terrasse" },
  { label: "Camera 4", location: "Cuisine" },
]

const STATUS_COLOR: Record<string, string> = {
  occupied: "bg-orange-500 dark:bg-orange-600",
  empty: "bg-emerald-500 dark:bg-emerald-600",
  needs_cleaning: "bg-red-500 dark:bg-red-600",
  reserved: "bg-blue-500 dark:bg-blue-600",
}

const STATUS_LABEL: Record<string, string> = {
  occupied: "Occupee",
  empty: "Libre",
  needs_cleaning: "A nettoyer",
  reserved: "Reservee",
}

const SEVERITY_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
}

const ZONE_BAR_COLOR: Record<string, string> = {
  interieur: "bg-amber-500",
  terrasse: "bg-emerald-500",
  vip: "bg-violet-500",
  gaming: "bg-blue-500",
}

const TABLE_STATUSES: TableInfo["status"][] = ["occupied", "empty", "needs_cleaning", "reserved"]

const ZONE_DEFS: { name: ZoneInfo["name"]; label: string }[] = [
  { name: "interieur", label: "Interieur" },
  { name: "terrasse", label: "Terrasse" },
  { name: "vip", label: "VIP" },
  { name: "gaming", label: "Gaming" },
]

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

function normalizeTable(t: unknown, index: number): TableInfo | null {
  if (!t || typeof t !== "object") return null
  const r = t as Record<string, unknown>
  const id = num(r.id ?? r.number, index + 1)
  const zone = String(r.zone ?? "interieur")
  const capacity = num(r.capacity, 4)
  const raw = String(r.status ?? "empty")
  const status = (TABLE_STATUSES.includes(raw as TableInfo["status"]) ? raw : "empty") as TableInfo["status"]
  return { id, zone, capacity, status }
}

function normalizeZone(z: unknown): ZoneInfo | null {
  if (!z || typeof z !== "object") return null
  const r = z as Record<string, unknown>
  const name = String(r.name ?? "")
  if (!name) return null
  return {
    name,
    label: String(r.label ?? name),
    occupancy: num(r.occupancy, 0),
    total: Math.max(0, num(r.total, 0)),
    occupied: Math.max(0, num(r.occupied, 0)),
  }
}

function zonesFromTablesAndHeat(
  tables: TableInfo[],
  heat: Record<string, number> | undefined
): ZoneInfo[] {
  return ZONE_DEFS.map(({ name, label }) => {
    const ts = tables.filter((t) => t.zone === name)
    const fb = FALLBACK.zones.find((z) => z.name === name)
    const total = ts.length || fb?.total || 4
    const heatPct = heat?.[name]
    const occupied = ts.length
      ? ts.filter((t) => t.status === "occupied").length
      : Math.round(((Number.isFinite(heatPct) ? heatPct! : fb?.occupancy ?? 50) / 100) * total)
    const computedPct = Math.round((occupied / Math.max(1, total)) * 100)
    const occupancy =
      heatPct != null && Number.isFinite(Number(heatPct))
        ? Math.min(100, Math.max(0, Math.round(Number(heatPct))))
        : Math.min(100, Math.max(0, computedPct))
    return {
      name,
      label,
      occupancy,
      total,
      occupied: Math.min(total, Math.max(0, occupied)),
    }
  })
}

function normalizeAlerts(rawAlerts: unknown): Alert[] {
  if (!Array.isArray(rawAlerts) || rawAlerts.length === 0) return FALLBACK.alerts
  const out: Alert[] = []
  for (let i = 0; i < rawAlerts.length; i++) {
    const item = rawAlerts[i]
    if (!item || typeof item !== "object") continue
    const r = item as Record<string, unknown>
    const sevRaw = String(r.severity ?? "medium").toLowerCase()
    const severity: Alert["severity"] =
      sevRaw === "high" || sevRaw === "critical" || sevRaw === "error"
        ? "high"
        : sevRaw === "low" || sevRaw === "info"
          ? "low"
          : "medium"
    const tid = num(r.tableId ?? r.id ?? i, i)
    out.push({
      id: typeof r.id === "string" ? r.id : `a-${tid}-${i}`,
      severity,
      message: String(r.message ?? ""),
      timestamp: typeof r.timestamp === "string" ? r.timestamp : "—",
    })
  }
  return out.length ? out : FALLBACK.alerts
}

function normalizeVisionPayload(raw: unknown): VisionData {
  if (!raw || typeof raw !== "object") return FALLBACK

  const o = raw as Record<string, unknown>

  const tablesRaw = Array.isArray(o.tables) ? o.tables : []
  const tables =
    tablesRaw.length > 0
      ? tablesRaw.map(normalizeTable).filter(Boolean)
      : []
  const safeTables = tables.length ? (tables as TableInfo[]) : FALLBACK.tables

  const mm = o.metrics && typeof o.metrics === "object" ? (o.metrics as Record<string, unknown>) : null
  const metrics: VisionData["metrics"] = {
    total: num(mm?.total, safeTables.length),
    occupied: num(mm?.occupied, FALLBACK.metrics.occupied),
    empty: num(mm?.empty, FALLBACK.metrics.empty),
    needsCleaning: num(mm?.needsCleaning ?? mm?.needs_cleaning, FALLBACK.metrics.needsCleaning),
    queue: num(mm?.queue ?? mm?.queueLength, FALLBACK.metrics.queue),
    occupancyRate: num(mm?.occupancyRate ?? mm?.avgOccupancy, FALLBACK.metrics.occupancyRate),
  }

  let zones: ZoneInfo[] = FALLBACK.zones
  const zArr = Array.isArray(o.zones) ? o.zones.map(normalizeZone).filter(Boolean) as ZoneInfo[] : []
  if (zArr.length) {
    zones = zArr
  } else {
    const hm = o.heatmap
    let heat: Record<string, number> | undefined
    if (hm && typeof hm === "object") {
      const zonesObj = (hm as Record<string, unknown>).zones
      if (zonesObj && typeof zonesObj === "object" && !Array.isArray(zonesObj)) {
        const pairs = Object.entries(zonesObj as Record<string, unknown>)
          .map(([k, v]) => [k, Number(v)] as const)
          .filter(([, v]) => Number.isFinite(v))
        heat = Object.fromEntries(pairs) as Record<string, number>
      }
    }
    zones = zonesFromTablesAndHeat(safeTables, heat)
  }

  const alerts = normalizeAlerts(o.alerts)

  return {
    tables: safeTables,
    zones,
    alerts,
    metrics,
  }
}

export default function VisionPage() {
  const [data, setData] = useState<VisionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load(first: boolean) {
      try {
        if (first && !cancelled) setLoading(true)
        const r = await fetch("/api/ai/vision")
        const raw = await r.json()
        if (cancelled) return
        setData(normalizeVisionPayload(raw))
      } catch {
        if (cancelled) return
        setData(FALLBACK)
        toast.error("Donnees de demonstration chargees")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load(true)
    const interval = setInterval(() => load(false), 10_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const d = data ?? FALLBACK

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin/ai" />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-100 sm:text-3xl">
                Vision par Ordinateur
              </h1>
              <p className="text-sm text-amber-800/70 dark:text-amber-300/70">
                Surveillance intelligente du restaurant en temps reel
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-12 text-center text-amber-700 dark:text-amber-400">Chargement...</div>
          ) : (
            <div className="mt-8 space-y-10">
              {/* Metrics row */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[
                  { label: "Total tables", value: d.metrics.total, icon: Armchair, color: "text-amber-600 dark:text-amber-400" },
                  { label: "Occupees", value: d.metrics.occupied, icon: Users, color: "text-orange-600 dark:text-orange-400" },
                  { label: "Libres", value: d.metrics.empty, icon: Armchair, color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "A nettoyer", value: d.metrics.needsCleaning, icon: SprayCan, color: "text-red-600 dark:text-red-400" },
                  { label: "File d'attente", value: d.metrics.queue, icon: Clock, color: "text-blue-600 dark:text-blue-400" },
                  { label: "Taux occupation", value: `${d.metrics.occupancyRate}%`, icon: Percent, color: "text-violet-600 dark:text-violet-400" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="flex items-center gap-4 rounded-2xl border border-amber-200/60 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                      <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70">{card.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4">
                {Object.entries(STATUS_COLOR).map(([key, cls]) => (
                  <div key={key} className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                    <span className={`inline-block h-3 w-3 rounded ${cls}`} />
                    {STATUS_LABEL[key]}
                  </div>
                ))}
              </div>

              {/* Floor plan */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Plan du restaurant</h2>
                <div className="grid grid-cols-4 gap-3 sm:gap-4">
                  {d.tables.map((t, i) => {
                    const showZoneLabel =
                      i === 0 || d.tables[i - 1].zone !== t.zone
                    return (
                      <div key={t.id} className="relative">
                        {showZoneLabel && (
                          <span className="absolute -top-5 left-0 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            {t.zone}
                          </span>
                        )}
                        <div
                          className={`${STATUS_COLOR[t.status]} flex aspect-square flex-col items-center justify-center rounded-xl text-white shadow-md transition-transform hover:scale-105`}
                        >
                          <span className="text-lg font-bold">{t.id}</span>
                          <span className="text-[10px] opacity-80">{t.capacity} places</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Zone heatmap */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Occupation par zone</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {d.zones.map((z) => (
                    <div
                      key={z.name}
                      className="rounded-2xl border border-amber-200/60 bg-white/70 p-5 shadow-sm dark:border-amber-800/40 dark:bg-amber-950/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="font-semibold text-amber-950 dark:text-amber-100">{z.label}</span>
                        </div>
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{z.occupancy}%</span>
                      </div>
                      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-900/40">
                        <div
                          className={`h-full rounded-full transition-all ${ZONE_BAR_COLOR[z.name]}`}
                          style={{ width: `${z.occupancy}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-amber-700/70 dark:text-amber-400/70">
                        {z.occupied}/{z.total} tables occupees
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Alerts feed */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <AlertTriangle className="mr-2 inline h-5 w-5 text-orange-500" />
                  Alertes en cours
                </h2>
                <div className="space-y-3">
                  {d.alerts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-4 rounded-xl border border-amber-200/60 bg-white/70 px-5 py-3 shadow-sm dark:border-amber-800/40 dark:bg-amber-950/30"
                    >
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[a.severity]}`}>
                        {a.severity === "high" ? "Critique" : a.severity === "medium" ? "Moyen" : "Faible"}
                      </span>
                      <span className="flex-1 text-sm text-amber-900 dark:text-amber-100">{a.message}</span>
                      <span className="text-xs text-amber-600/70 dark:text-amber-400/70">{a.timestamp}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Camera feeds simulation */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <Camera className="mr-2 inline h-5 w-5 text-orange-500" />
                  Flux cameras
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {CAMERAS.map((cam) => (
                    <div
                      key={cam.label}
                      className="relative flex aspect-video flex-col items-center justify-center rounded-2xl border border-amber-200/60 bg-gray-200 shadow-sm dark:border-amber-800/40 dark:bg-gray-800"
                    >
                      <Camera className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                      <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                        {cam.label} — {cam.location}
                      </p>
                      <span className="absolute right-3 top-3 flex items-center gap-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                        </span>
                        <span className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Live</span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
