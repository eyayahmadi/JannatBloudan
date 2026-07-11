"use client"

import { useCallback, useSyncExternalStore } from "react"
import type { ItemStatus } from "@/lib/stations/config"
import { realtimeOrdersStore } from "@/lib/orders/realtime-orders-store"

export type OrderStatus = "received" | "preparing" | "ready" | "delivering" | "completed" | "cancelled"
export type OrderType = "qr_self_service" | "server" | "pos" | "delivery"

export type OrderItem = {
  id: string
  name: string
  name_ar?: string | null
  quantity: number
  notes?: string
  station: import("@/lib/stations/config").Station
  item_status: ItemStatus
  unit_price?: number
  cancel_reason?: string
  cancelled_at?: string
  refusal_reason_code?: import("@/lib/stations/refusal-reasons").RefusalReasonCode
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

export type OrderItemInput = {
  id?: string
  name: string
  name_ar?: string | null
  quantity: number
  notes?: string
  station?: import("@/lib/stations/config").Station
  item_status?: ItemStatus
  unit_price?: number
  cancel_reason?: string
  cancelled_at?: string
  refusal_reason_code?: import("@/lib/stations/refusal-reasons").RefusalReasonCode
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

export type KitchenOrderInput = Omit<KitchenOrder, "items"> & {
  items: OrderItemInput[]
}

/** Subscribe only to pending state for one item — avoids full-board rerenders. */
export function useItemPending(itemId: string): boolean {
  return useSyncExternalStore(
    realtimeOrdersStore.subscribePending,
    () => realtimeOrdersStore.isItemPending(itemId),
    () => false,
  )
}

/**
 * Hook KDS partagé — tous les composants lisent le même store singleton
 * (une seule sync polling/realtime, une seule source de vérité).
 */
export function useRealtimeOrders() {
  const orders = useSyncExternalStore(
    realtimeOrdersStore.subscribe,
    realtimeOrdersStore.getOrders,
    () => [] as KitchenOrder[],
  )

  const lastEvent = useSyncExternalStore(
    realtimeOrdersStore.subscribeLastEvent,
    realtimeOrdersStore.getLastEvent,
    () => null,
  )

  const isItemPending = useCallback(
    (itemId: string) => realtimeOrdersStore.isItemPending(itemId),
    [],
  )

  const getByStatus = useCallback(
    (status: OrderStatus) => orders.filter((o) => o.status === status),
    [orders],
  )

  const getStationItems = useCallback(
    (station: import("@/lib/stations/config").Station) =>
      orders.flatMap((o) =>
        o.items
          .filter((it) => it.station === station)
          .map((it) => ({ order: o, item: it })),
      ),
    [orders],
  )

  return {
    orders,
    addOrder: realtimeOrdersStore.addOrder,
    updateStatus: realtimeOrdersStore.updateStatus,
    updateItemStatus: realtimeOrdersStore.updateItemStatus,
    updateOrderItem: realtimeOrdersStore.updateOrderItem,
    cancelOrderItem: realtimeOrdersStore.cancelOrderItem,
    acceptOrderItem: realtimeOrdersStore.acceptOrderItem,
    refuseOrderItem: realtimeOrdersStore.refuseOrderItem,
    replaceOrderItem: realtimeOrdersStore.replaceOrderItem,
    transferTableNumber: realtimeOrdersStore.transferTableNumber,
    clearTableOrders: realtimeOrdersStore.clearTableOrders,
    getByStatus,
    getStationItems,
    isItemPending,
    lastEvent,
  }
}
