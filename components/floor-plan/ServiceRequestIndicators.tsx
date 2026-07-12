"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useElapsedTicker } from "@/lib/hooks/useElapsedTicker"
import {
  elapsedSince,
  formatServiceRequestElapsed,
  isServiceRequestOverdue,
  pickServiceRequestPriority,
  resolveServiceRequestCardTone,
  SERVICE_REQUEST_BADGE,
  SERVICE_REQUEST_BADGE_OVERDUE,
  SERVICE_REQUEST_CARD_RING,
  SERVICE_REQUEST_LABELS,
  type ServiceRequestRow,
  type ServiceRequestType,
  canAcknowledgeServiceRequest,
} from "@/lib/table/service-requests"

export type ServiceRequestIndicatorItem = {
  id: string
  request_type: ServiceRequestType
  requested_at: string
  order_id?: string | null
}

export function serviceRequestsFromOverview(row: {
  service_requests?: ServiceRequestIndicatorItem[]
  has_waiter_request_alert?: boolean
  waiter_request_latest_at?: string | null
  waiter_request_alert_id?: string | null
  has_payment_request_alert?: boolean
  payment_request_latest_at?: string | null
  payment_request_alert_id?: string | null
}): ServiceRequestIndicatorItem[] {
  if (Array.isArray(row.service_requests) && row.service_requests.length > 0) {
    return row.service_requests
  }
  const out: ServiceRequestIndicatorItem[] = []
  if (row.has_waiter_request_alert && row.waiter_request_latest_at) {
    out.push({
      id: row.waiter_request_alert_id ?? `waiter-${row.waiter_request_latest_at}`,
      request_type: "WAITER",
      requested_at: row.waiter_request_latest_at,
    })
  }
  if (row.has_payment_request_alert && row.payment_request_latest_at) {
    out.push({
      id: row.payment_request_alert_id ?? `bill-${row.payment_request_latest_at}`,
      request_type: "BILL",
      requested_at: row.payment_request_latest_at,
    })
  }
  return out
}

export function useServiceRequestVisuals(requests: ServiceRequestIndicatorItem[]) {
  const now = useElapsedTicker(requests.length > 0)
  const waiter = requests.find((r) => r.request_type === "WAITER")
  const bill = requests.find((r) => r.request_type === "BILL")
  const waiterSecs = elapsedSince(waiter?.requested_at, now)
  const billSecs = elapsedSince(bill?.requested_at, now)
  const priority = pickServiceRequestPriority(Boolean(waiter), Boolean(bill))
  const tone = resolveServiceRequestCardTone(priority, waiterSecs, billSecs)
  const ringClass = tone ? SERVICE_REQUEST_CARD_RING[tone] : null
  return { waiter, bill, waiterSecs, billSecs, priority, tone, ringClass, now }
}

export function ServiceRequestCardRing({
  requests,
  className,
  children,
}: {
  requests: ServiceRequestIndicatorItem[]
  className?: string
  children: React.ReactNode
}) {
  const { ringClass } = useServiceRequestVisuals(requests)
  if (!ringClass) return <>{children}</>
  return <div className={cn(ringClass, "rounded-2xl", className)}>{children}</div>
}

export function ServiceRequestBadges({
  requests,
  staffRole,
  onAcknowledge,
  compact = false,
  className,
}: {
  requests: ServiceRequestIndicatorItem[]
  staffRole?: string | null
  onAcknowledge?: (id: string, requestType: ServiceRequestType) => void | Promise<void>
  compact?: boolean
  className?: string
}) {
  const now = useElapsedTicker(requests.length > 0)
  const [busyId, setBusyId] = useState<string | null>(null)

  if (requests.length === 0) return null

  const sorted = [...requests].sort((a, b) => {
    if (a.request_type === "BILL" && b.request_type !== "BILL") return -1
    if (b.request_type === "BILL" && a.request_type !== "BILL") return 1
    return Date.parse(a.requested_at) - Date.parse(b.requested_at)
  })

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {sorted.map((req) => {
        const labels = SERVICE_REQUEST_LABELS[req.request_type]
        const secs = elapsedSince(req.requested_at, now)
        const overdue = isServiceRequestOverdue(secs)
        const canAck = staffRole ? canAcknowledgeServiceRequest(staffRole, req.request_type) : false
        const showAck = canAck && onAcknowledge

        return (
          <div
            key={req.id}
            className={cn(
              "flex items-start justify-between gap-2 rounded-lg border px-2 py-1.5",
              overdue ? SERVICE_REQUEST_BADGE_OVERDUE : SERVICE_REQUEST_BADGE[req.request_type],
              !compact && "animate-service-request-pulse",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className={cn("font-semibold leading-tight", compact ? "text-[10px]" : "text-[11px]")}>
                <span className="mr-1">{labels.emoji}</span>
                {labels.en}
              </p>
              {!compact ? (
                <>
                  <p className="text-[10px] opacity-90">{labels.fr}</p>
                  <p className="text-[10px] opacity-85" dir="rtl">
                    {labels.ar}
                  </p>
                </>
              ) : null}
              <p
                className={cn(
                  "mt-0.5 font-mono tabular-nums",
                  compact ? "text-[9px]" : "text-[10px]",
                  overdue ? "font-bold text-rose-700 dark:text-rose-300" : "opacity-80",
                )}
              >
                {formatServiceRequestElapsed(secs)}
              </p>
            </div>
            {showAck ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={cn(
                  "h-7 shrink-0 gap-1 border-current/30 bg-white/70 px-2 text-[10px] dark:bg-black/20",
                  compact && "h-6 px-1.5",
                )}
                disabled={busyId === req.id}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setBusyId(req.id)
                  void Promise.resolve(onAcknowledge(req.id, req.request_type)).finally(() =>
                    setBusyId(null),
                  )
                }}
              >
                {busyId === req.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                {!compact ? "Traité" : null}
              </Button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function mapAlertsToServiceRequests(
  alerts: Array<{
    id: string
    tableId: string
    type: string
    createdAt: string
    resolvedAt?: string
    orderId?: string | null
  }>,
  tableId: string | number,
): ServiceRequestIndicatorItem[] {
  return alerts
    .filter((a) => a.tableId === String(tableId))
    .filter((a) => String(a.type) === "call_server" || String(a.type) === "request_bill")
    .filter((a) => !a.resolvedAt)
    .map((a) => ({
      id: a.id,
      request_type: a.type === "call_server" ? "WAITER" : "BILL",
      requested_at: a.createdAt,
      order_id: a.orderId ?? null,
    }))
}

export type { ServiceRequestRow }
