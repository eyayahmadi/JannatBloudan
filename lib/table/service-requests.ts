import type { TableAlertType } from "@/lib/hooks/useTableAlerts"

/** Seconds before a pending request is shown as overdue (red). */
export const SERVICE_REQUEST_OVERDUE_SECS = Number(
  process.env.NEXT_PUBLIC_SERVICE_REQUEST_OVERDUE_SECS ?? 300,
)

export type ServiceRequestType = "WAITER" | "BILL"
export type ServiceRequestStatus = "PENDING" | "ACKNOWLEDGED" | "RESOLVED"

export type ServiceRequestRow = {
  id: string
  table_id?: number
  tableId?: string | number
  request_type: ServiceRequestType
  status: ServiceRequestStatus
  requested_at: string
  acknowledged_at?: string | null
  acknowledged_by?: string | null
  resolved_at?: string | null
  order_id?: string | null
}

export const SERVICE_REQUEST_LABELS: Record<
  ServiceRequestType,
  { emoji: string; en: string; fr: string; ar: string }
> = {
  WAITER: {
    emoji: "🔔",
    en: "Waiter requested",
    fr: "Demande serveur",
    ar: "طلب النادل",
  },
  BILL: {
    emoji: "🧾",
    en: "Bill requested",
    fr: "Addition demandée",
    ar: "طلب الحساب",
  },
}

export function alertTypeToRequestType(type: TableAlertType): ServiceRequestType | null {
  if (type === "call_server") return "WAITER"
  if (type === "request_bill") return "BILL"
  return null
}

export function requestTypeToAlertType(type: ServiceRequestType): TableAlertType {
  return type === "WAITER" ? "call_server" : "request_bill"
}

export function deriveServiceRequestStatus(row: {
  resolved_at?: string | null
  resolvedAt?: string | null
  acknowledged_at?: string | null
  acknowledgedAt?: string | null
}): ServiceRequestStatus {
  const resolved = row.resolved_at ?? row.resolvedAt
  if (resolved) return "RESOLVED"
  const acknowledged = row.acknowledged_at ?? row.acknowledgedAt
  if (acknowledged) return "ACKNOWLEDGED"
  return "PENDING"
}

export function elapsedSince(iso: string | null | undefined, nowMs = Date.now()): number {
  if (!iso) return 0
  const start = Date.parse(iso)
  if (!Number.isFinite(start)) return 0
  return Math.max(0, Math.floor((nowMs - start) / 1000))
}

/** Compact timer for table cards: "45 sec" or "02:15" */
export function formatServiceRequestElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function isServiceRequestOverdue(seconds: number): boolean {
  return seconds >= SERVICE_REQUEST_OVERDUE_SECS
}

export type ServiceRequestVisualPriority = "bill" | "waiter" | null

export function pickServiceRequestPriority(
  hasWaiter: boolean,
  hasBill: boolean,
): ServiceRequestVisualPriority {
  if (hasBill) return "bill"
  if (hasWaiter) return "waiter"
  return null
}

export type ServiceRequestCardTone = "waiter" | "bill" | "overdue-waiter" | "overdue-bill" | null

export function resolveServiceRequestCardTone(
  priority: ServiceRequestVisualPriority,
  waiterSecs: number,
  billSecs: number,
): ServiceRequestCardTone {
  if (!priority) return null
  if (priority === "bill") {
    return isServiceRequestOverdue(billSecs) ? "overdue-bill" : "bill"
  }
  return isServiceRequestOverdue(waiterSecs) ? "overdue-waiter" : "waiter"
}

/** Tailwind classes for floor-plan table cards */
export const SERVICE_REQUEST_CARD_RING: Record<NonNullable<ServiceRequestCardTone>, string> = {
  waiter:
    "border-violet-400 ring-2 ring-violet-400/45 shadow-[0_0_0_4px_rgba(139,92,246,0.12)] animate-service-request-pulse",
  bill:
    "border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_0_4px_rgba(251,191,36,0.15)] animate-service-request-pulse",
  "overdue-waiter":
    "border-rose-500 ring-2 ring-rose-500/55 shadow-[0_0_0_4px_rgba(244,63,94,0.18)] animate-service-request-pulse-fast",
  "overdue-bill":
    "border-rose-500 ring-2 ring-rose-500/55 shadow-[0_0_0_4px_rgba(244,63,94,0.18)] animate-service-request-pulse-fast",
}

export const SERVICE_REQUEST_BADGE: Record<ServiceRequestType, string> = {
  WAITER:
    "bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950/50 dark:text-violet-100 dark:border-violet-700",
  BILL:
    "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-100 dark:border-amber-700",
}

export const SERVICE_REQUEST_BADGE_OVERDUE =
  "bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-950/50 dark:text-rose-100 dark:border-rose-600"

export function canAcknowledgeServiceRequest(
  role: string,
  requestType: ServiceRequestType,
): boolean {
  const r = role.toUpperCase()
  if (r === "ADMIN") return true
  if (requestType === "WAITER") return r === "SERVER"
  if (requestType === "BILL") return r === "SERVER" || r === "CASHIER"
  return false
}
