import type { KitchenOrder, OrderItem } from "@/lib/hooks/useRealtimeOrders"
import type { ItemStatus } from "@/lib/stations/config"
import { isBillableItemStatus } from "@/lib/stations/config"
import { isLikelyOrderUuid } from "@/lib/orders/guest-tracking"

function isSyntheticLocalItemId(itemId: string, orderId: string): boolean {
  return !isLikelyOrderUuid(itemId) && itemId.startsWith(`${orderId}-`)
}

/** Temporary debug logging for KDS sync races (dev or window.__KDS_DEBUG). */
export const KDS_SYNC_DEBUG =
  (typeof process !== "undefined" && process.env.NODE_ENV !== "production") ||
  (typeof window !== "undefined" &&
    Boolean((window as unknown as { __KDS_DEBUG?: boolean }).__KDS_DEBUG))

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

function orderItemFieldsEqual(a: OrderItem, b: OrderItem): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    (a.name_ar ?? null) === (b.name_ar ?? null) &&
    a.quantity === b.quantity &&
    (a.notes ?? null) === (b.notes ?? null) &&
    a.station === b.station &&
    a.item_status === b.item_status &&
    (a.unit_price ?? null) === (b.unit_price ?? null) &&
    (a.refusal_reason_code ?? null) === (b.refusal_reason_code ?? null) &&
    (a.refusal_note ?? null) === (b.refusal_note ?? null) &&
    (a.refused_at ?? null) === (b.refused_at ?? null) &&
    (a.started_at ?? null) === (b.started_at ?? null) &&
    (a.ready_at ?? null) === (b.ready_at ?? null) &&
    (a.accepted_at ?? null) === (b.accepted_at ?? null) &&
    (a.served_at ?? null) === (b.served_at ?? null) &&
    (a.status_version ?? 0) === (b.status_version ?? 0) &&
    (a.status_updated_at ?? null) === (b.status_updated_at ?? null) &&
    (a.billable ?? true) === (b.billable ?? true)
  )
}

function kitchenOrderFieldsEqual(a: KitchenOrder, b: KitchenOrder): boolean {
  if (
    a.id !== b.id ||
    a.order_number !== b.order_number ||
    a.table_number !== b.table_number ||
    a.order_type !== b.order_type ||
    a.status !== b.status ||
    a.created_at !== b.created_at ||
    a.updated_at !== b.updated_at ||
    (a.customer_name ?? null) !== (b.customer_name ?? null) ||
    a.total !== b.total ||
    a.items.length !== b.items.length
  ) {
    return false
  }
  for (let i = 0; i < a.items.length; i++) {
    if (!orderItemFieldsEqual(a.items[i], b.items[i])) return false
  }
  return true
}

function pickNewerItemShell(local: OrderItem, incoming: OrderItem): OrderItem {
  const localTs = itemStatusTimestamp(local)
  const incomingTs = itemStatusTimestamp(incoming)
  const localRank = linearStatusRank(local.item_status)
  const incomingRank = linearStatusRank(incoming.item_status)

  if (incomingTs > localTs) return incoming
  if (incomingRank !== null && localRank !== null && incomingRank > localRank) return incoming
  if (
    incomingTs === localTs &&
    (incoming.status_version ?? 0) > (local.status_version ?? 0)
  ) {
    return incoming
  }
  return local
}

function coalesceItemFields(local: OrderItem, incoming: OrderItem): OrderItem {
  const name = String(incoming.name ?? "").trim() || local.name
  const name_ar =
    String(incoming.name_ar ?? "").trim() || String(local.name_ar ?? "").trim() || undefined
  const quantity = Number(incoming.quantity) > 0 ? incoming.quantity : local.quantity
  return {
    ...pickNewerItemShell(local, incoming),
    name,
    name_ar,
    quantity,
    notes: incoming.notes?.trim() ? incoming.notes : local.notes,
    unit_price: incoming.unit_price ?? local.unit_price,
    station: incoming.station ?? local.station,
    status_version: Math.max(local.status_version ?? 0, incoming.status_version ?? 0),
    status_updated_at:
      itemStatusTimestamp(incoming) >= itemStatusTimestamp(local)
        ? incoming.status_updated_at ?? local.status_updated_at
        : local.status_updated_at,
  }
}

