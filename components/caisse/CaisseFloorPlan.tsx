"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  BellRing,
  Clock,
  Combine,
  PackageOpen,
  QrCode,
  Receipt,
  Search,
  Split,
  Users,
  Wallet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { JANNAT_TABLE_ZONES, ZONE_LABELS_FR } from "@/lib/admin/restaurant-tables"
import { cn } from "@/lib/utils"
import { RealtimeIndicator } from "@/components/realtime/RealtimeIndicator"

export type FloorTable = {
  table_id?: number
  table_number?: number
  table_code?: string | null
  display_name?: string | null
  is_active?: boolean
  zone?: string
  restaurant_status?: string | null
  payment_stage?: string
  payment_status_label?: string
  payment_status_code?: string
  has_payment_request_alert?: boolean
  payment_request_count?: number
  payment_request_latest_at?: string | null
  has_cashier_call_alert?: boolean
  cashier_call_count?: number
  cashier_call_latest_at?: string | null
  merged_count?: number
  merged_from_table_ids?: number[]
  guests_or_sessions_count?: number
  session?: {
    id?: string
    total?: number
    total_original?: number
    paid_amount?: number
    remaining_amount?: number
    discount_amount?: number
    hospitality_amount?: number
    cancelled_amount?: number
    opened_at?: string | null
    payment_method?: string | null
  } | null
}

type StatusKey =
  | "FREE"
  | "OCCUPIED"
  | "ORDER_IN_PROGRESS"
  | "READY_TO_PAY"
  | "PAYMENT_REQUESTED"
  | "PAID"
  | "UNPAID"
  | "PARTIAL"
  | "CLOSED"

type StatusMeta = {
  label: string
  short: string
  ring: string
  badge: string
  dot: string
  accent: string
  glow?: string
}

const STATUS_META: Record<StatusKey, StatusMeta> = {
  FREE: {
    label: "Libre",
    short: "Libre",
    ring: "border-emerald-200/70 hover:border-emerald-300",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200/80 dark:bg-emerald-900/40 dark:text-emerald-100",
    dot: "bg-emerald-500",
    accent: "from-emerald-50/70 via-white to-white",
  },
  OCCUPIED: {
    label: "Occupée",
    short: "Occupée",
    ring: "border-amber-200/80 hover:border-amber-300",
    badge: "bg-amber-100 text-amber-900 border-amber-200/80 dark:bg-amber-900/40 dark:text-amber-100",
    dot: "bg-amber-500",
    accent: "from-amber-50/70 via-white to-white",
  },
  ORDER_IN_PROGRESS: {
    label: "Commande en cours",
    short: "En cours",
    ring: "border-blue-200/80 hover:border-blue-300",
    badge: "bg-blue-100 text-blue-800 border-blue-200/80 dark:bg-blue-900/40 dark:text-blue-100",
    dot: "bg-blue-500",
    accent: "from-blue-50/70 via-white to-white",
  },
  READY_TO_PAY: {
    label: "Prête à payer",
    short: "Prête",
    ring: "border-cyan-200/80 hover:border-cyan-300",
    badge: "bg-cyan-100 text-cyan-800 border-cyan-200/80 dark:bg-cyan-900/40 dark:text-cyan-100",
    dot: "bg-cyan-500",
    accent: "from-cyan-50/70 via-white to-white",
  },
  PAYMENT_REQUESTED: {
    label: "Demande addition",
    short: "Addition",
    ring: "border-orange-300 ring-2 ring-orange-300/50 hover:ring-orange-400/70",
    badge:
      "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/40 dark:text-orange-100 animate-pulse",
    dot: "bg-orange-500 animate-pulse",
    accent: "from-orange-50/80 via-white to-white",
    glow: "shadow-[0_0_0_4px_rgba(251,146,60,0.15)]",
  },
  PARTIAL: {
    label: "Paiement partiel",
    short: "Partiel",
    ring: "border-purple-200/80 hover:border-purple-300",
    badge: "bg-purple-100 text-purple-800 border-purple-200/80 dark:bg-purple-900/40 dark:text-purple-100",
    dot: "bg-purple-500",
    accent: "from-purple-50/70 via-white to-white",
  },
  PAID: {
    label: "Payée",
    short: "Payée",
    ring: "border-emerald-300/80 hover:border-emerald-400",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100",
    dot: "bg-emerald-500",
    accent: "from-emerald-50/80 via-white to-white",
  },
  UNPAID: {
    label: "Non payée",
    short: "Non payée",
    ring: "border-rose-200/80 hover:border-rose-300",
    badge: "bg-rose-100 text-rose-800 border-rose-200/80 dark:bg-rose-900/40 dark:text-rose-100",
    dot: "bg-rose-500",
    accent: "from-rose-50/70 via-white to-white",
  },
  CLOSED: {
    label: "Fermée",
    short: "Fermée",
    ring: "border-neutral-200 hover:border-neutral-300",
    badge: "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200",
    dot: "bg-neutral-400",
    accent: "from-neutral-50 via-white to-white",
  },
}

