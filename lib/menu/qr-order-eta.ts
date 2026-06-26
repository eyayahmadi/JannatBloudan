import type { OrderStatus } from "@/lib/hooks/useRealtimeOrders"

const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Bestellung eingegangen",
  preparing: "In Zubereitung",
  ready: "Bereit zum Servieren",
  delivering: "Wird serviert",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
}

const ETA_MINUTES: Partial<Record<OrderStatus, number>> = {
  received: 22,
  preparing: 12,
  ready: 0,
  delivering: 2,
}

export function qrOrderStatusLabel(status: OrderStatus): string {
  return STATUS_LABEL[status] ?? STATUS_LABEL.received
}

export function qrOrderEtaMinutes(status: OrderStatus): number | null {
  if (status === "completed" || status === "cancelled" || status === "ready") return null
  return ETA_MINUTES[status] ?? null
}

export function qrOrderEtaLabel(status: OrderStatus): string | null {
  const mins = qrOrderEtaMinutes(status)
  if (mins == null) return null
  if (mins <= 0) return "Gleich bei Ihnen"
  return `ca. ${mins} Min.`
}
