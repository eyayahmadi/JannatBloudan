"use client"

import { useEffect, useState, useCallback } from "react"
import type { Station, ItemStatus } from "@/lib/stations/config"
import { inferStation } from "@/lib/stations/inference"

export type OrderStatus = "received" | "preparing" | "ready" | "delivering" | "completed" | "cancelled"
export type OrderType = "qr_self_service" | "server" | "pos" | "delivery"

export type OrderItem = {
  id: string
  name: string
  quantity: number
  notes?: string
  station: Station
  item_status: ItemStatus
  /** Timestamps pour calcul de retard */
  started_at?: string
  ready_at?: string
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
  started_at?: string
  ready_at?: string
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

function loadOrders(): KitchenOrder[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown
    if (!Array.isArray(raw)) return []
    // Backward compat: ajoute id/station/item_status si absents
    return (raw as KitchenOrder[]).map((o) => ({
      ...o,
      items: (o.items ?? []).map((it, idx) => ({
        id: (it as OrderItem).id ?? `${o.id}-${idx}`,
        name: it.name,
        quantity: it.quantity,
        notes: it.notes,
        station: (it as OrderItem).station ?? inferStation(it.name),
        item_status: (it as OrderItem).item_status ?? mapOrderStatusToItem(o.status),
        started_at: (it as OrderItem).started_at,
        ready_at: (it as OrderItem).ready_at,
      })),
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
 * Sinon → "received"
 */
function aggregateOrderStatus(items: OrderItem[]): OrderStatus {
  if (items.length === 0) return "received"
  if (items.every((it) => it.item_status === "served" || it.item_status === "ready")) return "ready"
  if (items.some((it) => it.item_status === "preparing")) return "preparing"
  return "received"
}

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>(loadOrders)
  const [lastEvent, setLastEvent] = useState<string | null>(null)

  useEffect(() => {
    persistOrders(orders)
  }, [orders])

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
   */
  const updateItemStatus = useCallback(
    (orderId: string, itemId: string, nextStatus: ItemStatus) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o
          const items = o.items.map((it) => {
            if (it.id !== itemId) return it
            const now = new Date().toISOString()
            return {
              ...it,
              item_status: nextStatus,
              started_at: nextStatus === "preparing" && !it.started_at ? now : it.started_at,
              ready_at: nextStatus === "ready" && !it.ready_at ? now : it.ready_at,
            }
          })
          return {
            ...o,
            items,
            status: aggregateOrderStatus(items),
            updated_at: new Date().toISOString(),
          }
        }),
      )
      setLastEvent("ITEM_STATUS_UPDATED")
    },
    [],
  )

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

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue))
        } catch { /* ignore */ }
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
    getByStatus,
    getStationItems,
    lastEvent,
  }
}
