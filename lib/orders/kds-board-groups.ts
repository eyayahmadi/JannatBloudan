import type { KitchenOrder, OrderItem } from "@/lib/hooks/useRealtimeOrders"
import type { ItemStatus } from "@/lib/stations/config"

export type BoardGroupedItem = { order: KitchenOrder; items: OrderItem[] }

type GroupSlot = { order: KitchenOrder; items: OrderItem[]; group: BoardGroupedItem }

const columnGroupCache = new Map<ItemStatus | "refused", Map<string, GroupSlot>>()

/** Temporarily enable: window.__KDS_DEBUG = true */
export const KDS_RENDER_DEBUG =
  (typeof process !== "undefined" && process.env.NODE_ENV !== "production") ||
  (typeof window !== "undefined" &&
    Boolean((window as unknown as { __KDS_DEBUG?: boolean }).__KDS_DEBUG))

export function kdsRenderLog(component: string, detail?: Record<string, unknown>) {
  if (!KDS_RENDER_DEBUG) return
  console.debug("[kds-render]", component, detail ?? "")
}

function groupCacheFor(columnKey: ItemStatus | "refused"): Map<string, GroupSlot> {
  let cache = columnGroupCache.get(columnKey)
  if (!cache) {
    cache = new Map()
    columnGroupCache.set(columnKey, cache)
  }
  return cache
}

function itemsArrayStable(a: OrderItem[], b: OrderItem[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/** Reuse { order, items } object references when row data is unchanged. */
export function stableBoardGroup(
  columnKey: ItemStatus | "refused",
  order: KitchenOrder,
  items: OrderItem[],
): BoardGroupedItem {
  const cache = groupCacheFor(columnKey)
  const slot = cache.get(order.id)
  if (slot && slot.order === order && itemsArrayStable(slot.items, items)) {
    return slot.group
  }
  const group = { order, items }
  cache.set(order.id, { order, items, group })
  return group
}

export function pruneBoardGroupCache(
  columnKey: ItemStatus | "refused",
  activeOrderIds: ReadonlySet<string>,
) {
  const cache = groupCacheFor(columnKey)
  for (const id of cache.keys()) {
    if (!activeOrderIds.has(id)) cache.delete(id)
  }
}

function preparingSortTs(group: BoardGroupedItem): number {
  let min = Number.POSITIVE_INFINITY
  for (const it of group.items) {
    const raw = it.started_at ?? it.accepted_at
    if (raw) min = Math.min(min, new Date(raw).getTime())
  }
  if (Number.isFinite(min)) return min
  return new Date(group.order.created_at).getTime()
}

function createdSortTs(group: BoardGroupedItem): number {
  return new Date(group.order.created_at).getTime()
}

/** Stable PREPARING order: accepted_at → started_at → order.id (never elapsed). */
export function sortBoardGroups(
  columnKey: ItemStatus | "refused",
  groups: BoardGroupedItem[],
): BoardGroupedItem[] {
  const sorted = [...groups]
  if (columnKey === "preparing") {
    sorted.sort((a, b) => {
      const diff = preparingSortTs(a) - preparingSortTs(b)
      if (diff !== 0) return diff
      return a.order.id.localeCompare(b.order.id)
    })
    return sorted
  }
  sorted.sort((a, b) => {
    const diff = createdSortTs(a) - createdSortTs(b)
    if (diff !== 0) return diff
    return a.order.id.localeCompare(b.order.id)
  })
  return sorted
}

/** Keep groups[] reference when membership and row refs are unchanged. */
export function stabilizeGroupsArray(
  columnKey: ItemStatus | "refused",
  prev: BoardGroupedItem[] | undefined,
  next: BoardGroupedItem[],
): BoardGroupedItem[] {
  if (prev && prev.length === next.length) {
    let same = true
    for (let i = 0; i < prev.length; i++) {
      if (prev[i] !== next[i]) {
        same = false
        break
      }
    }
    if (same) return prev
  }
  return next
}
