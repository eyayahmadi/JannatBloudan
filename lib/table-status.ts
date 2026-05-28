import type { KitchenOrder } from "@/lib/hooks/useRealtimeOrders"
import type { TableAlert } from "@/lib/hooks/useTableAlerts"

export type TableStatus =
  | "FREE"
  | "OCCUPIED"
  | "ORDERING"
  | "IN_KITCHEN"
  | "READY"
  | "SERVED"
  | "PAYMENT_REQUESTED"
  | "PAID"
  | "CALL_SERVER"

export type TableTone = "green" | "yellow" | "orange" | "blue" | "red" | "gray" | "indigo" | "rose"

export const TABLE_STATUS_META: Record<
  TableStatus,
  { label: string; short: string; tone: TableTone; priority: number }
> = {
  FREE: { label: "Libre", short: "Libre", tone: "green", priority: 0 },
  OCCUPIED: { label: "Occupee", short: "Occupee", tone: "yellow", priority: 1 },
  ORDERING: { label: "Commande en cours", short: "Commande", tone: "yellow", priority: 2 },
  IN_KITCHEN: { label: "En cuisine", short: "Cuisine", tone: "orange", priority: 3 },
  READY: { label: "Pret a servir", short: "Pret", tone: "blue", priority: 4 },
  SERVED: { label: "En cours de repas", short: "Repas", tone: "indigo", priority: 5 },
  CALL_SERVER: { label: "Appel serveur", short: "Appel", tone: "red", priority: 9 },
  PAYMENT_REQUESTED: { label: "Paiement demande", short: "Addition", tone: "rose", priority: 8 },
  PAID: { label: "Payee", short: "Payee", tone: "gray", priority: 6 },
}

export const TONE_CARD: Record<TableTone, string> = {
  green: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800/40 dark:bg-emerald-950/30",
  yellow: "border-yellow-300 bg-yellow-50/90 dark:border-yellow-700/50 dark:bg-yellow-950/30",
  orange: "border-orange-300 bg-orange-50/90 dark:border-orange-700/50 dark:bg-orange-950/30",
  blue: "border-blue-300 bg-blue-50/90 dark:border-blue-800/50 dark:bg-blue-950/30",
  indigo: "border-indigo-200 bg-indigo-50/80 dark:border-indigo-800/40 dark:bg-indigo-950/30",
  rose: "border-rose-300 bg-rose-50/90 dark:border-rose-800/50 dark:bg-rose-950/30 animate-pulse",
  red: "border-red-400 bg-red-50 dark:border-red-700/60 dark:bg-red-950/40 animate-pulse",
  gray: "border-slate-200 bg-slate-100/80 dark:border-slate-700 dark:bg-slate-900/40",
}

export const TONE_BADGE: Record<TableTone, string> = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  gray: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
}

export type TableSnapshot = {
  tableId: number
  status: TableStatus
  hasCallAlert: boolean
  hasBillAlert: boolean
  hasCashierCall: boolean
  hasPaymentDone: boolean
  activeOrders: KitchenOrder[]
  total: number
  lastUpdate: string | null
}

export function computeTableSnapshot(
  tableId: number,
  allOrders: KitchenOrder[],
  alerts: TableAlert[],
): TableSnapshot {
  const mine = allOrders.filter((o) => o.table_number === tableId)
  const active = mine.filter((o) => o.status !== "cancelled")
  const tableAlerts = alerts.filter((a) => a.tableId === String(tableId) && !a.resolvedAt)

  const hasCallAlert = tableAlerts.some((a) => a.type === "call_server")
  const hasBillAlert = tableAlerts.some((a) => a.type === "request_bill")
  const hasCashierCall = tableAlerts.some((a) => a.type === "call_cashier")
  const hasPaymentDone = tableAlerts.some((a) => a.type === "payment_done")

  let status: TableStatus
  if (active.length === 0) {
    status = hasCallAlert || hasCashierCall ? "CALL_SERVER" : "FREE"
  } else if (hasCallAlert || hasCashierCall) {
    status = "CALL_SERVER"
  } else if (hasPaymentDone && active.every((o) => o.status === "completed")) {
    status = "PAID"
  } else if (hasBillAlert) {
    status = "PAYMENT_REQUESTED"
  } else if (active.some((o) => o.status === "delivering")) {
    status = "SERVED"
  } else if (active.some((o) => o.status === "ready")) {
    status = "READY"
  } else if (active.some((o) => o.status === "preparing" || o.status === "received")) {
    status = "IN_KITCHEN"
  } else if (active.every((o) => o.status === "completed")) {
    status = "PAID"
  } else {
    status = "OCCUPIED"
  }

  const total = active.reduce((s, o) => s + o.total, 0)
  const lastUpdate = active
    .map((o) => o.updated_at)
    .sort()
    .pop() ?? null

  return {
    tableId,
    status,
    hasCallAlert,
    hasBillAlert,
    hasCashierCall,
    hasPaymentDone,
    activeOrders: active,
    total,
    lastUpdate,
  }
}
