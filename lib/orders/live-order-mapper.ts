import { parseOptionsSnapshotJson } from "@/lib/orders/order-item-options"
import {
  normalizeOrderNumber,
  normalizeProductLabel,
} from "@/lib/orders/sanitize-display-text"
import type { KitchenOrder, OrderStatus, OrderType } from "@/lib/hooks/useRealtimeOrders"
import type { ItemStatus, Station } from "@/lib/stations/config"
import { inferStation } from "@/lib/stations/inference"
import { isBillableItemStatus } from "@/lib/stations/config"
import type { RefusalReasonCode } from "@/lib/stations/refusal-reasons"

type DbOrderRow = {
  id: string
  order_number: string
  table_number?: number | null
  table_id?: number | null
  order_type?: string | null
  source?: string | null
  status?: string | null
  customer_name?: string | null
  total?: number | string | null
  created_at?: string | null
  updated_at?: string | null
}

type DbOrderItemRow = {
  id: string
  product_name: string
  product_name_ar?: string | null
  quantity: number | string
  unit_price?: number | string | null
  special_instructions?: string | null
  options_snapshot?: unknown
  station?: string | null
  station_status?: string | null
  started_at?: string | null
  ready_at?: string | null
  served_at?: string | null
  accepted_at?: string | null
  refusal_reason?: string | null
  refusal_note?: string | null
  refused_at?: string | null
  billable?: boolean | null
}

function mapDbOrderStatus(raw: string | null | undefined): OrderStatus {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
  if (s === "cancelled" || s === "annulée" || s === "annulee") return "cancelled"
  if (s === "completed" || s === "livrée" || s === "livree" || s === "delivered") return "completed"
  if (s === "delivering" || s === "en livraison") return "delivering"
  if (s === "ready" || s === "prête" || s === "prete") return "ready"
  if (s === "preparing" || s === "en préparation" || s === "en preparation") return "preparing"
  return "received"
}

function mapDbOrderType(orderType: string | null | undefined, source: string | null | undefined): OrderType {
  const t = String(orderType ?? source ?? "")
    .trim()
    .toLowerCase()
  if (t.includes("qr")) return "qr_self_service"
  if (t.includes("server") || t.includes("serveur")) return "server"
  if (t.includes("delivery") || t.includes("livraison")) return "delivery"
  if (t.includes("pos") || t.includes("emporter") || t.includes("takeaway")) return "pos"
  return "qr_self_service"
}

function mapDbItemStatus(raw: string | null | undefined): ItemStatus {
  const s = String(raw ?? "new").trim().toLowerCase()
  const allowed: ItemStatus[] = [
    "new",
    "accepted",
    "preparing",
    "ready",
    "served",
    "refused",
    "replacement_requested",
    "replaced",
    "cancelled",
    "waste",
  ]
  return (allowed.includes(s as ItemStatus) ? s : "new") as ItemStatus
}

function mapDbStation(raw: string | null | undefined, productName: string): Station {
  const s = String(raw ?? "").trim().toUpperCase()
  if (s === "KITCHEN" || s === "BAR" || s === "SHISHA") return s
  return inferStation(productName)
}

export function mapDbRowsToKitchenOrders(
  orders: DbOrderRow[],
  itemsByOrderId: Map<string, DbOrderItemRow[]>,
): KitchenOrder[] {
  return orders.map((order) => {
    const items = itemsByOrderId.get(order.id) ?? []
    const mappedItems = items.map((it) => {
      const itemStatus = mapDbItemStatus(it.station_status)
      const timestamps = [
        it.accepted_at,
        it.started_at,
        it.ready_at,
        it.served_at,
        it.refused_at,
      ].filter((v): v is string => Boolean(v))
      const statusUpdatedAt =
        timestamps.length > 0
          ? timestamps.reduce((latest, cur) =>
              new Date(cur).getTime() > new Date(latest).getTime() ? cur : latest,
            )
          : undefined

      return {
        id: it.id,
        name: normalizeProductLabel(it.product_name),
        name_ar: normalizeProductLabel(it.product_name_ar) || undefined,
        quantity: typeof it.quantity === "number" ? it.quantity : Number.parseInt(String(it.quantity), 10) || 0,
        notes: it.special_instructions?.trim() || undefined,
        options_snapshot: parseOptionsSnapshotJson(it.options_snapshot) ?? undefined,
        station: mapDbStation(it.station, it.product_name),
        item_status: itemStatus,
        unit_price:
          typeof it.unit_price === "number"
            ? it.unit_price
            : Number.parseFloat(String(it.unit_price ?? "0")) || undefined,
        refusal_reason_code: it.refusal_reason
          ? (it.refusal_reason as RefusalReasonCode)
          : undefined,
        refusal_note: it.refusal_note?.trim() || undefined,
        refused_at: it.refused_at ?? undefined,
        billable: it.billable ?? isBillableItemStatus(itemStatus),
        started_at: it.started_at ?? undefined,
        ready_at: it.ready_at ?? undefined,
        served_at: it.served_at ?? undefined,
        accepted_at: it.accepted_at ?? undefined,
        status_updated_at: statusUpdatedAt,
        status_version: Math.max(
          0,
          ...timestamps.map((v) => new Date(v).getTime()).filter(Number.isFinite),
        ),
      }
    })

    const total =
      typeof order.total === "number"
        ? order.total
        : Number.parseFloat(String(order.total ?? "0")) || 0

    const tableNumber =
      order.table_number != null
        ? Number(order.table_number)
        : order.table_id != null
          ? Number(order.table_id)
          : null

    return {
      id: order.id,
      order_number: normalizeOrderNumber(order.order_number),
      table_number: Number.isFinite(tableNumber) ? tableNumber : null,
      order_type: mapDbOrderType(order.order_type, order.source),
      status: mapDbOrderStatus(order.status),
      items: mappedItems,
      created_at: order.created_at ?? new Date().toISOString(),
      updated_at: order.updated_at ?? order.created_at ?? new Date().toISOString(),
      customer_name: order.customer_name ?? undefined,
      total,
    }
  })
}