function nf(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return "—"
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

function elapsed(opened?: string | null) {
  if (!opened) return null
  const startMs = Date.parse(opened)
  if (!Number.isFinite(startMs)) return null
  const diff = Math.max(0, Date.now() - startMs)
  const m = Math.floor(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${h}h${String(r).padStart(2, "0")}`
}

export function CaisseFloorPlan({
  tables,
  isAdminLike,
  onOpenTable,
}: {
  tables: FloorTable[]
  isAdminLike: boolean
  onOpenTable: (table: FloorTable) => void
}) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [zoneFilter, setZoneFilter] = useState<string>("ALL")
  const [search, setSearch] = useState("")
  const [, forceTick] = useState(0)

  // Re-render every 30 s pour rafraîchir le compteur de durée d'occupation.
  useEffect(() => {
    const id = window.setInterval(() => forceTick((x) => x + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const zones = useMemo(() => {
    const set = new Set<string>()
    for (const t of tables) {
      if (t.zone) set.add(String(t.zone))
    }
    const ordered = JANNAT_TABLE_ZONES.filter((z) => set.has(z))
    const rest = Array.from(set).filter((z) => !ordered.includes(z as (typeof JANNAT_TABLE_ZONES)[number])).sort()
    return [...ordered, ...rest]
  }, [tables])

  const counters = useMemo(() => {
    const acc = {
      all: tables.length,
      FREE: 0,
      OCCUPIED: 0,
      ORDER_IN_PROGRESS: 0,
      PAYMENT_REQUESTED: 0,
      PARTIAL: 0,
      PAID: 0,
      UNPAID: 0,
    } as Record<string, number>
    for (const t of tables) {
      const c = String(t.payment_status_code ?? "").toUpperCase()
      if (c in acc) acc[c] = (acc[c] ?? 0) + 1
    }
    return acc
  }, [tables])

  const totalRevenue = useMemo(
    () => tables.reduce((sum, t) => sum + Number(t.session?.total ?? 0), 0),
    [tables],
  )
  const totalRemaining = useMemo(
    () => tables.reduce((sum, t) => sum + Number(t.session?.remaining_amount ?? 0), 0),
    [tables],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tables.filter((t) => {
      const code = String(t.payment_status_code ?? "").toUpperCase()
      if (statusFilter === "BUSY") {
        if (code === "FREE") return false
      } else if (statusFilter !== "ALL" && code !== statusFilter) {
        return false
      }
      if (zoneFilter !== "ALL" && String(t.zone ?? "") !== zoneFilter) return false
      if (q) {
        const hay = `${t.table_number ?? ""} ${t.display_name ?? ""} ${t.table_code ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [tables, statusFilter, zoneFilter, search])

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        {/* Filtres + stats rapides */}
        <div className="flex flex-col gap-3 rounded-2xl border bg-white/80 p-3 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (n°, nom, QR)…"
                className="h-9 pl-8"
              />
            </div>
            <div className="hidden flex-wrap items-center gap-3 text-[11px] text-muted-foreground sm:flex">
              <RealtimeIndicator />
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 dark:bg-neutral-900">
                <Banknote className="h-3 w-3 text-emerald-600" />
                <strong className="text-neutral-800 dark:text-neutral-100">{nf(totalRevenue)} €</strong> en salle
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 dark:bg-neutral-900">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <strong className="text-neutral-800 dark:text-neutral-100">{nf(totalRemaining)} €</strong> à encaisser
              </span>
            </div>
            {isAdminLike ? (
              <Button asChild size="sm" variant="outline" className="ml-auto h-9">
                <Link href="/admin/tables-qr">Gérer QR</Link>
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Chip label={`Tout · ${counters.all}`} active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} />
            <Chip
              label={`Libres · ${counters.FREE}`}
              dotClass="bg-emerald-500"
              active={statusFilter === "FREE"}
              onClick={() => setStatusFilter("FREE")}
            />
            <Chip
              label={`Occupées · ${counters.OCCUPIED + counters.ORDER_IN_PROGRESS + counters.UNPAID + counters.PARTIAL + counters.PAYMENT_REQUESTED}`}
              dotClass="bg-amber-500"
              active={statusFilter === "BUSY"}
              onClick={() => setStatusFilter("BUSY")}
            />
            <Chip
              label={`En cours · ${counters.ORDER_IN_PROGRESS}`}
              dotClass="bg-blue-500"
              active={statusFilter === "ORDER_IN_PROGRESS"}
              onClick={() => setStatusFilter("ORDER_IN_PROGRESS")}
            />
            <Chip
              label={`Addition · ${counters.PAYMENT_REQUESTED}`}
              dotClass="bg-orange-500 animate-pulse"
              active={statusFilter === "PAYMENT_REQUESTED"}
              onClick={() => setStatusFilter("PAYMENT_REQUESTED")}
            />
            <Chip
              label={`Partiel · ${counters.PARTIAL}`}
              dotClass="bg-purple-500"
              active={statusFilter === "PARTIAL"}
              onClick={() => setStatusFilter("PARTIAL")}
            />
            <Chip
              label={`Payées · ${counters.PAID}`}
              dotClass="bg-emerald-500"
              active={statusFilter === "PAID"}
              onClick={() => setStatusFilter("PAID")}
            />
          </div>

          {zones.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Zone
              </span>
              <Chip label="Toutes" active={zoneFilter === "ALL"} onClick={() => setZoneFilter("ALL")} />
              {zones.map((z) => (
                <Chip key={z} label={ZONE_LABELS_FR[z] ?? z} active={zoneFilter === z} onClick={() => setZoneFilter(z)} />
              ))}
            </div>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white/60 p-10 text-center text-sm text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900/40">
            Aucune table ne correspond aux filtres.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((t) => (
              <TableCard
                key={`${t.table_id ?? t.table_number}`}
                t={t}
                onOpen={() => onOpenTable(t)}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

function Chip({
  label,
  active,
  onClick,
  dotClass,
}: {
  label: string
  active?: boolean
  onClick?: () => void
  dotClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition",
        active
          ? "border-[color:var(--lux-bordeaux)]/30 bg-[color:var(--lux-bordeaux)]/10 text-[color:var(--lux-bordeaux)] shadow-sm"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
      )}
    >
      {dotClass ? <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} /> : null}
      {label}
    </button>
  )
}

function TableCard({
  t,
  onOpen,
}: {
  t: FloorTable
  onOpen: () => void
}) {
  const code = (String(t.payment_status_code ?? "FREE").toUpperCase() as StatusKey)
  const meta = STATUS_META[code] ?? STATUS_META.FREE
  const total = Number(t.session?.total ?? 0)
  const paid = Number(t.session?.paid_amount ?? 0)
  const remaining = Number(t.session?.remaining_amount ?? Math.max(0, total - paid))
  const guests = Number(t.guests_or_sessions_count ?? 0)
  const isMerged = (t.merged_count ?? 0) > 0
  const elapsedLabel = elapsed(t.session?.opened_at ?? null)
  const sessionId = t.session?.id ? String(t.session.id) : null
  const hasAlert = Boolean(t.has_payment_request_alert) || Boolean(t.has_cashier_call_alert)
  const progressPaid = total > 0.001 ? Math.min(100, Math.round((paid / total) * 100)) : 0

  const openDetail = onOpen

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-gradient-to-b p-3.5 shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md focus-within:-translate-y-0.5",
        meta.ring,
        meta.accent,
        meta.glow,
        t.is_active === false && "opacity-60",
      )}
    >
      {/* En-tête : numéro, zone, statut */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-white/70 bg-white/80 text-[color:var(--lux-bordeaux)] shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-800/80">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Table
            </span>
            <span className="-mt-0.5 text-lg font-bold leading-none">{t.table_code ?? t.table_number}</span>
          </div>
          <div className="flex flex-col gap-1">
            {t.zone ? (
              <Badge
                variant="outline"
                className="w-fit gap-1 border-neutral-300/70 bg-white/80 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-200"
              >
                {ZONE_LABELS_FR[t.zone] ?? t.zone}
              </Badge>
            ) : null}
            {t.display_name ? (
              <span className="line-clamp-1 max-w-[10rem] text-[11px] text-neutral-600 dark:text-neutral-400">
                {t.display_name}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              meta.badge,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.short}
          </span>
          {isMerged ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-100">
                  <Combine className="h-3 w-3" /> Fusion +{t.merged_count}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {(t.merged_from_table_ids ?? []).length > 0
                  ? `Fusionnée depuis table ${(t.merged_from_table_ids ?? []).join(", table ")}`
                  : `Fusion de ${t.merged_count} session${(t.merged_count ?? 0) > 1 ? "s" : ""}`}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>

      {/* Métriques compactes */}
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/60 bg-white/70 p-2 text-[11px] dark:border-neutral-800 dark:bg-neutral-900/60">
        <Metric icon={<Users className="h-3.5 w-3.5" />} value={guests || (sessionId ? 1 : 0)} label="invités" />
        <Metric
          icon={<Clock className="h-3.5 w-3.5" />}
          value={elapsedLabel ?? (sessionId ? "—" : "0")}
          label="durée"
        />
        <Metric
          icon={<Banknote className="h-3.5 w-3.5" />}
          value={`${nf(total)} €`}
          label="total"
          emphasis
        />
      </div>

      {sessionId && total > 0.001 ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-500">Payé</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              {nf(paid)} € · {progressPaid}%
            </span>
          </div>
          <Progress
            value={progressPaid}
            className={cn(
              "h-1.5 bg-neutral-200/70 dark:bg-neutral-800",
              code === "PAID"
                ? "[&_[data-slot=progress-indicator]]:bg-emerald-500"
                : code === "PARTIAL"
                  ? "[&_[data-slot=progress-indicator]]:bg-purple-500"
                  : "[&_[data-slot=progress-indicator]]:bg-amber-500",
            )}
          />
          {remaining > 0.001 ? (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">Reste</span>
              <span className="font-semibold text-amber-700 dark:text-amber-300">{nf(remaining)} €</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasAlert ? (
        <div className="flex flex-wrap gap-1.5">
          {t.has_payment_request_alert ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-900 dark:bg-orange-900/40 dark:text-orange-100">
              <BellRing className="h-3 w-3 animate-pulse" /> Addition ({t.payment_request_count ?? 1})
            </span>
          ) : null}
          {t.has_cashier_call_alert ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              <BellRing className="h-3 w-3 animate-pulse" /> Caisse ({t.cashier_call_count ?? 1})
            </span>
          ) : null}
        </div>
      ) : null}

      {t.is_active === false ? (
        <div className="inline-flex w-fit items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-100">
          <AlertTriangle className="h-3 w-3" /> Désactivée
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-auto grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {sessionId ? (
          <ActionButton
            icon={<Receipt className="h-3.5 w-3.5" />}
            label="Détail"
            onClick={openDetail}
            primary
          />
        ) : (
          <ActionButton
            icon={<PackageOpen className="h-3.5 w-3.5" />}
            label="Ouvrir"
            onClick={openDetail}
            primary
          />
        )}
        <ActionButton icon={<Wallet className="h-3.5 w-3.5" />} label="Encaisser" href="/pos" />
        <ActionButton
          icon={<Split className="h-3.5 w-3.5" />}
          label="Split"
          onClick={openDetail}
          disabled={!sessionId}
        />
        <ActionButton
          icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
          label="Transfert"
          onClick={openDetail}
          disabled={!sessionId}
        />
      </div>

      {t.table_code ? (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <QrCode className="h-3 w-3" /> {t.table_code}
        </div>
      ) : null}
    </div>
  )
}

function Metric({
  icon,
  value,
  label,
  emphasis,
}: {
  icon: ReactNode
  value: ReactNode
  label: string
  emphasis?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 text-center">
      <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "text-xs font-semibold text-neutral-800 dark:text-neutral-100",
          emphasis && "text-sm",
        )}
      >
        {value}
      </div>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  href,
  onClick,
  disabled,
  primary,
}: {
  icon: ReactNode
  label: string
  href?: string
  onClick?: () => void
  disabled?: boolean
  primary?: boolean
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition",
    disabled
      ? "cursor-not-allowed opacity-40 border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"
      : primary
        ? "border-[color:var(--lux-bordeaux)]/30 bg-[color:var(--lux-bordeaux)]/10 text-[color:var(--lux-bordeaux)] hover:bg-[color:var(--lux-bordeaux)]/15"
        : "border-neutral-200 bg-white/80 text-neutral-700 hover:border-[color:var(--lux-bordeaux)]/40 hover:bg-[color:var(--lux-bordeaux)]/5 hover:text-[color:var(--lux-bordeaux)] dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-200",
  )
  if (disabled) {
    return (
      <span className={cls} aria-disabled>
        {icon}
        {label}
      </span>
    )
  }
  if (href) {
    return (
      <Link href={href} className={cls}>
        {icon}
        {label}
      </Link>
    )
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {icon}
      {label}
    </button>
  )
}
