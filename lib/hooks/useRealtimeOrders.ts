"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { onRealtimeRefresh, scopeMatches } from "@/lib/realtime/bus"
import {
  isBillableItemStatus,
  type Station,
  type ItemStatus,
} from "@/lib/stations/config"
import type { RefusalReasonCode } from "@/lib/stations/refusal-reasons"
import { inferStation } from "@/lib/stations/inference"
import {
  applyItemPatchToOrders,
  applyServerItemToOrders,
  bumpItemVersion,
  kdsSyncLog,
  mapStationApiItemRow,
  mergeKitchenOrders,
  type PendingItemMutation,
} from "@/lib/orders/kds-sync"
import { isLikelyOrderUuid } from "@/lib/orders/guest-tracking"

export type OrderStatus = "received" | "preparing" | "ready" | "delivering" | "completed" | "cancelled"
export type OrderType = "qr_self_service" | "server" | "pos" | "delivery"

export type OrderItem = {
  id: string
  name: string
  quantity: number
  notes?: string
  station: Station
  item_status: ItemStatus
  /** Prix unitaire (si fourni à la création — sert au recalcul du total). */
  unit_price?: number
  /** Raison d'annulation (item_status === "cancelled"). */
  cancel_reason?: string
  cancelled_at?: string
  /** Refus côté station */
  refusal_reason_code?: RefusalReasonCode
  refusal_note?: string
  refused_at?: string
  /** Lien de remplacement (chaîne avant/après). */
  replacement_of_item_id?: string
  replaced_by_item_id?: string
  /** Faux pour les items refusés / annulés / remplacés / waste. */
  billable?: boolean
  /** Timestamps pour calcul de retard */
  started_at?: string
  ready_at?: string
  accepted_at?: string
  served_at?: string
  /** Version client monotonique — évite les écrasements stale. */
  status_version?: number
  /** Dernière mutation connue (client ou serveur). */
  status_updated_at?: string
}

/**
 * Type "input" pour les appelants qui ne fournissent pas encore
 * station / item_status (retrocompat). Ces champs seront ajoutes
 * automatiquement dans `addOrder`.
 */
export type OrderItemInput = {
  id?: string
  name: string
  quantity: number
  notes?: string
  station?: Station
  item_status?: ItemStatus
  unit_price?: number
  cancel_reason?: string
  cancelled_at?: string
  refusal_reason_code?: RefusalReasonCode
  refusal_note?: string
  refused_at?: string
  replacement_of_item_id?: string
  replaced_by_item_id?: string
  billable?: boolean
  started_at?: string
  ready_at?: string
  accepted_at?: string
  served_at?: string
  status_version?: number
  status_updated_at?: string
}

export type KitchenOrder = {
  id: string
  order_number: string
  table_number: number | null
  order_type: OrderType
  status: OrderStatus
  items: OrderItem[]
  created_at: string
  updated_at: string
  customer_name?: string
  server_name?: string
  total: number
}

/** Shape accepte par `addOrder` (items partiels). */
export type KitchenOrderInput = Omit<KitchenOrder, "items"> & {
  items: OrderItemInput[]
}

const STORAGE_KEY = "jb-realtime-orders"
const LIVE_SYNC_MS = 4000

/** Routes staff où les commandes QR doivent remonter depuis Supabase. */
function shouldSyncOrdersFromServer(): boolean {
  if (typeof window === "undefined") return false
  return /^\/(kitchen|bar|shisha|server|pos|caisse|admin|table)(\/|$)/.test(window.location.pathname)
}

function mergeLocalAndServerOrders(
  local: KitchenOrder[],
  server: KitchenOrder[],
  pending: ReadonlyMap<string, PendingItemMutation>,
  source: "polling" | "realtime" | "storage",
) {
  return mergeKitchenOrders(local, server, pending, source)
}

