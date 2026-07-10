import type { KitchenOrder, OrderItem } from "@/lib/hooks/useRealtimeOrders"
import type { ItemStatus } from "@/lib/stations/config"
import { isBillableItemStatus } from "@/lib/stations/config"
import { isLikelyOrderUuid } from "@/lib/orders/guest-tracking"

/** Temporary debug logging for KDS sync races (dev / explicit flag). */
export const KDS_SYNC_DEBUG =
  typeof process !== "undefined" && process.env.NODE_ENV !== "production"

export type KdsSyncSource =
  | "action_start"
  | "api_response"
  | "local_update"
  | "polling"
  | "realtime"
  | "storage"
  | "ignored_stale"
  | "action_blocked"
  | "api_error"

export type PendingItemMutation = {
  itemId: string
  orderId: string
  previousStatus: ItemStatus
  expectedStatus: ItemStatus
  version: number
  startedAt: number
}

const LINEAR_STATUS_RANK: Partial<Record<ItemStatus, number>> = {
  new: 0,
  accepted: 1,
  preparing: 2,
  ready: 3,
  served: 4,
}

const TERMINAL_STATUSES = new Set<ItemStatus>([
  "served",
  "refused",
  "waste",
  "replaced",
  "cancelled",
])

export function kdsSyncLog(
  source: KdsSyncSource,
  detail: {
    itemId?: string
    orderId?: string
    previousStatus?: ItemStatus
    nextStatus?: ItemStatus
    updatedAt?: string
    version?: number
    reason?: string
  },
) {
  if (!KDS_SYNC_DEBUG) return
  console.debug("[kds-sync]", source, detail)
}

export function linearStatusRank(status: ItemStatus): number | null {
  const rank = LINEAR_STATUS_RANK[status]
  return rank === undefined ? null : rank
}

/** True when `to` regresses along the happy-path (e.g. accepted → new). */
export function isBackwardStatusTransition(from: ItemStatus, to: ItemStatus): boolean {
  if (from === to) return false

  const fromLinear = linearStatusRank(from)
  const toLinear = linearStatusRank(to)

  if (fromLinear !== null && toLinear !== null) {
    return toLinear < fromLinear
  }

  if (TERMINAL_STATUSES.has(from) && toLinear !== null) {
    return true
  }

  return false
}

export function itemStatusTimestamp(item: OrderItem): number {
  const candidates = [
    item.status_updated_at,
    item.ready_at,
    item.started_at,
    item.refused_at,
    item.accepted_at,
    item.served_at,
    item.cancelled_at,
  ]
    .filter((v): v is string => Boolean(v))
    .map((v) => new Date(v).getTime())
    .filter((n) => Number.isFinite(n))

  if (candidates.length > 0) return Math.max(...candidates)
  return item.status_version ?? 0
}

export function bumpItemVersion(item: OrderItem, now: string): OrderItem {
  const version = (item.status_version ?? 0) + 1
  return {
    ...item,
    status_version: version,
    status_updated_at: now,
  }
}

type DbStationItemRow = {
  id: string
  station_status?: string | null
  station?: string | null
  product_name?: string | null
  quantity?: number | string | null
  unit_price?: number | string | null
  special_instructions?: string | null
  started_at?: string | null
  ready_at?: string | null
  served_at?: string | null
  accepted_at?: string | null
  refused_at?: string | null
  refusal_reason?: string | null
  refusal_note?: string | null
  billable?: boolean | null
}

export function mapStationApiItemRow(row: DbStationItemRow): OrderItem {
  const status = String(row.station_status ?? "new").toLowerCase() as ItemStatus
  const timestamps = [
    row.accepted_at,
    row.started_at,
    row.ready_at,
    row.served_at,
    row.refused_at,
  ].filter((v): v is string => Boolean(v))

  const statusUpdatedAt =
    timestamps.length > 0
      ? timestamps.reduce((latest, cur) =>
          new Date(cur).getTime() > new Date(latest).getTime() ? cur : latest,
        )
      : new Date().toISOString()

  return {
    id: String(row.id),
    name: String(row.product_name ?? ""),
    quantity:
      typeof row.quantity === "number"
        ? row.quantity
        : Number.parseInt(String(row.quantity ?? "1"), 10) || 1,
    notes: row.special_instructions?.trim() || undefined,
    station: (String(row.station ?? "KITCHEN").toUpperCase() || "KITCHEN") as OrderItem["station"],
    item_status: status,
    unit_price:
      typeof row.unit_price === "number"
        ? row.unit_price
        : Number.parseFloat(String(row.unit_price ?? "0")) || undefined,
    started_at: row.started_at ?? undefined,
    ready_at: row.ready_at ?? undefined,
    served_at: row.served_at ?? undefined,
    accepted_at: row.accepted_at ?? undefined,
    refused_at: row.refused_at ?? undefined,
    refusal_reason_code: row.refusal_reason
      ? (row.refusal_reason as OrderItem["refusal_reason_code"])
      : undefined,
    refusal_note: row.refusal_note?.trim() || undefined,
    billable: row.billable ?? isBillableItemStatus(status),
    status_updated_at: statusUpdatedAt,
  }
}

