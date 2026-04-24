"use client"

import { useMemo } from "react"
import Link from "next/link"
import { BellRing, ChefHat, HandPlatter, Receipt, Utensils } from "lucide-react"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { SiteHeader } from "@/components/site/SiteHeader"
import { cn } from "@/lib/utils"
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders"
import { useTableAlerts } from "@/lib/hooks/useTableAlerts"
import {
  computeTableSnapshot,
  TABLE_STATUS_META,
  TONE_BADGE,
  TONE_CARD,
} from "@/lib/table-status"

const ZONES: Record<string, { label: string; color: string }> = {
  interieur: { label: "Interieur", color: "text-blue-600 dark:text-blue-400" },
  terrasse: { label: "Terrasse", color: "text-amber-600 dark:text-amber-400" },
  vip: { label: "VIP", color: "text-purple-600 dark:text-purple-400" },
  gaming: { label: "Gaming", color: "text-rose-600 dark:text-rose-400" },
}

function getZone(tableId: number): string {
  if (tableId <= 8) return "interieur"
  if (tableId <= 14) return "terrasse"
  if (tableId <= 17) return "vip"
  return "gaming"
}

const TABLE_IDS = Array.from({ length: 20 }, (_, i) => i + 1)

export default function ServerIndexPage() {
  const { orders } = useRealtimeOrders()
  const { alerts } = useTableAlerts()

  const snapshots = useMemo(
    () => TABLE_IDS.map((id) => computeTableSnapshot(id, orders, alerts)),
    [orders, alerts],
  )

  const counters = useMemo(() => {
    const c = { libres: 0, actives: 0, aServir: 0, alertes: 0 }
    snapshots.forEach((s) => {
      if (s.status === "FREE") c.libres += 1
      else c.actives += 1
      if (s.status === "READY") c.aServir += 1
      if (s.hasCallAlert || s.hasBillAlert) c.alertes += 1
    })
    return c
  }, [snapshots])

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/admin" backLabel="Admin" hideMainNav />

        <div className="mx-auto max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Plan de salle — Service
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Statut en direct, alertes QR, commandes prêtes à servir
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Libres" value={counters.libres} tone="green" />
            <SummaryCard label="Actives" value={counters.actives} tone="yellow" />
            <SummaryCard label="À servir" value={counters.aServir} tone="blue" icon={ChefHat} />
            <SummaryCard label="Alertes" value={counters.alertes} tone="red" icon={BellRing} />
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              ["FREE", "ORDERING", "IN_KITCHEN", "READY", "SERVED", "PAYMENT_REQUESTED", "CALL_SERVER", "PAID"] as const
            ).map((s) => {
              const meta = TABLE_STATUS_META[s]
              return (
                <span
                  key={s}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                    TONE_BADGE[meta.tone],
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  {meta.label}
                </span>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {snapshots.map((snap) => {
              const zone = ZONES[getZone(snap.tableId)]
              const meta = TABLE_STATUS_META[snap.status]
              return (
                <Link
                  key={snap.tableId}
                  href={`/server/${snap.tableId}`}
                  className={cn(
                    "group relative flex flex-col items-center gap-2 rounded-2xl border p-4 shadow-sm transition",
                    "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                    TONE_CARD[meta.tone],
                  )}
                >
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{snap.tableId}</span>
                  <span className={cn("text-xs font-medium", zone.color)}>{zone.label}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      TONE_BADGE[meta.tone],
                    )}
                  >
                    {meta.short}
                  </span>
                  {snap.total > 0 ? (
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {snap.total.toFixed(2)}€
                    </span>
                  ) : null}

                  <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                    {snap.hasCallAlert ? (
                      <span className="rounded-full bg-red-500 p-1 text-white shadow" title="Appel serveur">
                        <HandPlatter className="h-3 w-3" />
                      </span>
                    ) : null}
                    {snap.hasBillAlert ? (
                      <span className="rounded-full bg-rose-500 p-1 text-white shadow" title="Addition">
                        <Receipt className="h-3 w-3" />
                      </span>
                    ) : null}
                    {snap.activeOrders.some((o) => o.status === "ready") ? (
                      <span className="rounded-full bg-blue-500 p-1 text-white shadow" title="Commande prête">
                        <Utensils className="h-3 w-3" />
                      </span>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
        <AIAgentBadge context="server" />
      </PageShell>
    </RequireAuth>
  )
}

function SummaryCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string
  value: number
  tone: keyof typeof TONE_BADGE
  icon?: React.ElementType
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm",
        TONE_CARD[tone],
      )}
    >
      {Icon ? (
        <div className={cn("rounded-full p-2", TONE_BADGE[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}
