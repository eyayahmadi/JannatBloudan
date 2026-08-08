"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import type { OrderStatus } from "@/lib/hooks/useRealtimeOrders"
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders"
import { useResolvedRestaurantTable } from "@/lib/hooks/useResolvedRestaurantTable"
import { tableGuestCustomerName } from "@/lib/orders/customer-display"
import type { QrMenuCategoryRow } from "@/lib/menu/qr-table-category-chips"
import {
  buildQrCategoryNavItems,
  getPrintedBlockForCategory,
  type QrCategoryNavItem,
} from "@/lib/menu/qr-printed-menu"
import {
  emptyHomepageSectionsMap,
  resolveHomepageSectionProducts,
  type MenuHomepageSectionsMap,
} from "@/lib/menu/menu-homepage-sections"
import { mapApiToQrMenuItem, mergeQrMenuItems } from "@/lib/menu/qr-menu-helpers"
import { captureProductSheetScroll } from "@/lib/menu/product-sheet-scroll"
import { logMenuTelemetry } from "@/lib/menu/menu-telemetry"
import { onRealtimeRefresh, scopeMatches } from "@/lib/realtime/bus"
import { isMenuModalBlockingRefresh } from "@/lib/menu/menu-modal-guard"
import { isStableQrMenuPayload } from "@/lib/menu/menu-poll-stable"
import { getQrFavorites, getQrRecentlyOrdered, pushQrRecentlyOrdered, toggleQrFavorite } from "@/lib/menu/qr-guest-prefs"
import type { QrCartEntry, QrMenuItem } from "@/lib/menu/qr-menu-types"
import type { StationAvailability } from "@/lib/stations/availability"
import {
  buildCartLineId,
  formatKitchenTicketNotes,
  type CartExtra,
  type CartVariant,
} from "@/lib/menu/cart-line"
import {
  useMenuScrollPreservation,
  useSilentScrollRestore,
  MenuScrollGuardProvider,
} from "@/lib/menu/use-menu-scroll-preservation"

function mapQrApiStatus(raw: string | undefined): OrderStatus {
  const s = (raw ?? "").toLowerCase()
  if (s === "preparing" || s === "en préparation" || s === "en preparation") return "preparing"
  if (s === "ready" || s === "prête" || s === "prete") return "ready"
  if (s === "delivering" || s === "en livraison") return "delivering"
  if (s === "completed" || s === "livrée" || s === "livree") return "completed"
  if (s === "cancelled" || s === "annulée" || s === "annulee") return "cancelled"
  return "received"
}

type QrTableMenuContextValue = {
  tableId: string
  displayLabel: string
  effectiveNumber: number | null
  menuItems: QrMenuItem[]
  categoryRows: QrMenuCategoryRow[]
  categoryNavItems: QrCategoryNavItem[]
  homepageSections: MenuHomepageSectionsMap
  bestsellerItems: QrMenuItem[]
  todayItems: QrMenuItem[]
  oftenOrderedWith: Record<string, string[]>
  loading: boolean
  loadError: boolean
  offline: boolean
  loadMenu: (options?: { silent?: boolean }) => void
  cart: QrCartEntry[]
  cartCount: number
  cartTotal: number
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  submitting: boolean
  checkoutError: string | null
  clearCheckoutError: () => void
  favoriteIds: string[]
  detailItemId: string | null
  setDetailItemId: (id: string | null) => void
  detailItem: QrMenuItem | null
  activeOrder: { order_number: string; status: OrderStatus } | null
  handleToggleFavorite: (productId: string) => void
  getInCartQty: (item: QrMenuItem) => number
  handleQuickAdd: (item: QrMenuItem) => void
  openDetail: (item: QrMenuItem) => void
  closeDetail: () => void
  increment: (lineId: string) => void
  decrement: (lineId: string) => void
  addLineToCart: (payload: {
    productId: string
    name: string
    name_ar?: string | null
    image: string
    basePrice: number
    unitPrice: number
    variant: CartVariant | null
    extras: CartExtra[]
    quantity: number
    note?: string
  }) => void
  submitOrder: () => Promise<void>
  getCategoryBlock: (slug: string) => ReturnType<typeof getPrintedBlockForCategory>
  navigateToCategory: (slug: string) => void
}