type DbStationItemRow = {
  id: string
  station_status?: string | null
  station?: string | null
  product_name?: string | null
  product_name_ar?: string | null
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
    name_ar: row.product_name_ar?.trim() || undefined,
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
  orderId: string,
  graceUntil: ReadonlyMap<string, number> = new Map(),
): OrderItem[] {
  const byId = new Map<string, OrderItem>()
  const hasServerItems = incomingItems.some((it) => isLikelyOrderUuid(it.id))

  for (const incoming of incomingItems) {
    byId.set(incoming.id, incoming)
  }

  for (const local of localItems) {
    const existing = byId.get(local.id)
    if (!existing) {
      if (hasServerItems && isSyntheticLocalItemId(local.id, orderId)) {
        kdsSyncLog("ignored_stale", {
          itemId: local.id,
          orderId,
          reason: `drop_synthetic_local_from_${source}`,
        })
        continue
      }
      byId.set(local.id, local)
      continue
    }

    const inGrace = (graceUntil.get(local.id) ?? 0) > Date.now()
    if (pending.has(local.id) || inGrace) {
      kdsSyncLog("ignored_stale", {
        itemId: local.id,
        previousStatus: local.item_status,
        nextStatus: existing.item_status,
        reason: pending.has(local.id)
          ? `pending_mutation_from_${source}`
          : `mutation_grace_from_${source}`,
      })
      const kept = coalesceItemFields(local, existing)
      const locked: OrderItem = {
        ...kept,
        item_status: local.item_status,
        status_version: local.status_version,
        status_updated_at: local.status_updated_at,
        accepted_at: local.accepted_at ?? kept.accepted_at,
        started_at: local.started_at ?? kept.started_at,
        ready_at: local.ready_at ?? kept.ready_at,
        served_at: local.served_at ?? kept.served_at,
        refused_at: local.refused_at ?? kept.refused_at,
      }
      byId.set(local.id, orderItemFieldsEqual(local, locked) ? local : locked)
      continue
    }

    if (shouldAcceptIncomingItem(local, existing, source)) {
      const merged = coalesceItemFields(local, existing)
      byId.set(local.id, orderItemFieldsEqual(local, merged) ? local : merged)
    } else {
      const merged = coalesceItemFields(local, existing)
      byId.set(local.id, orderItemFieldsEqual(local, merged) ? local : merged)
    }
  }

  const result = Array.from(byId.values())
  if (
    result.length === localItems.length &&
    localItems.every((local, idx) => {
      const merged = result.find((it) => it.id === local.id)
      return merged != null && orderItemFieldsEqual(local, merged)
    })
  ) {
    return localItems
  }

  return result
}


export function applyItemPatchToOrders(
  orders: KitchenOrder[],
  orderId: string,
  itemId: string,
  patch: Partial<OrderItem>,
  aggregateStatus: (items: OrderItem[]) => KitchenOrder["status"],
  recomputeTotal: (order: KitchenOrder, fallback: number) => number,
): KitchenOrder[] {
  const orderIdx = orders.findIndex((o) => o.id === orderId)
  if (orderIdx === -1) return orders

  const order = orders[orderIdx]
  const itemIdx = order.items.findIndex((it) => it.id === itemId)
  if (itemIdx === -1) return orders

  const patched = { ...order.items[itemIdx], ...patch }
  if (orderItemFieldsEqual(order.items[itemIdx], patched)) return orders

  const items = order.items.map((it, idx) => (idx === itemIdx ? patched : it))
  const updated: KitchenOrder = {
    ...order,
    items,
    status: aggregateStatus(items),
    updated_at: new Date().toISOString(),
  }
  const withTotal = { ...updated, total: recomputeTotal(updated, order.total) }
  if (kitchenOrderFieldsEqual(order, withTotal)) return orders

  const next = [...orders]
  next[orderIdx] = withTotal
  return next
}