function shouldAcceptIncomingItem(
  local: OrderItem,
  incoming: OrderItem,
  source: KdsSyncSource,
): boolean {
  if (isBackwardStatusTransition(local.item_status, incoming.item_status)) {
    kdsSyncLog("ignored_stale", {
      itemId: local.id,
      previousStatus: local.item_status,
      nextStatus: incoming.item_status,
      updatedAt: incoming.status_updated_at,
      version: incoming.status_version,
      reason: `backward_from_${source}`,
    })
    return false
  }

  const localTs = itemStatusTimestamp(local)
  const incomingTs = itemStatusTimestamp(incoming)
  const localRank = linearStatusRank(local.item_status)
  const incomingRank = linearStatusRank(incoming.item_status)

  if (incomingTs > localTs) return true
  if (incomingRank !== null && localRank !== null && incomingRank > localRank) return true
  if (
    incomingTs === localTs &&
    (incoming.status_version ?? 0) > (local.status_version ?? 0)
  ) {
    return true
  }

  if (incoming.item_status !== local.item_status || incomingTs < localTs) {
    kdsSyncLog("ignored_stale", {
      itemId: local.id,
      previousStatus: local.item_status,
      nextStatus: incoming.item_status,
      updatedAt: incoming.status_updated_at,
      version: incoming.status_version,
      reason: `older_than_local_from_${source}`,
    })
  }

  return false
}

export function mergeOrderItems(
  localItems: OrderItem[],
  incomingItems: OrderItem[],
  pending: ReadonlyMap<string, PendingItemMutation>,
  source: KdsSyncSource,
): OrderItem[] {
  const byId = new Map<string, OrderItem>()

  for (const item of localItems) {
    byId.set(item.id, item)
  }

  for (const incoming of incomingItems) {
    const local = byId.get(incoming.id)
    if (!local) {
      byId.set(incoming.id, incoming)
      continue
    }

    if (pending.has(incoming.id)) {
      kdsSyncLog("ignored_stale", {
        itemId: incoming.id,
        previousStatus: local.item_status,
        nextStatus: incoming.item_status,
        reason: `pending_mutation_from_${source}`,
      })
      continue
    }

    if (shouldAcceptIncomingItem(local, incoming, source)) {
      const version = Math.max(local.status_version ?? 0, incoming.status_version ?? 0)
      byId.set(incoming.id, {
        ...incoming,
        status_version: version,
        status_updated_at:
          itemStatusTimestamp(incoming) >= itemStatusTimestamp(local)
            ? incoming.status_updated_at ?? local.status_updated_at
            : local.status_updated_at,
      })
    }
  }

  return Array.from(byId.values())
}

function hasPendingItems(order: KitchenOrder, pending: ReadonlyMap<string, PendingItemMutation>) {
  return order.items.some((it) => pending.has(it.id))
}

export function mergeKitchenOrders(
  local: KitchenOrder[],
  incoming: KitchenOrder[],
  pending: ReadonlyMap<string, PendingItemMutation>,
  source: KdsSyncSource,
): KitchenOrder[] {
  const localById = new Map(local.map((o) => [o.id, o]))
  const incomingById = new Map(incoming.map((o) => [o.id, o]))
  const allIds = new Set([...localById.keys(), ...incomingById.keys()])

  const merged: KitchenOrder[] = []

  for (const id of allIds) {
    const localOrder = localById.get(id)
    const incomingOrder = incomingById.get(id)

    if (!localOrder && incomingOrder) {
      merged.push(incomingOrder)
      continue
    }

    if (localOrder && !incomingOrder) {
      if (!isLikelyOrderUuid(id) || hasPendingItems(localOrder, pending)) {
        merged.push(localOrder)
      }
      continue
    }

    if (localOrder && incomingOrder) {
      const items = mergeOrderItems(
        localOrder.items,
        incomingOrder.items,
        pending,
        source,
      )
      const localUpdated = new Date(localOrder.updated_at).getTime()
      const incomingUpdated = new Date(incomingOrder.updated_at).getTime()
      const shell = incomingUpdated >= localUpdated ? incomingOrder : localOrder

      merged.push({
        ...shell,
        items,
        updated_at:
          incomingUpdated >= localUpdated
            ? incomingOrder.updated_at
            : localOrder.updated_at,
      })
    }
  }

  return merged.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

export function applyItemPatchToOrders(
  orders: KitchenOrder[],
  orderId: string,
  itemId: string,
  patch: Partial<OrderItem>,
  aggregateStatus: (items: OrderItem[]) => KitchenOrder["status"],
  recomputeTotal: (order: KitchenOrder, fallback: number) => number,
): KitchenOrder[] {
  return orders.map((order) => {
    if (order.id !== orderId) return order
    const items = order.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it))
    const updated: KitchenOrder = {
      ...order,
      items,
      status: aggregateStatus(items),
      updated_at: new Date().toISOString(),
    }
    return { ...updated, total: recomputeTotal(updated, order.total) }
  })
}

export function applyServerItemToOrders(
  orders: KitchenOrder[],
  orderId: string,
  serverItem: OrderItem,
  minVersion: number,
  aggregateStatus: (items: OrderItem[]) => KitchenOrder["status"],
  recomputeTotal: (order: KitchenOrder, fallback: number) => number,
): KitchenOrder[] {
  return orders.map((order) => {
    if (order.id !== orderId) return order
    const items = order.items.map((it) => {
      if (it.id !== serverItem.id) return it
      const version = Math.max(minVersion, serverItem.status_version ?? 0, it.status_version ?? 0)
      return {
        ...it,
        ...serverItem,
        status_version: version,
        status_updated_at: serverItem.status_updated_at ?? it.status_updated_at,
      }
    })
    const updated: KitchenOrder = {
      ...order,
      items,
      status: aggregateStatus(items),
      updated_at: new Date().toISOString(),
    }
    return { ...updated, total: recomputeTotal(updated, order.total) }
  })
}