const QrTableMenuContext = createContext<QrTableMenuContextValue | null>(null)

export function useQrTableMenu() {
  const ctx = useContext(QrTableMenuContext)
  if (!ctx) throw new Error("useQrTableMenu must be used within QrTableMenuProvider")
  return ctx
}

export function QrTableMenuProvider({ children }: { children: ReactNode }) {
  const { tableId } = useParams<{ tableId: string }>()
  const router = useRouter()
  const { t } = useI18n()
  const { addOrder, orders } = useRealtimeOrders()
  const { effectiveNumber, displayLabel } = useResolvedRestaurantTable(tableId)

  const [menuItems, setMenuItems] = useState<QrMenuItem[]>([])
  const [oftenOrderedWith, setOftenOrderedWith] = useState<Record<string, string[]>>({})
  const [categoryRows, setCategoryRows] = useState<QrMenuCategoryRow[]>([])
  const [homepageSections, setHomepageSections] = useState<MenuHomepageSectionsMap>(emptyHomepageSectionsMap())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [offline, setOffline] = useState(false)
  const [cart, setCart] = useState<QrCartEntry[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [detailItemId, setDetailItemId] = useState<string | null>(null)
  const [detailItemSnapshot, setDetailItemSnapshot] = useState<QrMenuItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  const menuItemsRef = useRef<QrMenuItem[]>([])
  const categoryRowsRef = useRef<QrMenuCategoryRow[]>([])
  const detailItemIdRef = useRef<string | null>(null)
  const cartOpenRef = useRef(false)
  const activeOrderFrozenRef = useRef<{ order_number: string; status: OrderStatus } | null>(null)
  menuItemsRef.current = menuItems
  categoryRowsRef.current = categoryRows
  detailItemIdRef.current = detailItemId
  cartOpenRef.current = cartOpen

  const {
    captureScrollForSilentRefresh,
    consumeSilentScrollRestore,
    notifyLayoutShift,
    silentRefreshPendingRef,
  } = useMenuScrollPreservation()

  useSilentScrollRestore(menuItems, consumeSilentScrollRestore, silentRefreshPendingRef)

  useEffect(() => {
    setFavoriteIds(getQrFavorites())
  }, [])

  const loadMenu = useCallback((options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    if (
      silent &&
      (detailItemIdRef.current ||
        cartOpenRef.current ||
        isMenuModalBlockingRefresh())
    ) {
      return
    }
    if (!silent) setLoading(true)
    setLoadError(false)
    setOffline(!navigator.onLine)

    fetch("/api/menu?include_unavailable=1")
      .then((res) => {
        if (!res.ok) throw new Error("menu fetch failed")
        return res.json()
      })
      .then((data) => {
        const rows = (data.categories ?? []) as QrMenuCategoryRow[]
        const stations = (data.station_availability as StationAvailability[]) ?? []
        const products = (data.items ?? []).map((p: Record<string, unknown>) =>
          mapApiToQrMenuItem(p, stations),
        )
        const merged = mergeQrMenuItems(menuItemsRef.current, products)

        if (
          silent &&
          menuItemsRef.current.length > 0 &&
          isStableQrMenuPayload(menuItemsRef.current, merged, categoryRowsRef.current, rows)
        ) {
          return
        }

        if (silent) captureScrollForSilentRefresh()

        setCategoryRows((prev) => {
          if (
            prev.length === rows.length &&
            prev.every(
              (c, i) =>
                c.id === rows[i]?.id &&
                c.slug === rows[i]?.slug &&
                c.name === rows[i]?.name,
            )
          ) {
            return prev
          }
          return rows
        })
        setOftenOrderedWith((data.often_ordered_with as Record<string, string[]>) ?? {})
        setHomepageSections({
          ...emptyHomepageSectionsMap(),
          ...((data.homepage_sections as MenuHomepageSectionsMap) ?? {}),
        })
        setMenuItems(merged)
      })
      .catch(() => {
        if (!silent) setLoadError(true)
        logMenuTelemetry("menu_poll_failed", { silent })
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [captureScrollForSilentRefresh])

  useEffect(() => {
    loadMenu()
    const id = window.setInterval(() => loadMenu({ silent: true }), 60_000)
    const unsub = onRealtimeRefresh((scope) => {
      if (scopeMatches("menu", scope)) loadMenu({ silent: true })
    })
    return () => {
      window.clearInterval(id)
      unsub()
    }
  }, [loadMenu])

  useEffect(() => {
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  const activeOrderLive = useMemo(() => {
    if (effectiveNumber == null) return null
    const order = orders.find(
      (o) =>
        String(o.table_number) === String(effectiveNumber) &&
        o.status !== "completed" &&
        o.status !== "cancelled",
    )
    if (!order) return null
    return { order_number: order.order_number, status: order.status }
  }, [orders, effectiveNumber])

  const backgroundFrozen = !!detailItemId || cartOpen
  if (!backgroundFrozen) {
    activeOrderFrozenRef.current = activeOrderLive
  }
  const activeOrder = backgroundFrozen ? activeOrderFrozenRef.current : activeOrderLive

  const categoryNavItems = useMemo(
    () => buildQrCategoryNavItems(categoryRows),
    [categoryRows],
  )

  const bestsellerItems = useMemo(
    () => resolveHomepageSectionProducts("bestseller", menuItems, homepageSections, 8),
    [menuItems, homepageSections],
  )

  const todayItems = useMemo(
    () => resolveHomepageSectionProducts("today_recommended", menuItems, homepageSections, 8),
    [menuItems, homepageSections],
  )

  const detailItem = detailItemId ? detailItemSnapshot : null

  const closeDetail = useCallback(() => {
    setDetailItemId(null)
    setDetailItemSnapshot(null)
  }, [])

  const setDetailItemIdWithSnapshot = useCallback((id: string | null) => {
    if (id === null) {
      closeDetail()
      return
    }
    const item = menuItemsRef.current.find((p) => p.id === id) ?? null
    if (item) {
      if (!detailItemIdRef.current) captureProductSheetScroll()
      setDetailItemSnapshot(item)
    }
    setDetailItemId(id)
  }, [closeDetail])

  const openDetail = useCallback((item: QrMenuItem) => {
    if (!detailItemIdRef.current) {
      captureProductSheetScroll()
    }
    setDetailItemSnapshot(item)
    setDetailItemId(item.id)
  }, [])

  useEffect(() => {
    if (detailItemId && !detailItemSnapshot && !loading) {
      setDetailItemId(null)
    }
  }, [detailItemId, detailItemSnapshot, loading])

  const addLineToCart = useCallback(
    (payload: {
      productId: string
      name: string
      name_ar?: string | null
      image: string
      basePrice: number
      unitPrice: number
      variant: CartVariant | null
      extras: CartExtra[]
      quantity: number
      note?: string
    }) => {
      if (menuItems.find((p) => p.id === payload.productId)?.soldOut) return
      const lineId = buildCartLineId(payload.productId, payload.extras, payload.variant, payload.note)
      setCart((prev) => {
        const existing = prev.find((c) => c.lineId === lineId)
        if (existing) {
          return prev.map((c) =>
            c.lineId === lineId ? { ...c, quantity: c.quantity + payload.quantity } : c,
          )
        }
        return [
          ...prev,
          {
            lineId,
            productId: payload.productId,
            name: payload.name,
            name_ar: payload.name_ar,
            image: payload.image,
            basePrice: payload.basePrice,
            price: payload.unitPrice,
            variant: payload.variant,
            extras: payload.extras,
            quantity: payload.quantity,
            note: payload.note,
          },
        ]
      })
    },
    [menuItems],
  )

  const handleQuickAdd = useCallback(
    (item: QrMenuItem) => {
      if (!item.canOrder) return
      addLineToCart({
        productId: item.id,
        name: item.name,
        name_ar: item.name_ar,
        image: item.image,
        basePrice: item.price,
        unitPrice: item.price,
        variant: null,
        extras: [],
        quantity: 1,
      })
    },
    [addLineToCart],
  )

  const handleToggleFavorite = useCallback((productId: string) => {
    setFavoriteIds(toggleQrFavorite(productId))
  }, [])

  const getInCartQty = useCallback(
    (item: QrMenuItem) => {
      if (item.isCustomizable || item.hasVariants) {
        return cart.filter((c) => c.productId === item.id).reduce((s, c) => s + c.quantity, 0)
      }
      const line = cart.find((c) => c.lineId === buildCartLineId(item.id, [], null))
      return line?.quantity ?? 0
    },
    [cart],
  )

  const increment = useCallback(
    (lineId: string) =>
      setCart((prev) =>
        prev.map((c) => (c.lineId === lineId ? { ...c, quantity: c.quantity + 1 } : c)),
      ),
    [],
  )

  const decrement = useCallback(
    (lineId: string) =>
      setCart((prev) => {
        const item = prev.find((c) => c.lineId === lineId)
        if (item && item.quantity > 1) {
          return prev.map((c) => (c.lineId === lineId ? { ...c, quantity: c.quantity - 1 } : c))
        }
        return prev.filter((c) => c.lineId !== lineId)
      }),
    [],
  )

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0)

  const submitOrder = useCallback(async () => {
    console.log("[QR CHECKOUT] clicked", {
      tableId,
      cartItems: cart.length,
      submitting,
      effectiveNumber,
    })

    if (submitting) {
      console.log("[QR CHECKOUT] blocked: already submitting")
      return
    }
    if (cart.length === 0) {
      console.log("[QR CHECKOUT] blocked: empty cart")
      return
    }

    const tableRef = String(tableId ?? "").trim()
    if (!tableRef) {
      console.error("[QR CHECKOUT] blocked: missing table ref from route")
      setCheckoutError(t("menu.tableNotFound"))
      return
    }

    setCheckoutError(null)
    setSubmitting(true)

    const items = cart.map((c) => {
      const menuItem = menuItemsRef.current.find((m) => m.id === c.productId)
      return {
        productId: c.productId,
        slug: menuItem?.slug ?? undefined,
        name: c.name,
        name_ar: c.name_ar ?? null,
        quantity: c.quantity,
        unitPrice: c.price,
        variantId: c.variant?.id ?? null,
        notes: formatKitchenTicketNotes(c.extras, c.variant, c.note),
      }
    })

    const requestBody: Record<string, unknown> = {
      tableRef,
      items,
      total: cartTotal,
    }
    if (effectiveNumber != null) {
      requestBody.orderNumber = `T${effectiveNumber}-${String(Math.floor(1000 + Math.random() * 9000))}`
    }

    console.log("[QR CHECKOUT] payload", requestBody)

    try {
      const response = await fetch("/api/orders/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const result = (await response.json().catch(() => null)) as {
        order?: {
          id?: string
          order_number?: string
          table_number?: number
          total?: number
          status?: string
          items?: Array<{
            id?: string
            name: string
            name_ar?: string | null
            quantity: number
            unitPrice?: number
            notes?: string
            station?: string
            item_status?: string
          }>
        }
        error?: string
        message?: string
      } | null

      console.log("[QR CHECKOUT] response", { status: response.status, result })

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            `Checkout failed with status ${response.status}`,
        )
      }

      const serverOrder = result?.order
      if (!serverOrder?.id) {
        throw new Error(t("menu.orderFailed"))
      }

      const resolvedId = String(serverOrder.id)
      const tableNumber =
        typeof serverOrder.table_number === "number"
          ? serverOrder.table_number
          : effectiveNumber ?? 0

      const apiItems = serverOrder.items ?? []
      addOrder({
        id: resolvedId,
        order_number: serverOrder.order_number ?? String(requestBody.orderNumber ?? resolvedId),
        table_number: tableNumber,
        order_type: "qr_self_service",
        status: mapQrApiStatus(serverOrder.status),
        items:
          apiItems.length > 0
            ? apiItems.map((it, idx) => ({
                id: it.id ?? `${resolvedId}-${idx}`,
                name: it.name,
                name_ar: it.name_ar ?? null,
                quantity: it.quantity,
                notes: it.notes,
                unit_price: it.unitPrice,
                station: it.station,
                item_status: (it.item_status as "new") ?? "new",
              }))
            : items.map((i, idx) => ({ id: `${resolvedId}-${idx}`, name: i.name, quantity: i.quantity })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customer_name:
          tableNumber > 0
            ? tableGuestCustomerName(tableNumber)
            : `Gast ${tableRef}`,
        total: typeof serverOrder.total === "number" ? serverOrder.total : cartTotal,
      })

      pushQrRecentlyOrdered(tableRef, cart.map((c) => c.productId))
      setCart([])
      setCartOpen(false)
      router.push(`/table/${tableId}/order?oid=${encodeURIComponent(resolvedId)}`)
    } catch (error) {
      console.error("[QR CHECKOUT] failed", error)
      setCheckoutError(error instanceof Error ? error.message : t("menu.orderFailed"))
    } finally {
      setSubmitting(false)
    }
  }, [cart, cartTotal, submitting, effectiveNumber, tableId, addOrder, router, t])

  const clearCheckoutError = useCallback(() => setCheckoutError(null), [])

  const getCategoryBlock = useCallback(
    (slug: string) => getPrintedBlockForCategory(menuItems, categoryRows, slug),
    [menuItems, categoryRows],
  )

  const navigateToCategory = useCallback(
    (slug: string) => {
      router.push(`/table/${tableId}/menu/${slug}`)
    },
    [router, tableId],
  )

  const value = useMemo((): QrTableMenuContextValue => {
    return {
      tableId: String(tableId),
      displayLabel,
      effectiveNumber,
      menuItems,
      categoryRows,
      categoryNavItems,
      homepageSections,
      bestsellerItems,
      todayItems,
      oftenOrderedWith,
      loading,
      loadError,
      offline,
      loadMenu,
      cart,
      cartCount,
      cartTotal,
      cartOpen,
      setCartOpen,
      submitting,
      checkoutError,
      clearCheckoutError,
      favoriteIds,
      detailItemId,
      setDetailItemId: setDetailItemIdWithSnapshot,
      detailItem,
      activeOrder,
      handleToggleFavorite,
      getInCartQty,
      handleQuickAdd,
      openDetail,
      closeDetail,
      increment,
      decrement,
      addLineToCart,
      submitOrder,
      getCategoryBlock,
      navigateToCategory,
    }
  }, [
    tableId,
    displayLabel,
    effectiveNumber,
    menuItems,
    categoryRows,
    categoryNavItems,
    homepageSections,
    bestsellerItems,
    todayItems,
    oftenOrderedWith,
    loading,
    loadError,
    offline,
    loadMenu,
    cart,
    cartCount,
    cartTotal,
    cartOpen,
    submitting,
    checkoutError,
    clearCheckoutError,
    favoriteIds,
    detailItemId,
    setDetailItemIdWithSnapshot,
    detailItem,
    activeOrder,
    handleToggleFavorite,
    getInCartQty,
    handleQuickAdd,
    openDetail,
    closeDetail,
    increment,
    decrement,
    addLineToCart,
    submitOrder,
    getCategoryBlock,
    navigateToCategory,
  ])

  return (
    <MenuScrollGuardProvider notifyLayoutShift={notifyLayoutShift}>
      <QrTableMenuContext.Provider value={value}>{children}</QrTableMenuContext.Provider>
    </MenuScrollGuardProvider>
  )
}