function loadOrders(): KitchenOrder[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown
    if (!Array.isArray(raw)) return []
    // Backward compat: ajoute id/station/item_status si absents
    return (raw as KitchenOrder[]).map((o) => ({
      ...o,
      items: (o.items ?? []).map((it, idx) => {
        const cast = it as OrderItem
        return {
          id: cast.id ?? `${o.id}-${idx}`,
          name: it.name,
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

/**
 * Agrege le statut d'une commande a partir des statuts items.
 * Tous les items "ready" → order "ready"
 * Au moins un item "preparing" → order "preparing"
 * Tous annulés → order "cancelled"
 * Sinon → "received"
 */
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
  if (active.some((it) => it.item_status === "preparing" || it.item_status === "accepted")) return "preparing"
  return "received"
}

/**
 * Recalcule le total d'une commande à partir de ses items actifs.
 * Conserve la logique existante si aucun unit_price n'est connu.
 */
function recomputeOrderTotal(order: KitchenOrder, fallback: number): number {
  const haveUnitPrices = order.items.some((it) => typeof it.unit_price === "number")
  if (!haveUnitPrices) return fallback
  const total = order.items
    .filter((it) => isBillableItemStatus(it.item_status))
    .reduce((s, it) => s + (Number(it.unit_price) || 0) * (Number(it.quantity) || 0), 0)
  return Math.round(total * 100) / 100
}

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>(loadOrders)
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const [pendingItemIds, setPendingItemIds] = useState<Set<string>>(() => new Set())
  const knownServerOrderIds = useRef<Set<string>>(new Set())
  const pendingMutationsRef = useRef<Map<string, PendingItemMutation>>(new Map())
  const ordersRef = useRef(orders)
  const pullInFlightRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    ordersRef.current = orders
  }, [orders])

  const syncPendingIds = useCallback(() => {
    setPendingItemIds(new Set(pendingMutationsRef.current.keys()))
  }, [])

  const beginPendingMutation = useCallback(
    (mutation: PendingItemMutation) => {
      pendingMutationsRef.current.set(mutation.itemId, mutation)
      syncPendingIds()
      kdsSyncLog("action_start", {
        itemId: mutation.itemId,
        orderId: mutation.orderId,
        previousStatus: mutation.previousStatus,
        nextStatus: mutation.expectedStatus,
        version: mutation.version,
      })
    },
    [syncPendingIds],
  )

  const endPendingMutation = useCallback(
    (itemId: string) => {
      pendingMutationsRef.current.delete(itemId)
      syncPendingIds()
    },
    [syncPendingIds],
  )

  useEffect(() => {
    persistOrders(orders)
  }, [orders])

  useEffect(() => {
    if (!shouldSyncOrdersFromServer()) return

    let cancelled = false

    const doPull = async (source: "polling" | "realtime") => {
      try {
        const res = await fetch("/api/orders/live", { cache: "no-store" })
        if (!res.ok) return
        const json = (await res.json()) as { orders?: KitchenOrder[] }
        const serverOrders = Array.isArray(json.orders) ? json.orders : []
        if (cancelled) return

        kdsSyncLog(source, {
          reason: `payload_orders=${serverOrders.length}`,
        })

        let hasNew = false
        for (const o of serverOrders) {
          if (!knownServerOrderIds.current.has(o.id)) {
            knownServerOrderIds.current.add(o.id)
            if (isLikelyOrderUuid(o.id)) hasNew = true
          }
        }

        setOrders((prev) =>
          mergeLocalAndServerOrders(prev, serverOrders, pendingMutationsRef.current, source),
        )
        if (hasNew) setLastEvent("NEW_ORDER")
      } catch {
        /* réseau / auth — on garde le local */
      }
    }

    const pull = (source: "polling" | "realtime") => {
      if (pullInFlightRef.current) {
        return pullInFlightRef.current
      }
      const run = doPull(source).finally(() => {
        pullInFlightRef.current = null
      })
      pullInFlightRef.current = run
      return run
    }

    void pull("polling")
    const id = window.setInterval(() => void pull("polling"), LIVE_SYNC_MS)
    const unsub = onRealtimeRefresh((scope) => {
      if (scopeMatches("orders", scope)) void pull("realtime")
    })
    return () => {
      cancelled = true
      window.clearInterval(id)
      unsub()
    }
  }, [])

  const addOrder = useCallback((order: KitchenOrderInput) => {
    setOrders((prev) => {
      const exists = prev.find((o) => o.id === order.id)
      if (exists) return prev
      // Garantit que chaque item a un id + station + item_status
      const normalized: KitchenOrder = {
        ...order,
        items: order.items.map((it, idx) => ({
          id: it.id ?? `${order.id}-${idx}`,
          name: it.name,
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
    setLastEvent("NEW_ORDER")
  }, [])

  const updateStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o,
      ),
    )
    setLastEvent("ORDER_STATUS_UPDATED")
  }, [])

  /**
   * Met a jour le statut d'un item specifique et reagrege le statut global.
   * Verrouille l'item pendant l'appel API et ignore les refresh stale.
   */
  const updateItemStatus = useCallback(
    async (orderId: string, itemId: string, nextStatus: ItemStatus): Promise<boolean> => {
      if (pendingMutationsRef.current.has(itemId)) {
        kdsSyncLog("action_blocked", {
          itemId,
          orderId,
          nextStatus,
          reason: "mutation_in_flight",
        })
        return false
      }

      const order = ordersRef.current.find((o) => o.id === orderId)
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

      beginPendingMutation({
        itemId,
        orderId,
        previousStatus,
        expectedStatus: nextStatus,
        version,
        startedAt: Date.now(),
      })

      setOrders((prev) =>
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
      setLastEvent("ITEM_STATUS_UPDATED")

      if (!isLikelyOrderUuid(itemId)) {
        endPendingMutation(itemId)
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
        } else if (
          nextStatus === "preparing" ||
          nextStatus === "ready" ||
          nextStatus === "served"
        ) {
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
          setOrders((prev) =>
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
        endPendingMutation(itemId)
      }
    },
    [beginPendingMutation, endPendingMutation],
  )

  /**
   * Met à jour un item (quantité ou note) sans changer son statut KDS.
   * Recalcule le total si les unit_price sont connus.
   */
  const updateOrderItem = useCallback(
    (
      orderId: string,
      itemId: string,
      patch: { quantity?: number; notes?: string | undefined },
    ) => {
      setOrders((prev) =>
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
      setLastEvent("ITEM_UPDATED")
    },
    [],
  )

  /**
   * Accepte un item (passe `new` → `accepted`). Aucune autre transition.
   */
  const acceptOrderItem = useCallback(
    async (orderId: string, itemId: string) => updateItemStatus(orderId, itemId, "accepted"),
    [updateItemStatus],
  )

  /**
   * Refuse un item avec un code raison + note libre. Le total et le statut
   * global de la commande sont recalculés. Si markWaste=true, on passe à
   * "waste" (item préparé puis perdu, conserve la trace en perte).
   */
  const refuseOrderItem = useCallback(
    async (
      orderId: string,
      itemId: string,
      reason: { code: RefusalReasonCode; note?: string; markWaste?: boolean },
    ): Promise<boolean> => {
      if (pendingMutationsRef.current.has(itemId)) {
        kdsSyncLog("action_blocked", {
          itemId,
          orderId,
          reason: "mutation_in_flight",
        })
        return false
      }

      const order = ordersRef.current.find((o) => o.id === orderId)
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

      beginPendingMutation({
        itemId,
        orderId,
        previousStatus,
        expectedStatus: targetStatus,
        version,
        startedAt: Date.now(),
      })

      setOrders((prev) =>
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
        nextStatus: targetStatus,
        version,
        updatedAt: now,
      })
      setLastEvent("ITEM_REFUSED")

      if (!isLikelyOrderUuid(itemId)) {
        endPendingMutation(itemId)
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
          kdsSyncLog("api_response", {
            itemId,
            orderId,
            previousStatus,
            nextStatus: serverItem.item_status,
            updatedAt: serverItem.status_updated_at,
            version,
          })
          setOrders((prev) =>
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
            previousStatus,
            nextStatus: targetStatus,
            reason: json.error ?? `HTTP ${res.status}`,
          })
        }
        return res.ok || res.status === 503 || res.status === 404
      } catch (err) {
        kdsSyncLog("api_error", {
          itemId,
          orderId,
          previousStatus,
          nextStatus: targetStatus,
          reason: String(err),
        })
        return false
      } finally {
        endPendingMutation(itemId)
      }
    },
    [beginPendingMutation, endPendingMutation],
  )

  /**
   * Remplace un item refusé (ou pas encore refusé) par un nouvel item.
   * L'ancien passe à "replaced", le nouveau est ajouté avec
   * `replacement_of_item_id` qui pointe vers l'ancien.
   */
  const replaceOrderItem = useCallback(
    (
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
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o
          const idx = o.items.findIndex((it) => it.id === itemId)
          if (idx === -1) return o
          const original = o.items[idx]
          if (
            original.item_status === "served" ||
            original.item_status === "replaced"
          ) {
            return o
          }
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
      if (newItem) setLastEvent("ITEM_REPLACED")
      return newItem
    },
    [],
  )

  /**
   * Annule un item spécifique avec une raison. Le total est recalculé
   * si les prix unitaires sont connus. Le statut global de la commande
   * est ré-agrégé (passe à "cancelled" si tous les items le sont).
   */
  const cancelOrderItem = useCallback(
    (orderId: string, itemId: string, reason: string) => {
      const cleanReason = reason.trim()
      if (cleanReason.length < 3) return false
      let didCancel = false
      setOrders((prev) =>
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
      if (didCancel) setLastEvent("ITEM_CANCELLED")
      return didCancel
    },
    [],
  )

  /**
   * Déplace toutes les commandes locales d'une table vers une autre.
   * Utilisé quand Supabase n'a pas (encore) de session pour cette table
   * ou en complément du transfert serveur (fallback démo).
   */
  const transferTableNumber = useCallback((from: number, to: number) => {
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return
    setOrders((prev) =>
      prev.map((o) =>
        Number(o.table_number) === Number(from)
          ? { ...o, table_number: to, updated_at: new Date().toISOString() }
          : o,
      ),
    )
    setLastEvent("ORDER_TABLE_TRANSFERRED")
  }, [])

  /**
   * Vide les commandes locales d'une table (table libérée après paiement).
   * Les commandes sont retirées du KDS local pour repasser la table en FREE.
   */
  const clearTableOrders = useCallback((tableNumber: number) => {
    if (!Number.isFinite(tableNumber)) return 0
    let removed = 0
    setOrders((prev) => {
      const next = prev.filter((o) => {
        const match = Number(o.table_number) === Number(tableNumber)
        if (match) removed += 1
        return !match
      })
      return next
    })
    setLastEvent("ORDER_TABLE_CLEARED")
    return removed
  }, [])

  const getByStatus = useCallback(
    (status: OrderStatus) => orders.filter((o) => o.status === status),
    [orders],
  )

  /**
   * Retourne uniquement les items d'une station donnee (+ info de commande).
   */
  const getStationItems = useCallback(
    (station: Station) =>
      orders.flatMap((o) =>
        o.items
          .filter((it) => it.station === station)
          .map((it) => ({
            order: o,
            item: it,
          })),
      ),
    [orders],
  )

  const isItemPending = useCallback(
    (itemId: string) => pendingItemIds.has(itemId),
    [pendingItemIds],
  )

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const incoming = JSON.parse(e.newValue) as KitchenOrder[]
          setOrders((prev) =>
            mergeLocalAndServerOrders(prev, incoming, pendingMutationsRef.current, "storage"),
          )
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  return {
    orders,
    addOrder,
    updateStatus,
    updateItemStatus,
    updateOrderItem,
    cancelOrderItem,
    acceptOrderItem,
    refuseOrderItem,
    replaceOrderItem,
    transferTableNumber,
    clearTableOrders,
    getByStatus,
    getStationItems,
    isItemPending,
    lastEvent,
  }
}
