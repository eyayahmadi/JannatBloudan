"use client"

import { useMemo } from "react"
import { BellRing, Clock, CreditCard, ExternalLink, ListChecks, Receipt, Table2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientPreviewDialog } from "@/components/admin/ClientPreviewDialog"
import { resolveClientPreviewUrl } from "@/lib/admin/restaurant-tables"
import { cn } from "@/lib/utils"

/**
 * Liste compacte des tables « à encaisser » (paiement demandé, partiel, non
 * payé). Affichée dans l'onglet Synthèse de /caisse pour permettre au
 * caissier de sauter directement sur les tables prioritaires sans passer par
 * le plan visuel.
 */

type PaymentStatusCode =
  | "FREE"
  | "OCCUPIED"
  | "ORDER_IN_PROGRESS"
  | "READY_TO_PAY"
  | "PAYMENT_REQUESTED"
  | "PAID"
  | "UNPAID"
  | "PARTIAL"
  | "CLOSED"

export type TableRow = {
  table_id?: number
  table_number?: number
  table_code?: string | null
  display_name?: string | null
  is_active?: boolean
  zone?: string
  restaurant_status?: string
  payment_stage?: string
  payment_status_label?: string
  /**
   * Code de statut de paiement. Largement typé en `string` pour matcher les
   * payloads bruts de l'API (qui inclut potentiellement d'autres états),
   * mais on n'utilise que les valeurs de `PaymentStatusCode` ci-dessus.
   */
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
  } | null
}

type Props = {
  tables: TableRow[]
  onOpenTable: (t: TableRow) => void
  /** Si défini, n'affiche que les N premières lignes prioritaires. */
  limit?: number
  /** Affiche le titre / cadre Card (par défaut true). */
  card?: boolean
  className?: string
  onSeeAll?: () => void
}

/** Code à encaisser : on inclut tout ce qui n'est ni FREE ni PAID/CLOSED. */
const TO_CASH_CODES: PaymentStatusCode[] = [
  "PAYMENT_REQUESTED",
  "PARTIAL",
  "UNPAID",
  "READY_TO_PAY",
]

/** Ordre de priorité (plus petit = plus urgent). */
const PRIORITY: Record<PaymentStatusCode, number> = {
  PAYMENT_REQUESTED: 0,
  PARTIAL: 1,
  UNPAID: 2,
  READY_TO_PAY: 3,
  ORDER_IN_PROGRESS: 4,
  OCCUPIED: 5,
  FREE: 9,
  PAID: 9,
  CLOSED: 9,
}

const STATUS_BADGE: Record<PaymentStatusCode, string> = {
  PAYMENT_REQUESTED: "bg-amber-600 text-white",
  PARTIAL: "bg-violet-600 text-white",
  UNPAID: "bg-rose-600 text-white",
  READY_TO_PAY: "bg-sky-600 text-white",
  ORDER_IN_PROGRESS: "bg-slate-500 text-white",
  OCCUPIED: "bg-slate-400 text-white",
  FREE: "bg-emerald-600 text-white",
  PAID: "bg-emerald-700 text-white",
  CLOSED: "bg-neutral-500 text-white",
}

const STATUS_LABEL: Record<PaymentStatusCode, string> = {
  PAYMENT_REQUESTED: "Paiement demandé",
  PARTIAL: "Paiement partiel",
  UNPAID: "Non payée",
  READY_TO_PAY: "Prête à payer",
  ORDER_IN_PROGRESS: "Commande en cours",
  OCCUPIED: "Occupée",
  FREE: "Libre",
  PAID: "Payée",
  CLOSED: "Fermée",
}

function formatEuro(n?: number | null) {
  const v = Number(n ?? 0)
  return `${v.toFixed(2)} €`
}

function formatElapsed(opened?: string | null) {
  if (!opened) return null
  const ms = Date.now() - new Date(opened).getTime()
  if (!Number.isFinite(ms) || ms < 0) return null
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const r = min % 60
  return r === 0 ? `${h} h` : `${h} h ${r} min`
}

