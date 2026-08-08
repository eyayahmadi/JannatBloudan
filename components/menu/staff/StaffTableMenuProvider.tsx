"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useParams, useRouter } from "next/navigation"
import { useMenuCatalog } from "@/lib/hooks/useMenuCatalog"
import { useResolvedRestaurantTable } from "@/lib/hooks/useResolvedRestaurantTable"
import { useFloorPlanTables } from "@/lib/hooks/useFloorPlanTables"
import { isNeedsCleaningStatus } from "@/lib/table-lifecycle"
import { mapApiToQrMenuItem } from "@/lib/menu/qr-menu-helpers"
import {
  buildQrCategoryNavItems,
  getPrintedBlockForCategory,
  QR_DEFAULT_CATEGORY_SLUG,
  type QrCategoryNavItem,
} from "@/lib/menu/qr-printed-menu"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import {
  mergeStaffCartLine,
  staffCartLineFromAdd,
  staffCartToOrderItems,
  staffCartTotal,
  type StaffCartLine,
  type StaffMenuAddPayload,
} from "@/lib/menu/staff-cart"
import { useRealtimeOrders, type KitchenOrderInput } from "@/lib/hooks/useRealtimeOrders"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { audienceForStationsFromItems } from "@/lib/notifications/audience"
import { captureProductSheetScroll } from "@/lib/menu/product-sheet-scroll"
import { useProductSheetLock } from "@/lib/hooks/useProductSheetLock"
import type { DigitalMenuProduct } from "@/lib/menu/digital-menu-product"

const CART_KEY_PREFIX = "jb-staff-table-cart:"

type StaffTableMenuContextValue = {
  tableId: string
  displayLabel: string
  effectiveNumber: number | null
  menuItems: QrMenuItem[]
  catalog: DigitalMenuProduct[]
  categoryRows: Array<{ id: string; name: string; slug: string; section?: string; display_order?: number; icon_emoji?: string | null; name_ar?: string | null; nav_group?: string | null; card_gradient?: string | null }>
  categoryNavItems: QrCategoryNavItem[]
  loading: boolean
  cart: StaffCartLine[]
  cartCount: number
  cartTotal: number
  detailItemId: string | null
  detailItem: QrMenuItem | null
  submitting: boolean
  openDetail: (item: QrMenuItem) => void
  closeDetail: () => void
  addToCart: (payload: StaffMenuAddPayload) => void
  updateCartQty: (lineId: string, delta: number) => void
  removeCartLine: (lineId: string) => void
  submitOrder: () => Promise<boolean>
  navigateToCategory: (slug: string) => void
  getCategoryBlock: (slug: string) => ReturnType<typeof getPrintedBlockForCategory>
}

const StaffTableMenuContext = createContext<StaffTableMenuContextValue | null>(null)

export function useStaffTableMenu() {
  const ctx = useContext(StaffTableMenuContext)
  if (!ctx) throw new Error("useStaffTableMenu must be used within StaffTableMenuProvider")
  return ctx
}

