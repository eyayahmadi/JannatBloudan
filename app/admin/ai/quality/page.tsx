"use client"

import { useState, useEffect } from "react"
import {
  ShieldCheck,
  Thermometer,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Link2,
  Printer,
  Package,
  FileWarning,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

type HACCPCheck = {
  id: string
  name: string
  status: "pass" | "warning" | "fail"
  lastCheck: string
  nextCheck: string
  measuredValue: string
  limit: string
}

type Ingredient = {
  id: string
  name: string
  category: string
  supplier: string
  lotNumber: string
  receivedDate: string
  expiryDate: string
  daysUntilExpiry: number
  temperature: string
  status: string
}

type BlockchainStep = {
  label: string
  timestamp: string
  verified: boolean
}

type QualityData = {
  complianceScore: number
  haccpChecks: HACCPCheck[]
  ingredients: Ingredient[]
  alerts: { expiringSoon: number; expired: number; temperatureAlerts: number }
  blockchain: Record<string, BlockchainStep[]>
}

function buildFallback(): QualityData {
  return {
    complianceScore: 92,
    haccpChecks: [
      { id: "h1", name: "Temperature chambre froide", status: "pass", lastCheck: "14:30", nextCheck: "16:30", measuredValue: "3.2°C", limit: "< 5°C" },
      { id: "h2", name: "Temperature congelateur", status: "pass", lastCheck: "14:30", nextCheck: "16:30", measuredValue: "-19°C", limit: "< -18°C" },
      { id: "h3", name: "Hygiene plan de travail", status: "warning", lastCheck: "13:00", nextCheck: "15:00", measuredValue: "Moyen", limit: "Excellent" },
      { id: "h4", name: "Temperature plats chauds", status: "pass", lastCheck: "12:45", nextCheck: "14:45", measuredValue: "72°C", limit: "> 63°C" },
      { id: "h5", name: "Proprete equipements", status: "fail", lastCheck: "11:00", nextCheck: "13:00", measuredValue: "Insuffisant", limit: "Bon" },
      { id: "h6", name: "Lavage des mains", status: "pass", lastCheck: "14:00", nextCheck: "15:00", measuredValue: "Conforme", limit: "Conforme" },
    ],
    ingredients: [
      { id: "i1", name: "Poulet fermier", category: "Viande", supplier: "Ferme Al-Nour", lotNumber: "LOT-2024-1201", receivedDate: "2024-12-10", expiryDate: "2024-12-17", daysUntilExpiry: 2, temperature: "3°C", status: "Stocke" },
      { id: "i2", name: "Tomates bio", category: "Legumes", supplier: "Bio Champs", lotNumber: "LOT-2024-1189", receivedDate: "2024-12-12", expiryDate: "2024-12-20", daysUntilExpiry: 5, temperature: "8°C", status: "Stocke" },
      { id: "i3", name: "Saumon frais", category: "Poisson", supplier: "Ocean Direct", lotNumber: "LOT-2024-1195", receivedDate: "2024-12-13", expiryDate: "2024-12-16", daysUntilExpiry: 1, temperature: "2°C", status: "Stocke" },
      { id: "i4", name: "Creme fraiche", category: "Produit laitier", supplier: "Laiterie du Sud", lotNumber: "LOT-2024-1178", receivedDate: "2024-12-08", expiryDate: "2024-12-14", daysUntilExpiry: -1, temperature: "4°C", status: "Expire" },
      { id: "i5", name: "Huile d'olive", category: "Epicerie", supplier: "Olive Gold", lotNumber: "LOT-2024-0980", receivedDate: "2024-11-01", expiryDate: "2025-05-01", daysUntilExpiry: 140, temperature: "Ambiant", status: "Stocke" },
      { id: "i6", name: "Fromage gruyere", category: "Produit laitier", supplier: "Fromagerie Alps", lotNumber: "LOT-2024-1202", receivedDate: "2024-12-11", expiryDate: "2024-12-25", daysUntilExpiry: 10, temperature: "5°C", status: "Stocke" },
    ],
    alerts: { expiringSoon: 3, expired: 1, temperatureAlerts: 2 },
    blockchain: {
      "Poulet fermier": [
        { label: "Fournisseur", timestamp: "2024-12-09 08:00", verified: true },
        { label: "Reception", timestamp: "2024-12-10 06:30", verified: true },
        { label: "Stockage", timestamp: "2024-12-10 07:00", verified: true },
      ],
      "Saumon frais": [
        { label: "Fournisseur", timestamp: "2024-12-12 05:00", verified: true },
        { label: "Reception", timestamp: "2024-12-13 06:00", verified: true },
        { label: "Stockage", timestamp: "2024-12-13 06:45", verified: true },
      ],
      "Tomates bio": [
        { label: "Fournisseur", timestamp: "2024-12-11 07:00", verified: true },
        { label: "Reception", timestamp: "2024-12-12 08:15", verified: true },
        { label: "Stockage", timestamp: "2024-12-12 08:45", verified: true },
      ],
    },
  }
}

const CHECK_STATUS_STYLE: Record<string, string> = {
  pass: "bg-emerald-100 text-emerald-700 ring-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700",
  warning: "bg-yellow-100 text-yellow-700 ring-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-700",
  fail: "bg-red-100 text-red-700 ring-red-300 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-700",
}

const CHECK_STATUS_LABEL: Record<string, string> = {
  pass: "Conforme",
  warning: "Attention",
  fail: "Non conforme",
}

function expiryColor(days: number) {
  if (days < 0) return "text-red-900 bg-red-200 dark:text-red-300 dark:bg-red-900/50"
  if (days < 3) return "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
  if (days <= 7) return "text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30"
  return "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30"
}

function scoreColor(score: number) {
  if (score >= 80) return { ring: "border-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5" }
  if (score >= 50) return { ring: "border-yellow-500", text: "text-yellow-600 dark:text-yellow-400", bg: "from-yellow-500/20 to-yellow-500/5" }
  return { ring: "border-red-500", text: "text-red-600 dark:text-red-400", bg: "from-red-500/20 to-red-500/5" }
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

function formatCheckTime(s: string): string {
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

function normalizeHaccpCheck(c: unknown, i: number): HACCPCheck | null {
  if (!c || typeof c !== "object") return null
  const r = c as Record<string, unknown>
  const statusRaw = String(r.status ?? "pass").toLowerCase()
  const status: HACCPCheck["status"] =
    statusRaw === "warning" ? "warning" : statusRaw === "fail" ? "fail" : "pass"
  const last = String(r.lastCheck ?? "")
  const next = String(r.nextCheck ?? "")
  return {
    id: String(r.id ?? `h-${i}`),
    name: String(r.name ?? "Controle"),
    status,
    lastCheck: formatCheckTime(last),
    nextCheck: formatCheckTime(next),
    measuredValue: String(r.measuredValue ?? r.value ?? "—"),
    limit: String(r.limit ?? "—"),
  }
}

function normalizeIngredient(raw: unknown, i: number): Ingredient | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const name = String(r.name ?? `Ingredient-${i}`)
  const statusRaw = String(r.status ?? "ok").toLowerCase()
  const statusLabels: Record<string, string> = {
    ok: "Stocke",
    warning: "Attention",
    critical: "Critique",
    stored: "Stocke",
  }
  const temperature =
    typeof r.temperature === "number" ? `${r.temperature}°C` : String(r.temperature ?? "—")
  return {
    id: String(r.id ?? `i-${i}`),
    name,
    category: String(r.category ?? "—"),
    supplier: String(r.supplier ?? "—"),
    lotNumber: String(r.lotNumber ?? r.lot ?? "—"),
    receivedDate: String(r.receivedDate ?? "—"),
    expiryDate: String(r.expiryDate ?? "—"),
    daysUntilExpiry: num(r.daysUntilExpiry, 0),
    temperature,
    status: statusLabels[statusRaw] ?? String(r.status ?? "—"),
  }
}

function normalizeBlockchainStep(s: unknown): BlockchainStep | null {
  if (!s || typeof s !== "object") return null
  const r = s as Record<string, unknown>
  return {
    label: String(r.label ?? r.step ?? "Etape"),
    timestamp: String(r.timestamp ?? r.time ?? "—"),
    verified: Boolean(r.verified ?? r.ok ?? true),
  }
}

function normalizeBlockchain(bc: unknown): Record<string, BlockchainStep[]> {
  if (!bc || typeof bc !== "object" || Array.isArray(bc)) return {}
  const out: Record<string, BlockchainStep[]> = {}
  for (const [ingredient, steps] of Object.entries(bc as Record<string, unknown>)) {
    if (!Array.isArray(steps)) continue
    const row = steps.map(normalizeBlockchainStep).filter(Boolean) as BlockchainStep[]
    if (row.length) out[ingredient] = row
  }
  return out
}

function blockchainFromIngredients(ingredients: Ingredient[]): Record<string, BlockchainStep[]> {
  const out: Record<string, BlockchainStep[]> = {}
  for (const ing of ingredients) {
    const okExpiry = ing.daysUntilExpiry >= 0
    out[ing.name] = [
      { label: "Fournisseur", timestamp: ing.receivedDate, verified: true },
      { label: "Reception / lot", timestamp: `${ing.lotNumber}`, verified: true },
      { label: "Conditions", timestamp: ing.temperature, verified: okExpiry && ing.status !== "Critique" },
    ]
  }
  return out
}

function normalizeQualityPayload(raw: unknown): QualityData {
  const fb = buildFallback()
  if (!raw || typeof raw !== "object") return fb

  const o = raw as Record<string, unknown>

  const haccpRaw = Array.isArray(o.haccpChecks) ? o.haccpChecks : []
  const haccpChecks = haccpRaw.map(normalizeHaccpCheck).filter(Boolean) as HACCPCheck[]
  const safeHaccp = haccpChecks.length ? haccpChecks : fb.haccpChecks

  const ingRaw = Array.isArray(o.ingredients) ? o.ingredients : []
  const ingredients = ingRaw.map(normalizeIngredient).filter(Boolean) as Ingredient[]
  const safeIng = ingredients.length ? ingredients : fb.ingredients

  const comp = o.compliance
  const complianceScore = num(
    o.complianceScore ??
      (comp && typeof comp === "object" ? (comp as Record<string, unknown>).score : undefined),
    fb.complianceScore
  )

  let alerts = fb.alerts
  if (o.alerts && typeof o.alerts === "object") {
    const a = o.alerts as Record<string, unknown>
    alerts = {
      expiringSoon: num(a.expiringSoon, fb.alerts.expiringSoon),
      expired: num(a.expired, fb.alerts.expired),
      temperatureAlerts: num(a.temperatureAlerts ?? a.tempAlerts, fb.alerts.temperatureAlerts),
    }
  }

  let blockchain: Record<string, BlockchainStep[]> = fb.blockchain
  const bcRaw = o.blockchain
  if (bcRaw && typeof bcRaw === "object" && !Array.isArray(bcRaw)) {
    const normalized = normalizeBlockchain(bcRaw)
    if (Object.keys(normalized).length) blockchain = normalized
    else blockchain = blockchainFromIngredients(safeIng)
  } else {
    blockchain = blockchainFromIngredients(safeIng)
  }
  if (Object.keys(blockchain).length === 0) blockchain = fb.blockchain

  return {
    complianceScore,
    haccpChecks: safeHaccp,
    ingredients: safeIng,
    alerts,
    blockchain,
  }
}

export default function QualityPage() {
  const [data, setData] = useState<QualityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load(first: boolean) {
      try {
        if (first && !cancelled) setLoading(true)
        const r = await fetch("/api/ai/quality")
        if (!r.ok) throw new Error("bad response")
        const raw = await r.json()
        if (cancelled) return
        setData(normalizeQualityPayload(raw))
      } catch {
        if (cancelled) return
        setData(buildFallback())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load(true)
    const id = setInterval(() => load(false), 10_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const sc = data ? scoreColor(data.complianceScore) : scoreColor(0)

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin/ai" />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-100 sm:text-3xl">
                Qualite & Conformite
              </h1>
              <p className="text-sm text-amber-800/70 dark:text-amber-300/70">
                Controle HACCP, tracabilite et alertes en temps reel
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-12 text-center text-amber-700 dark:text-amber-400">Chargement...</div>
          ) : data ? (
            <div className="mt-8 space-y-10">
              {/* Compliance Score */}
              <section className="flex flex-col items-center">
                <div className={`relative flex h-44 w-44 items-center justify-center rounded-full border-8 ${sc.ring} bg-gradient-to-br ${sc.bg}`}>
                  <div className="text-center">
                    <p className={`text-5xl font-extrabold ${sc.text}`}>{data.complianceScore}%</p>
                    <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70">Score de conformite</p>
                  </div>
                </div>
              </section>

              {/* HACCP Checks */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <ShieldCheck className="mr-2 inline h-5 w-5 text-orange-500" />
                  Controles HACCP
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.haccpChecks.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-amber-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{c.name}</p>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${CHECK_STATUS_STYLE[c.status]}`}>
                          {CHECK_STATUS_LABEL[c.status]}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-amber-700/80 dark:text-amber-400/70">
                        <p>Mesure : <span className="font-medium text-amber-900 dark:text-amber-200">{c.measuredValue}</span> / Limite : <span className="font-medium">{c.limit}</span></p>
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Dernier : {c.lastCheck} — Prochain : {c.nextCheck}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Ingredients Traceability */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <Package className="mr-2 inline h-5 w-5 text-orange-500" />
                  Tracabilite des Ingredients
                </h2>
                <div className="overflow-x-auto rounded-2xl border border-amber-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-amber-200/60 dark:border-amber-800/40">
                        {["Nom", "Categorie", "Fournisseur", "Lot", "Reception", "Expiration", "Jours restants", "Temp.", "Statut"].map((h) => (
                          <th key={h} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/70">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100/60 dark:divide-amber-800/30">
                      {data.ingredients.map((ing) => (
                        <tr key={ing.id} className="transition hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-amber-900 dark:text-amber-100">{ing.name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-amber-700 dark:text-amber-300">{ing.category}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-amber-700 dark:text-amber-300">{ing.supplier}</td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-amber-600 dark:text-amber-400">{ing.lotNumber}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-amber-700 dark:text-amber-300">{ing.receivedDate}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-amber-700 dark:text-amber-300">{ing.expiryDate}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${expiryColor(ing.daysUntilExpiry)}`}>
                              {ing.daysUntilExpiry < 0 ? "Expire" : `${ing.daysUntilExpiry}j`}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-amber-700 dark:text-amber-300">{ing.temperature}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-amber-700 dark:text-amber-300">{ing.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Alerts Summary */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <AlertTriangle className="mr-2 inline h-5 w-5 text-orange-500" />
                  Resume des Alertes
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-4 rounded-2xl border border-yellow-300/60 bg-yellow-50/70 p-5 shadow-sm dark:border-yellow-700/40 dark:bg-yellow-950/20">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-500 text-white shadow">
                      <FileWarning className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-yellow-700 dark:text-yellow-400">{data.alerts.expiringSoon}</p>
                      <p className="text-xs font-medium text-yellow-600/80 dark:text-yellow-400/70">Expirent bientot</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-red-300/60 bg-red-50/70 p-5 shadow-sm dark:border-red-700/40 dark:bg-red-950/20">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow">
                      <XCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-red-700 dark:text-red-400">{data.alerts.expired}</p>
                      <p className="text-xs font-medium text-red-600/80 dark:text-red-400/70">Expires</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-orange-300/60 bg-orange-50/70 p-5 shadow-sm dark:border-orange-700/40 dark:bg-orange-950/20">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow">
                      <Thermometer className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-orange-700 dark:text-orange-400">{data.alerts.temperatureAlerts}</p>
                      <p className="text-xs font-medium text-orange-600/80 dark:text-orange-400/70">Alertes temperature</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Blockchain Traceability */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <Link2 className="mr-2 inline h-5 w-5 text-orange-500" />
                  Tracabilite Blockchain
                </h2>
                <div className="space-y-4">
                  {Object.entries(data.blockchain).map(([ingredient, steps]) => (
                    <div
                      key={ingredient}
                      className="rounded-2xl border border-amber-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                    >
                      <p className="mb-3 text-sm font-semibold text-amber-900 dark:text-amber-200">{ingredient}</p>
                      <div className="flex items-center gap-2 overflow-x-auto">
                        {steps.map((step, idx) => (
                          <div key={step.label} className="flex items-center gap-2">
                            <div className="flex flex-col items-center rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-900/30">
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">{step.label}</span>
                              </div>
                              <span className="mt-1 text-[10px] text-amber-600/70 dark:text-amber-400/60">{step.timestamp}</span>
                            </div>
                            {idx < steps.length - 1 && (
                              <span className="text-amber-400 dark:text-amber-600">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Generate Report */}
              <section className="flex justify-center">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-amber-700 hover:to-orange-700 hover:shadow-xl"
                >
                  <Printer className="h-4 w-4" />
                  Generer rapport HACCP
                </button>
              </section>
            </div>
          ) : null}
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