export function TablesToCashList({
  tables,
  onOpenTable,
  limit,
  card = true,
  className,
  onSeeAll,
}: Props) {
  const items = useMemo(() => {
    const filtered = (tables ?? []).filter((t) => {
      const code = String(t.payment_status_code ?? "FREE") as PaymentStatusCode
      return (TO_CASH_CODES as readonly string[]).includes(code)
    })
    filtered.sort((a, b) => {
      const ca = String(a.payment_status_code ?? "FREE") as PaymentStatusCode
      const cb = String(b.payment_status_code ?? "FREE") as PaymentStatusCode
      const pa = PRIORITY[ca] ?? 9
      const pb = PRIORITY[cb] ?? 9
      if (pa !== pb) return pa - pb
      const ra = Number(a.session?.remaining_amount ?? 0)
      const rb = Number(b.session?.remaining_amount ?? 0)
      return rb - ra
    })
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered
  }, [tables, limit])

  const totals = useMemo(() => {
    let remaining = 0
    let count = 0
    let requested = 0
    for (const t of items) {
      remaining += Number(t.session?.remaining_amount ?? 0)
      count += 1
      if (t.has_payment_request_alert) requested += 1
    }
    return { remaining: Math.round(remaining * 100) / 100, count, requested }
  }, [items])

  const body = (
    <>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Receipt className="h-4 w-4" />
          Aucune table à encaisser pour le moment.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((t) => {
            const code = String(t.payment_status_code ?? "OCCUPIED") as PaymentStatusCode
            const elapsed = formatElapsed(t.session?.opened_at ?? null)
            const tableLabel =
              t.display_name?.trim() ||
              (t.table_number != null ? `Table ${t.table_number}` : "Table")
            return (
              <li
                key={String(t.table_id ?? t.table_number ?? Math.random())}
                className="flex flex-wrap items-center gap-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={cn("border-0 px-1.5", STATUS_BADGE[code])}>
                      {STATUS_LABEL[code]}
                    </Badge>
                    <span className="font-medium">
                      <Table2 className="mr-1 inline h-3.5 w-3.5" />
                      {tableLabel}
                    </span>
                    {t.zone ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t.zone}
                      </span>
                    ) : null}
                    {t.has_payment_request_alert ? (
                      <Badge variant="outline" className="gap-1 border-amber-400 text-amber-700 dark:text-amber-300">
                        <BellRing className="h-3 w-3 animate-pulse" />
                        Addition demandée
                      </Badge>
                    ) : null}
                    {t.has_cashier_call_alert ? (
                      <Badge variant="outline" className="gap-1 border-rose-400 text-rose-700 dark:text-rose-300">
                        <BellRing className="h-3 w-3" />
                        Appel caisse
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {t.guests_or_sessions_count && t.guests_or_sessions_count > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t.guests_or_sessions_count}
                      </span>
                    ) : null}
                    {elapsed ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {elapsed}
                      </span>
                    ) : null}
                    {t.merged_count && t.merged_count > 0 ? (
                      <span>
                        <ListChecks className="mr-0.5 inline h-3 w-3" />
                        {t.merged_count} fusion(s)
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-0.5 text-right tabular-nums">
                  <span className="text-sm font-semibold">
                    {formatEuro(t.session?.remaining_amount)}
                  </span>
                  {(t.session?.paid_amount ?? 0) > 0.001 ? (
                    <span className="text-[11px] text-muted-foreground">
                      payé {formatEuro(t.session?.paid_amount)} / {formatEuro(t.session?.total)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      total {formatEuro(t.session?.total)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {(() => {
                    const previewUrl = resolveClientPreviewUrl({
                      id: t.table_id ?? null,
                      table_code: t.table_code ?? null,
                      table_number: t.table_number ?? null,
                    })
                    return previewUrl ? (
                      <ClientPreviewDialog
                        url={previewUrl}
                        label={tableLabel}
                        triggerLabel="Vue client"
                        variant="ghost"
                        size="sm"
                      />
                    ) : null
                  })()}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => onOpenTable(t)}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Encaisser
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )

  if (!card) {
    return <div className={cn("space-y-2", className)}>{body}</div>
  }

  return (
    <Card className={cn("border-amber-200/70 dark:border-amber-800/60", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4 text-amber-700 dark:text-amber-300" />
          Tables à encaisser
          {totals.count > 0 ? (
            <Badge variant="secondary" className="ml-1">
              {totals.count}
            </Badge>
          ) : null}
          {totals.requested > 0 ? (
            <Badge className="bg-amber-600 text-white">
              {totals.requested} demande{totals.requested > 1 ? "s" : ""}
            </Badge>
          ) : null}
        </CardTitle>
        <div className="flex items-center gap-2">
          {totals.count > 0 ? (
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {formatEuro(totals.remaining)} restant
            </span>
          ) : null}
          {onSeeAll ? (
            <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={onSeeAll}>
              <ExternalLink className="h-3.5 w-3.5" />
              Plan
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{body}</CardContent>
    </Card>
  )
}