export function StaffTableMenuProvider({ children }: { children: ReactNode }) {
  const { tableId } = useParams<{ tableId: string }>()
  const router = useRouter()
  const { effectiveNumber, displayLabel } = useResolvedRestaurantTable(tableId)
  const { tables } = useFloorPlanTables()
  const { catalog, data: menuData, loading } = useMenuCatalog({ pollMs: 15_000 })
  const { addOrder } = useRealtimeOrders()
  const { add: addNotification } = useNotifications()

  const cartStorageKey = `${CART_KEY_PREFIX}${tableId}`

  const [cart, setCart] = useState<StaffCartLine[]>([])
  const [detailItemId, setDetailItemId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useProductSheetLock(Boolean(detailItemId))

  const floorRow = useMemo(() => {
    const num = effectiveNumber
    return tables.find(
      (t) =>
        (num != null && Number(t.table_number) === num) ||
        String(t.table_code ?? "") === String(tableId),
    )
  }, [tables, effectiveNumber, tableId])

  const needsCleaning =
    floorRow?.unified_status === "CLEANING" ||
    isNeedsCleaningStatus(floorRow?.restaurant_status) ||
    String(floorRow?.payment_status_code ?? "").toUpperCase() === "NEEDS_CLEANING"

  useEffect(() => {
    if (!loading && needsCleaning) {
      router.replace(`/server/${tableId}?view=cleaning`)
    }
  }, [loading, needsCleaning, router, tableId])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(cartStorageKey)
      if (raw) setCart(JSON.parse(raw) as StaffCartLine[])
    } catch {
      /* ignore */
    }
  }, [cartStorageKey])

  useEffect(() => {
    try {
      sessionStorage.setItem(cartStorageKey, JSON.stringify(cart))
    } catch {
      /* ignore */
    }
  }, [cart, cartStorageKey])

  const menuItems = useMemo(
    () => catalog.map((p) => mapApiToQrMenuItem(p, menuData?.station_availability ?? [])),
    [catalog, menuData?.station_availability],
  )

  const categoryRows = menuData?.categories ?? []

  const categoryNavItems = useMemo(
    () => buildQrCategoryNavItems(categoryRows),
    [categoryRows],
  )

  const detailItem = useMemo(
    () => menuItems.find((i) => i.id === detailItemId) ?? null,
    [menuItems, detailItemId],
  )

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0)
  const cartTotal = staffCartTotal(cart)

  const openDetail = useCallback((item: QrMenuItem) => {
    captureProductSheetScroll()
    setDetailItemId(item.id)
  }, [])

  const closeDetail = useCallback(() => setDetailItemId(null), [])

  const addToCart = useCallback((payload: StaffMenuAddPayload) => {
    setCart((prev) => mergeStaffCartLine(prev, staffCartLineFromAdd(payload)))
  }, [])

  const updateCartQty = useCallback((lineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.lineId === lineId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    )
  }, [])

  const removeCartLine = useCallback((lineId: string) => {
    setCart((prev) => prev.filter((l) => l.lineId !== lineId))
  }, [])

  const navigateToCategory = useCallback(
    (slug: string) => {
      router.push(`/server/${tableId}/menu/${slug}`)
    },
    [router, tableId],
  )

  const getCategoryBlock = useCallback(
    (slug: string) => getPrintedBlockForCategory(menuItems, menuData?.categories ?? [], slug),
    [menuItems, menuData?.categories],
  )

  const submitOrder = useCallback(async () => {
    if (cart.length === 0) return false
    setSubmitting(true)
    try {
      const orderNumber = String(1000 + Math.floor(Math.random() * 9000))
      const payload = {
        tableRef: String(tableId),
        orderNumber,
        items: cart.map((l) => {
          const orderItem = staffCartToOrderItems([l])[0]
          const extraNote = l.note?.trim()
          const notes = [orderItem.notes, extraNote].filter(Boolean).join("\n") || undefined
          return { ...orderItem, notes }
        }),
        total: Math.round(cartTotal * 100) / 100,
      }

      const res = await fetch("/api/orders/server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) return false

      const o = json.order
      const order: KitchenOrderInput = {
        id: o.id,
        order_number: o.order_number,
        table_number: Number(o.table_number ?? effectiveNumber ?? tableId),
        order_type: "server",
        status: "received",
        items: (o.items ?? []).map(
          (it: {
            id: string
            name: string
            name_ar?: string | null
            quantity: number
            unit_price?: number
            notes?: string
            station?: string
            item_status?: string
          }) => ({
            id: it.id,
            name: it.name,
            name_ar: it.name_ar ?? null,
            quantity: it.quantity,
            notes: it.notes,
            unit_price: it.unit_price,
            station: it.station,
            item_status: it.item_status ?? "new",
          }),
        ),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customer_name: "Serveur",
        total: Number(o.total ?? cartTotal),
      }
      addOrder(order)
      setCart([])
      sessionStorage.removeItem(cartStorageKey)
      addNotification({
        type: "new_order",
        title: "Nouvelle commande",
        message: `Commande ${o.order_number} — Table ${displayLabel}`,
        audience: audienceForStationsFromItems(order.items),
      })
      return true
    } catch {
      return false
    } finally {
      setSubmitting(false)
    }
  }, [
    cart,
    tableId,
    cartTotal,
    effectiveNumber,
    displayLabel,
    addOrder,
    addNotification,
    cartStorageKey,
  ])

  const value: StaffTableMenuContextValue = {
    tableId,
    displayLabel,
    effectiveNumber,
    menuItems,
    catalog,
    categoryRows,
    categoryNavItems,
    loading,
    cart,
    cartCount,
    cartTotal,
    detailItemId,
    detailItem,
    submitting,
    openDetail,
    closeDetail,
    addToCart,
    updateCartQty,
    removeCartLine,
    submitOrder,
    navigateToCategory,
    getCategoryBlock,
  }

  return (
    <StaffTableMenuContext.Provider value={value}>{children}</StaffTableMenuContext.Provider>
  )
}

export { QR_DEFAULT_CATEGORY_SLUG }