export function applyServerItemToOrders(
  orders: KitchenOrder[],
  orderId: string,
  serverItem: OrderItem,
  minVersion: number,
  aggregateStatus: (items: OrderItem[]) => KitchenOrder["status"],
  recomputeTotal: (order: KitchenOrder, fallback: number) => number,
): KitchenOrder[] {
  const orderIdx = orders.findIndex((o) => o.id === orderId)
  if (orderIdx === -1) return orders

  const order = orders[orderIdx]
  const itemIdx = order.items.findIndex((it) => it.id === serverItem.id)
  if (itemIdx === -1) return orders

  const current = order.items[itemIdx]
  const version = Math.max(minVersion, serverItem.status_version ?? 0, current.status_version ?? 0)
  const safeStatus = isBackwardStatusTransition(current.item_status, serverItem.item_status)
    ? current.item_status
    : serverItem.item_status

  const merged: OrderItem = {
    ...current,
    ...serverItem,
    item_status: safeStatus,
    name: String(serverItem.name ?? "").trim() || current.name,
    name_ar: String(serverItem.name_ar ?? "").trim() || current.name_ar,
    quantity: Number(serverItem.quantity) > 0 ? serverItem.quantity : current.quantity,
    notes: serverItem.notes?.trim() ? serverItem.notes : current.notes,
    unit_price: serverItem.unit_price ?? current.unit_price,
    station: serverItem.station ?? current.station,
    status_version: version,
    status_updated_at: serverItem.status_updated_at ?? current.status_updated_at,
  }

  if (orderItemFieldsEqual(current, merged)) return orders

  const items = order.items.map((it, idx) => (idx === itemIdx ? merged : it))
  const updated: KitchenOrder = {
    ...order,
    items,
    status: aggregateStatus(items),
    updated_at: new Date().toISOString(),
  }
  const withTotal = { ...updated, total: recomputeTotal(updated, order.total) }
  if (kitchenOrderFieldsEqual(order, withTotal)) return orders

  const next = [...orders]
  next[orderIdx] = withTotal
  return next
}

export function mergeKitchenOrders(
  local: KitchenOrder[],
  incoming: KitchenOrder[],
  pending: ReadonlyMap<string, PendingItemMutation>,
  source: KdsSyncSource,
  graceUntil: ReadonlyMap<string, number> = new Map(),
): KitchenOrder[] {
  const localById = new Map(local.map((o) => [o.id, o]))
  const incomingById = new Map(incoming.map((o) => [o.id, o]))
  const allIds = new Set([...localById.keys(), ...incomingById.keys()])

  const mergedById = new Map<string, KitchenOrder>()

  for (const id of allIds) {
    const localOrder = localById.get(id)
    const incomingOrder = incomingById.get(id)

    if (!localOrder && incomingOrder) {
      mergedById.set(id, incomingOrder)
      continue
    }

    if (localOrder && !incomingOrder) {
      // Never drop a known local order because a poll/realtime payload omitted it.
      mergedById.set(id, localOrder)
      kdsSyncLog("ignored_stale", {
        orderId: id,
        reason: `keep_local_missing_from_${source}`,
      })
      continue
    }

    if (localOrder && incomingOrder) {
      const items = mergeOrderItems(
        localOrder.items,
        incomingOrder.items,
        pending,
        source,
        id,
        graceUntil,
      )
      const localUpdated = new Date(localOrder.updated_at).getTime()
      const incomingUpdated = new Date(incomingOrder.updated_at).getTime()
      const shell = incomingUpdated >= localUpdated ? incomingOrder : localOrder

      const next: KitchenOrder = {
        ...shell,
        items,
        updated_at:
          incomingUpdated >= localUpdated
            ? incomingOrder.updated_at
            : localOrder.updated_at,
      }

      mergedById.set(
        id,
        kitchenOrderFieldsEqual(localOrder, next) ? localOrder : next,
      )
    }
  }

  // Preserve local board order; append genuinely new orders from server.
  const result: KitchenOrder[] = []
  const seen = new Set<string>()

  for (const localOrder of local) {
    const merged = mergedById.get(localOrder.id)
    if (!merged) continue
    result.push(merged)
    seen.add(localOrder.id)
  }

  for (const incomingOrder of incoming) {
    if (seen.has(incomingOrder.id)) continue
    const merged = mergedById.get(incomingOrder.id)
    if (merged) {
      result.unshift(merged)
      seen.add(incomingOrder.id)
    }
  }

  if (
    result.length === local.length &&
    result.every((order, idx) => order === local[idx])
  ) {
    return local
  }

  return result
}
