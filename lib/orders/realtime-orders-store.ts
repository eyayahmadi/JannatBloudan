/**
 * Singleton KDS order store — une seule source de vérité partagée par tous
 * les consommateurs de useRealtimeOrders (StationBoard, workflow, serveur, etc.).
 */

import { onRealtimeRefresh, scopeMatches, getRealtimeStatus } from "@/lib/realtime/bus"
import {
  isBillableItemStatus,
  type ItemStatus,
  type Station,
} from "@/lib/stations/config"
import type { RefusalReasonCode } from "@/lib/stations/refusal-reasons"
import { inferStation } from "@/lib/stations/inference"
import { isLikelyOrderUuid } from "@/lib/orders/guest-tracking"
import {
  applyItemPatchToOrders,
  applyServerItemToOrders,
  bumpItemVersion,
  kdsSyncLog,
  mapStationApiItemRow,
  mergeKitchenOrders,
  type PendingItemMutation,
} from "@/lib/orders/kds-sync"
import type {
  KitchenOrder,
  KitchenOrderInput,
  OrderItem,
  OrderStatus,
} from "@/lib/hooks/useRealtimeOrders"

const STORAGE_KEY = "jb-realtime-orders"
const LIVE_SYNC_MS = 4000
const LIVE_SYNC_FALLBACK_MS = 30000
const MUTATION_GRACE_MS = 8000
const PULL_SUPPRESS_MS = 2500
const REALTIME_DEBOUNCE_MS = 500

type StoreListener = () => void

function loadOrders(): KitchenOrder[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown
    if (!Array.isArray(raw)) return []
    return (raw as KitchenOrder[]).map((o) => ({
      ...o,
      items: (o.items ?? []).map((it, idx) => {
        const cast = it as OrderItem
        return {
          id: cast.id ?? `${o.id}-${idx}`,
          name: it.name,
          name_ar: cast.name_ar,
          quantity: it.quantity,
          notes: it.notes,
          station: cast.station ?? inferStation(it.name),
          item_status: cast.item_status ?? mapOrderStatusToItem(o.status),
          unit_price: cast.unit_price,
          cancel_reason: cast.cancel_reason,
          cancelled_at: cast.cancelled_at,
          refusal_reason_code: cast.refusal_reason_code,
          refusal_note: cast.refusal_note,
          refused_at: cast.refused_at,
          replacement_of_item_id: cast.replacement_of_item_id,
          replaced_by_item_id: cast.replaced_by_item_id,
          billable: cast.billable ?? isBillableItemStatus(cast.item_status ?? "new"),
          started_at: cast.started_at,
          ready_at: cast.ready_at,
          accepted_at: cast.accepted_at,
          served_at: cast.served_at,
          status_version: cast.status_version,
          status_updated_at: cast.status_updated_at,
        }
      }),
    }))
  } catch {
    return []
  }
}

function mapOrderStatusToItem(s: OrderStatus): ItemStatus {
  if (s === "preparing") return "preparing"
  if (s === "ready" || s === "delivering" || s === "completed") return "ready"
  return "new"
}

function persistOrders(orders: KitchenOrder[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
}

function shouldSyncOrdersFromServer(): boolean {
  if (typeof window === "undefined") return false
  return /^\/(kitchen|bar|shisha|server|pos|caisse|admin|table)(\/|$)/.test(window.location.pathname)
}

function aggregateOrderStatus(items: OrderItem[]): OrderStatus {
  if (items.length === 0) return "received"
  const active = items.filter(
    (it) =>
      it.item_status !== "cancelled" &&
      it.item_status !== "refused" &&
      it.item_status !== "replaced" &&
      it.item_status !== "waste",
  )
  if (active.length === 0) return "cancelled"
  if (active.every((it) => it.item_status === "served" || it.item_status === "ready")) return "ready"
  if (active.some((it) => it.item_status === "preparing" || it.item_status === "accepted")) {
    return "preparing"
  }
  return "received"
}

function recomputeOrderTotal(order: KitchenOrder, fallback: number): number {
  const haveUnitPrices = order.items.some((it) => typeof it.unit_price === "number")
  if (!haveUnitPrices) return fallback
  const total = order.items
    .filter((it) => isBillableItemStatus(it.item_status))
    .reduce((s, it) => s + (Number(it.unit_price) || 0) * (Number(it.quantity) || 0), 0)
  return Math.round(total * 100) / 100
}

class RealtimeOrdersStore {
  private orders: KitchenOrder[] = typeof window !== "undefined" ? loadOrders() : []
  private listeners = new Set<StoreListener>()
  private pendingMutations = new Map<string, PendingItemMutation>()
  private mutationGraceUntil = new Map<string, number>()
  private knownServerOrderIds = new Set<string>()
  private pullInFlight: Promise<void> | null = null
  private syncStarted = false
  private syncCancelled = false
  private suppressPullUntil = 0
  private lastEvent: string | null = null
  private lastEventListeners = new Set<StoreListener>()
  private realtimeDebounceTimer: ReturnType<typeof setTimeout> | null = null
  private pollIntervalId: number | null = null

  subscribe = (listener: StoreListener): (() => void) => {
    this.listeners.add(listener)
    this.ensureSync()
    return () => this.listeners.delete(listener)
  }

  subscribeLastEvent = (listener: StoreListener): (() => void) => {
    this.lastEventListeners.add(listener)
    return () => this.lastEventListeners.delete(listener)
  }

  getOrders = (): KitchenOrder[] => this.orders

  getLastEvent = (): string | null => this.lastEvent

  isItemPending = (itemId: string): boolean => this.pendingMutations.has(itemId)

  getPendingMutations = (): ReadonlyMap<string, PendingItemMutation> => this.pendingMutations

  getMutationGraceUntil = (): ReadonlyMap<string, number> => this.mutationGraceUntil

  private emit() {
    for (const listener of this.listeners) listener()
  }

  private emitLastEvent() {
    for (const listener of this.lastEventListeners) listener()
  }

  private setLastEvent(event: string) {
    this.lastEvent = event
    this.emitLastEvent()
  }

  private setOrders(updater: (prev: KitchenOrder[]) => KitchenOrder[]) {
    const next = updater(this.orders)
    if (next === this.orders) return
    this.orders = next
    persistOrders(this.orders)
    this.emit()
  }

  private beginPending(mutation: PendingItemMutation) {
    this.pendingMutations.set(mutation.itemId, mutation)
    this.suppressPullUntil = Date.now() + PULL_SUPPRESS_MS
    kdsSyncLog("action_start", {
      itemId: mutation.itemId,
      orderId: mutation.orderId,
      previousStatus: mutation.previousStatus,
      nextStatus: mutation.expectedStatus,
      version: mutation.version,
    })
    this.emit()
  }

  private endPending(itemId: string) {
    this.pendingMutations.delete(itemId)
    this.mutationGraceUntil.set(itemId, Date.now() + MUTATION_GRACE_MS)
    this.suppressPullUntil = Date.now() + PULL_SUPPRESS_MS
    this.emit()
  }

  private mergeFromServer(
    serverOrders: KitchenOrder[],
    source: "polling" | "realtime" | "storage",
  ) {
    const merged = mergeKitchenOrders(
      this.orders,
      serverOrders,
      this.pendingMutations,
      source,
      this.mutationGraceUntil,
    )
    if (merged === this.orders) return
    this.orders = merged
    persistOrders(this.orders)
    this.emit()
  }

  private ensureSync() {
    if (this.syncStarted || typeof window === "undefined") return
    this.syncStarted = true
    this.syncCancelled = false

    if (!shouldSyncOrdersFromServer()) return

    const doPull = async (source: "polling" | "realtime") => {
      if (this.syncCancelled) return
      if (this.pendingMutations.size > 0) {
        kdsSyncLog(source, { reason: "pull_skipped_pending_mutation" })
        return
      }
      if (Date.now() < this.suppressPullUntil) {
        kdsSyncLog(source, { reason: "pull_suppressed_after_mutation" })
        return
      }
      try {
        const res = await fetch("/api/orders/live", { cache: "no-store" })
        if (!res.ok || this.syncCancelled) return
        const json = (await res.json()) as { orders?: KitchenOrder[] }
        const serverOrders = Array.isArray(json.orders) ? json.orders : []

        kdsSyncLog(source, { reason: `payload_orders=${serverOrders.length}` })

        let hasNew = false
        for (const o of serverOrders) {
          if (!this.knownServerOrderIds.has(o.id)) {
            this.knownServerOrderIds.add(o.id)
            if (isLikelyOrderUuid(o.id)) hasNew = true
          }
        }

        this.mergeFromServer(serverOrders, source)
        if (hasNew) this.setLastEvent("NEW_ORDER")
      } catch {
        /* réseau */
      }
    }

    const pull = (source: "polling" | "realtime") => {
      if (this.pullInFlight) return this.pullInFlight
      const run = doPull(source).finally(() => {
        this.pullInFlight = null
      })
      this.pullInFlight = run
      return run
    }

    void pull("polling")

    const schedulePolling = () => {
      if (this.pollIntervalId != null) {
        clearInterval(this.pollIntervalId)
      }
      const interval =
        getRealtimeStatus() === "live" ? LIVE_SYNC_FALLBACK_MS : LIVE_SYNC_MS
      this.pollIntervalId = window.setInterval(() => void pull("polling"), interval)
    }

    schedulePolling()

    const unsub = onRealtimeRefresh((scope) => {
      if (!scopeMatches("orders", scope)) return
      if (this.pendingMutations.size > 0) {
        kdsSyncLog("realtime", { reason: "refresh_skipped_pending_mutation" })
        return
      }
      if (this.realtimeDebounceTimer) {
        clearTimeout(this.realtimeDebounceTimer)
      }
      this.realtimeDebounceTimer = setTimeout(() => {
        this.realtimeDebounceTimer = null
        void pull("realtime")
      }, REALTIME_DEBOUNCE_MS)
    })

    const prevCleanup = this.cleanupSync
    this.cleanupSync = () => {
      this.syncCancelled = true
      if (this.pollIntervalId != null) clearInterval(this.pollIntervalId)
      if (this.realtimeDebounceTimer) clearTimeout(this.realtimeDebounceTimer)
      unsub()
      prevCleanup?.()
    }
  }

  private cleanupSync: (() => void) | null = null

  addOrder = (order: KitchenOrderInput) => {
    this.setOrders((prev) => {
      if (prev.some((o) => o.id === order.id)) return prev
      const normalized: KitchenOrder = {
        ...order,
        items: order.items.map((it, idx) => ({
          id: it.id ?? `${order.id}-${idx}`,
          name: it.name,
          name_ar: it.name_ar,
          quantity: it.quantity,
          notes: it.notes,
          station: it.station ?? inferStation(it.name),
          item_status: it.item_status ?? "new",
          unit_price: it.unit_price,
          cancel_reason: it.cancel_reason,
          cancelled_at: it.cancelled_at,
          started_at: it.started_at,
          ready_at: it.ready_at,
        })),
      }
      return [normalized, ...prev]
    })
    this.setLastEvent("NEW_ORDER")
  }

  updateStatus = (orderId: string, status: OrderStatus) => {
    this.setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o,
      ),
    )
    this.setLastEvent("ORDER_STATUS_UPDATED")
  }

  updateItemStatus = async (
    orderId: string,
    itemId: string,
    nextStatus: ItemStatus,
  ): Promise<boolean> => {
    if (this.pendingMutations.has(itemId)) {
      kdsSyncLog("action_blocked", { itemId, orderId, nextStatus, reason: "mutation_in_flight" })
      return false
    }

    const order = this.orders.find((o) => o.id === orderId)
    const currentItem = order?.items.find((it) => it.id === itemId)
    if (!order || !currentItem) return false

    const previousStatus = currentItem.item_status
    const now = new Date().toISOString()
    const optimisticItem = bumpItemVersion(
      {
        ...currentItem,
        item_status: nextStatus,
        started_at:
          nextStatus === "preparing" && !currentItem.started_at ? now : currentItem.started_at,
        ready_at: nextStatus === "ready" && !currentItem.ready_at ? now : currentItem.ready_at,
        accepted_at:
          nextStatus === "accepted" && !currentItem.accepted_at ? now : currentItem.accepted_at,
        served_at:
          nextStatus === "served" && !currentItem.served_at ? now : currentItem.served_at,
      },
      now,
    )
    const version = optimisticItem.status_version ?? 1

    this.beginPending({
      itemId,
      orderId,
      previousStatus,
      expectedStatus: nextStatus,
      version,
      startedAt: Date.now(),
    })

    this.setOrders((prev) =>
      applyItemPatchToOrders(
        prev,
        orderId,
        itemId,
        optimisticItem,
        aggregateOrderStatus,
        recomputeOrderTotal,
      ),
    )
    kdsSyncLog("local_update", {
      itemId,
      orderId,
      previousStatus,
      nextStatus,
      version,
      updatedAt: now,
    })
    this.setLastEvent("ITEM_STATUS_UPDATED")

    if (!isLikelyOrderUuid(itemId)) {
      this.endPending(itemId)
      return true
    }

    try {
      let apiResult: { ok: boolean; item?: OrderItem; error?: string }
      if (nextStatus === "accepted") {
        const res = await fetch(`/api/stations/items/${itemId}/accept`, { method: "POST" })
        const json = (await res.json().catch(() => ({}))) as {
          item?: Record<string, unknown>
          error?: string
        }
        apiResult = res.ok
          ? { ok: true, item: mapStationApiItemRow((json.item ?? {}) as never) }
          : { ok: false, error: json.error ?? `HTTP ${res.status}` }
      } else if (nextStatus === "preparing" || nextStatus === "ready" || nextStatus === "served") {
        const res = await fetch(`/api/stations/items/${itemId}/advance`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: nextStatus }),
        })
        const json = (await res.json().catch(() => ({}))) as {
          item?: Record<string, unknown>
          error?: string
        }
        apiResult = res.ok
          ? { ok: true, item: mapStationApiItemRow((json.item ?? {}) as never) }
          : { ok: false, error: json.error ?? `HTTP ${res.status}` }
      } else {
        apiResult = { ok: true }
      }

      if (apiResult.ok && apiResult.item) {
        kdsSyncLog("api_response", {
          itemId,
          orderId,
          previousStatus,
          nextStatus: apiResult.item.item_status,
          updatedAt: apiResult.item.status_updated_at,
          version,
        })
        this.setOrders((prev) =>
          applyServerItemToOrders(
            prev,
            orderId,
            { ...apiResult.item!, status_version: version },
            version,
            aggregateOrderStatus,
            recomputeOrderTotal,
          ),
        )
      } else if (!apiResult.ok) {
        kdsSyncLog("api_error", {
          itemId,
          orderId,
          previousStatus,
          nextStatus,
          reason: apiResult.error,
        })
      }
      return apiResult.ok
    } catch (err) {
      kdsSyncLog("api_error", {
        itemId,
        orderId,
        previousStatus,
        nextStatus,
        reason: String(err),
      })
      return false
    } finally {
      this.endPending(itemId)
    }
  }

  updateOrderItem = (
    orderId: string,
    itemId: string,
    patch: { quantity?: number; notes?: string | undefined },
  ) => {
    this.setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o
        const items = o.items.map((it) => {
          if (it.id !== itemId) return it
          const nextQty =
            typeof patch.quantity === "number" && Number.isFinite(patch.quantity)
              ? Math.max(1, Math.floor(patch.quantity))
              : it.quantity
          const nextNotes = patch.notes !== undefined ? patch.notes || undefined : it.notes
          return { ...it, quantity: nextQty, notes: nextNotes }
        })
        const updated: KitchenOrder = {
          ...o,
          items,
          updated_at: new Date().toISOString(),
        }
        return { ...updated, total: recomputeOrderTotal(updated, o.total) }
      }),
    )
    this.setLastEvent("ITEM_UPDATED")
  }

  acceptOrderItem = async (orderId: string, itemId: string) =>
    this.updateItemStatus(orderId, itemId, "accepted")

  refuseOrderItem = async (
    orderId: string,
    itemId: string,
    reason: { code: RefusalReasonCode; note?: string; markWaste?: boolean },
  ): Promise<boolean> => {
    if (this.pendingMutations.has(itemId)) {
      kdsSyncLog("action_blocked", { itemId, orderId, reason: "mutation_in_flight" })
      return false
    }

    const order = this.orders.find((o) => o.id === orderId)
    const currentItem = order?.items.find((it) => it.id === itemId)
    if (!order || !currentItem) return false

    if (
      currentItem.item_status === "refused" ||
      currentItem.item_status === "replaced" ||
      currentItem.item_status === "cancelled" ||
      currentItem.item_status === "waste"
    ) {
      return false
    }

    const previousStatus = currentItem.item_status
    const targetStatus: ItemStatus = reason.markWaste ? "waste" : "refused"
    const now = new Date().toISOString()
    const optimisticItem = bumpItemVersion(
      {
        ...currentItem,
        item_status: targetStatus,
        refusal_reason_code: reason.code,
        refusal_note: reason.note?.trim() || undefined,
        refused_at: now,
        billable: false,
      },
      now,
    )
    const version = optimisticItem.status_version ?? 1

    this.beginPending({
      itemId,
      orderId,
      previousStatus,
      expectedStatus: targetStatus,
      version,
      startedAt: Date.now(),
    })

    this.setOrders((prev) =>
      applyItemPatchToOrders(
        prev,
        orderId,
        itemId,
        optimisticItem,
        aggregateOrderStatus,
        recomputeOrderTotal,
      ),
    )
    this.setLastEvent("ITEM_REFUSED")

    if (!isLikelyOrderUuid(itemId)) {
      this.endPending(itemId)
      return true
    }

    try {
      const res = await fetch(`/api/stations/items/${itemId}/refuse`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reason_code: reason.code,
          reason_note: reason.note || undefined,
          mark_waste: reason.markWaste ?? false,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        item?: Record<string, unknown>
        error?: string
      }

      if (res.ok && json.item) {
        const serverItem = mapStationApiItemRow(json.item as never)
        this.setOrders((prev) =>
          applyServerItemToOrders(
            prev,
            orderId,
            { ...serverItem, status_version: version },
            version,
            aggregateOrderStatus,
            recomputeOrderTotal,
          ),
        )
        return true
      }

      if (res.status !== 503 && res.status !== 404) {
        kdsSyncLog("api_error", {
          itemId,
          orderId,
          reason: json.error ?? `HTTP ${res.status}`,
        })
      }
      return res.ok || res.status === 503 || res.status === 404
    } catch (err) {
      kdsSyncLog("api_error", { itemId, orderId, reason: String(err) })
      return false
    } finally {
      this.endPending(itemId)
    }
  }

  replaceOrderItem = (
    orderId: string,
    itemId: string,
    replacement: {
      name: string
      quantity: number
      unit_price?: number
      station: Station
      notes?: string
      reason?: { code: RefusalReasonCode; note?: string }
    },
  ) => {
    let newItem: OrderItem | null = null
    this.setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o
        const idx = o.items.findIndex((it) => it.id === itemId)
        if (idx === -1) return o
        const original = o.items[idx]
        if (original.item_status === "served" || original.item_status === "replaced") return o
        const now = new Date().toISOString()
        const newId = `${orderId}-r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        newItem = {
          id: newId,
          name: replacement.name,
          quantity: Math.max(1, Math.floor(replacement.quantity)),
          notes: replacement.notes,
          station: replacement.station,
          item_status: "accepted",
          unit_price: replacement.unit_price,
          replacement_of_item_id: original.id,
          billable: true,
        }
        const items = o.items.map((it, i) => {
          if (i !== idx) return it
          return {
            ...it,
            item_status: "replaced" as ItemStatus,
            refusal_reason_code: replacement.reason?.code,
            refusal_note: replacement.reason?.note?.trim() || undefined,
            refused_at: now,
            replaced_by_item_id: newId,
            billable: false,
          }
        })
        items.push(newItem)
        const updated: KitchenOrder = {
          ...o,
          items,
          status: aggregateOrderStatus(items),
          updated_at: now,
        }
        return { ...updated, total: recomputeOrderTotal(updated, o.total) }
      }),
    )
    if (newItem) this.setLastEvent("ITEM_REPLACED")
    return newItem
  }

  cancelOrderItem = (orderId: string, itemId: string, reason: string) => {
    const cleanReason = reason.trim()
    if (cleanReason.length < 3) return false
    let didCancel = false
    this.setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o
        const now = new Date().toISOString()
        const items = o.items.map((it) => {
          if (it.id !== itemId) return it
          if (it.item_status === "cancelled") return it
          didCancel = true
          return {
            ...it,
            item_status: "cancelled" as ItemStatus,
            cancel_reason: cleanReason,
            cancelled_at: now,
          }
        })
        const updated: KitchenOrder = {
          ...o,
          items,
          status: aggregateOrderStatus(items),
          updated_at: now,
        }
        return { ...updated, total: recomputeOrderTotal(updated, o.total) }
      }),
    )
    if (didCancel) this.setLastEvent("ITEM_CANCELLED")
    return didCancel
  }

  transferTableNumber = (from: number, to: number) => {
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return
    this.setOrders((prev) =>
      prev.map((o) =>
        Number(o.table_number) === Number(from)
          ? { ...o, table_number: to, updated_at: new Date().toISOString() }
          : o,
      ),
    )
    this.setLastEvent("ORDER_TABLE_TRANSFERRED")
  }

  clearTableOrders = (tableNumber: number) => {
    if (!Number.isFinite(tableNumber)) return 0
    let removed = 0
    this.setOrders((prev) => {
      const next = prev.filter((o) => {
        const match = Number(o.table_number) === Number(tableNumber)
        if (match) removed += 1
        return !match
      })
      return next
    })
    this.setLastEvent("ORDER_TABLE_CLEARED")
    return removed
  }
}

export const realtimeOrdersStore = new RealtimeOrdersStore()
