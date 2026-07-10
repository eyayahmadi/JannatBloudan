"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { PageShell } from "@/components/site/PageShell"
import { PremiumBackdrop } from "@/components/site/PremiumBackdrop"
import type { OrderStatus } from "@/lib/hooks/useRealtimeOrders"
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders"
import { useResolvedRestaurantTable } from "@/lib/hooks/useResolvedRestaurantTable"
import {
  type QrMenuCategoryRow,
} from "@/lib/menu/qr-table-category-chips"
import { MenuSubcategoryHeader } from "@/components/menu/MenuSubcategoryHeader"
import { QrMenuHero } from "@/components/menu/qr/QrMenuHero"
import { QrMenuSearch } from "@/components/menu/qr/QrMenuSearch"
import { QrMenuStickyNav } from "@/components/menu/qr/QrMenuStickyNav"
import { QrMenuFeaturedStrip } from "@/components/menu/qr/QrMenuFeaturedStrip"
import { QrMenuShortcutCards } from "@/components/menu/qr/QrMenuShortcutCards"
import { QrTableMenuProductCell } from "@/components/menu/qr/QrTableMenuProductCell"
import { QrProductDetailSheet } from "@/components/menu/qr/QrProductDetailSheet"
import { QrMenuCartSheet, QrMenuFloatingBar } from "@/components/menu/qr/QrMenuCartSheet"
import { QrMenuEmptyState, QrMenuCardSkeleton } from "@/components/menu/qr/QrMenuEmptyState"
import { matchesMenuSearch } from "@/lib/menu/menu-display"
import { buildQrPrintedMenuSections, pickQrFeaturedProducts } from "@/lib/menu/qr-printed-menu"
import { mapApiToQrMenuItem, mergeQrMenuItems } from "@/lib/menu/qr-menu-helpers"
import { logMenuTelemetry } from "@/lib/menu/menu-telemetry"
import { isStableQrMenuPayload } from "@/lib/menu/menu-poll-stable"
import { sortByMenuCardOrder } from "@/lib/menu/menu-order"
import { getQrFavorites, getQrRecentlyOrdered, pushQrRecentlyOrdered, toggleQrFavorite } from "@/lib/menu/qr-guest-prefs"
import type { QrCartEntry, QrMenuItem } from "@/lib/menu/qr-menu-types"
import { StationStatusBanner } from "@/components/stations/StationStatusBanner"
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

export default function TableMenuPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const router = useRouter()
  const { addOrder, orders } = useRealtimeOrders()
  const { effectiveNumber, displayLabel } = useResolvedRestaurantTable(tableId)

  const [menuItems, setMenuItems] = useState<QrMenuItem[]>([])
  const [oftenOrderedWith, setOftenOrderedWith] = useState<Record<string, string[]>>({})
  const [categoryRows, setCategoryRows] = useState<QrMenuCategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [offline, setOffline] = useState(false)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<QrCartEntry[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [detailItemId, setDetailItemId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [stationAvailability, setStationAvailability] = useState<StationAvailability[]>([])
  const navRef = useRef<HTMLDivElement>(null)
  const menuItemsRef = useRef<QrMenuItem[]>([])
  const categoryRowsRef = useRef<QrMenuCategoryRow[]>([])
  menuItemsRef.current = menuItems
  categoryRowsRef.current = categoryRows
  const {
    captureScrollForSilentRefresh,
    scrollToNavIfNeeded,
    consumeSilentScrollRestore,
    notifyLayoutShift,
    silentRefreshPendingRef,
  } = useMenuScrollPreservation()

  const scrollNav = useCallback(() => {
    scrollToNavIfNeeded(navRef.current)
  }, [scrollToNavIfNeeded])

  const scrollToSection = useCallback((sectionId: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch((prev) => {
        const wasEmpty = !prev.trim()
        const nowEmpty = !value.trim()
        if (wasEmpty !== nowEmpty) scrollNav()
        return value
      })
    },
    [scrollNav],
  )

  useSilentScrollRestore(menuItems, consumeSilentScrollRestore, silentRefreshPendingRef)

  useEffect(() => {
    setFavoriteIds(getQrFavorites())
    setRecentIds(getQrRecentlyOrdered(String(tableId)))
  }, [tableId])

  const loadMenu = useCallback((options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    if (!silent) {
      setLoading(true)
    }
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
        setStationAvailability(stations)
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
    return () => window.clearInterval(id)
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

  const activeOrder = useMemo(() => {
    if (effectiveNumber == null) return null
    return orders.find(
      (o) =>
        String(o.table_number) === String(effectiveNumber) &&
        o.status !== "completed" &&
        o.status !== "cancelled",
    )
  }, [orders, effectiveNumber])

  const isSearchMode = search.trim().length > 0

  const searched = useMemo(() => {
    const q = search.trim()
    if (!q) return menuItems
    return menuItems.filter((item) => matchesMenuSearch(item, q))
  }, [menuItems, search])

  const searchResults = useMemo(() => sortByMenuCardOrder(searched), [searched])

  const printedSections = useMemo(
    () => buildQrPrintedMenuSections(menuItems, categoryRows),
    [menuItems, categoryRows],
  )

  const bestsellerStrip = useMemo(
    () => pickQrFeaturedProducts("bestseller", menuItems, 8),
    [menuItems],
  )

  const todayStrip = useMemo(
    () => pickQrFeaturedProducts("today", menuItems, 8),
    [menuItems],
  )

  const detailItem = useMemo(() => {
    if (!detailItemId) return null
    return menuItems.find((p) => p.id === detailItemId) ?? null
  }, [detailItemId, menuItems])

  useEffect(() => {
    if (detailItemId && !detailItem && !loading) {
      setDetailItemId(null)
    }
  }, [detailItemId, detailItem, loading])

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

  const openDetail = useCallback((item: QrMenuItem) => setDetailItemId(item.id), [])

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

  const submitOrder = async () => {
    if (cart.length === 0 || submitting) return
    if (effectiveNumber == null) {
      alert("Tisch nicht gefunden. Bitte warten oder den Service rufen.")
      return
    }
    setSubmitting(true)
    const localId = `ORD-${Date.now()}`
    const orderNumber = `T${effectiveNumber}-${String(Math.floor(1000 + Math.random() * 9000))}`
    const items = cart.map((c) => ({
      productId: c.productId,
      name: c.name,
      quantity: c.quantity,
      unitPrice: c.price,
      notes: formatKitchenTicketNotes(c.extras, c.variant, c.note),
    }))

    let resolvedId = localId
    type QrOrderItem = {
      id?: string
      name: string
      quantity: number
      unitPrice?: number
      notes?: string
      station?: string
      item_status?: string
    }
    type QrOrderPayload = {
      id?: string
      order_number?: string
      total?: number
      status?: string
      items?: QrOrderItem[]
    }
    let serverOrder: QrOrderPayload | null = null

    try {
      const res = await fetch("/api/orders/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: localId,
          orderNumber,
          tableRef: String(tableId),
          items,
          total: cartTotal,
        }),
      })
      const json = (await res.json()) as { order?: QrOrderPayload; error?: string }
      if (!res.ok) {
        alert(json.error ?? "Bestellung fehlgeschlagen. Bitte erneut versuchen.")
        return
      }
      if (json?.order?.id) {
        resolvedId = json.order.id
        serverOrder = json.order
      }
    } catch {
      alert("Keine Verbindung. Bitte Netzwerk prüfen oder den Service rufen.")
      return
    } finally {
      setSubmitting(false)
    }

    const apiItems = serverOrder?.items ?? []
    addOrder({
      id: resolvedId,
      order_number: serverOrder?.order_number ?? orderNumber,
      table_number: effectiveNumber,
      order_type: "qr_self_service",
      status: mapQrApiStatus(serverOrder?.status),
      items:
        apiItems.length > 0
          ? apiItems.map((it, idx) => ({
              id: it.id ?? `${resolvedId}-${idx}`,
              name: it.name,
              quantity: it.quantity,
              notes: it.notes,
              unit_price: it.unitPrice,
              station: it.station,
              item_status: (it.item_status as "new") ?? "new",
            }))
          : items.map((i, idx) => ({ id: `${resolvedId}-${idx}`, name: i.name, quantity: i.quantity })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_name: `Gast Tisch ${effectiveNumber}`,
      total: typeof serverOrder?.total === "number" ? serverOrder.total : cartTotal,
    })

    pushQrRecentlyOrdered(
      String(tableId),
      cart.map((c) => c.productId),
    )
    setRecentIds(getQrRecentlyOrdered(String(tableId)))

    router.push(`/table/${tableId}/order?oid=${encodeURIComponent(resolvedId)}`)
  }

  const renderGrid = (items: QrMenuItem[]) => (
    <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-4">
      {items.map((item) => {
        const line =
          !item.isCustomizable && !item.hasVariants
            ? cart.find((c) => c.lineId === buildCartLineId(item.id, [], null))
            : null
        const customQty =
          item.isCustomizable || item.hasVariants
            ? cart.filter((c) => c.productId === item.id).reduce((s, c) => s + c.quantity, 0)
            : 0

        return (
          <div key={item.id} className="h-full min-h-0">
            <QrTableMenuProductCell
              item={item}
              query={search}
              inCartQty={line?.quantity ?? customQty}
              isFavorite={favoriteIds.includes(item.id)}
              showLineControls={!item.isCustomizable && !item.hasVariants && !!line}
              onToggleFavorite={handleToggleFavorite}
              onOpen={openDetail}
              onQuickAdd={handleQuickAdd}
              onIncrement={increment}
              onDecrement={decrement}
              lineId={line?.lineId ?? null}
            />
          </div>
        )
      })}
    </div>
  )

  return (
    <MenuScrollGuardProvider notifyLayoutShift={notifyLayoutShift}>
    <PageShell stableViewport className="relative dark:bg-neutral-950">
      <PremiumBackdrop variant="cream" lite />

      <QrMenuHero
        tableId={String(tableId)}
        tableLabel={displayLabel}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        activeOrder={
          activeOrder
            ? { order_number: activeOrder.order_number, status: activeOrder.status }
            : null
        }
      />

      <div className="relative z-0 mx-auto max-w-2xl px-4 pt-3 pb-2">
        <StationStatusBanner />
      </div>

      <QrMenuStickyNav
        navRef={navRef}
        search={
          <QrMenuSearch
            value={search}
            onChange={handleSearchChange}
            resultCount={isSearchMode ? searchResults.length : undefined}
          />
        }
      />

      <main className="menu-sticky-main relative z-0 mx-auto max-w-2xl px-4 py-5 pb-28">
        {offline && !loading ? (
          <QrMenuEmptyState variant="offline" onRetry={loadMenu} />
        ) : loading && menuItems.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <QrMenuCardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : loadError ? (
          <QrMenuEmptyState variant="error" onRetry={loadMenu} />
        ) : menuItems.length === 0 ? (
          <QrMenuEmptyState variant="category" />
        ) : isSearchMode && searchResults.length === 0 ? (
          <QrMenuEmptyState
            variant="search"
            onReset={() => handleSearchChange("")}
          />
        ) : isSearchMode ? (
          <div>
            <p className="mb-4 text-sm text-amber-800/60 dark:text-amber-300/60">
              <span className="font-semibold text-amber-950 dark:text-white">{searchResults.length}</span>{" "}
              {searchResults.length === 1 ? "Ergebnis" : "Ergebnisse"}
            </p>
            {renderGrid(searchResults)}
          </div>
        ) : (
          <div className="space-y-8">
            <QrMenuShortcutCards
              sections={printedSections}
              onScrollToSection={scrollToSection}
            />

            <QrMenuFeaturedStrip
              id="qr-featured-bestseller"
              icon="⭐"
              titleDe="Bestseller"
              titleAr="الأكثر مبيعاً"
              items={bestsellerStrip}
              favoriteIds={new Set(favoriteIds)}
              onToggleFavorite={handleToggleFavorite}
              onOpenProduct={openDetail}
              onQuickAdd={handleQuickAdd}
              getInCartQty={getInCartQty}
            />

            <QrMenuFeaturedStrip
              id="qr-featured-today"
              icon="🔥"
              titleDe="Heute empfohlen"
              titleAr="موصى به اليوم"
              items={todayStrip}
              favoriteIds={new Set(favoriteIds)}
              onToggleFavorite={handleToggleFavorite}
              onOpenProduct={openDetail}
              onQuickAdd={handleQuickAdd}
              getInCartQty={getInCartQty}
            />

            <div id="qr-section-menu" className="space-y-12">
              {printedSections.map((block) => (
                <section key={block.id} id={block.id} className="space-y-8">
                  <MenuSubcategoryHeader
                    icon={block.icon}
                    labelDe={block.labelDe}
                    labelAr={block.labelAr}
                    variant="table"
                    drink={block.id === "qr-section-drinks"}
                    sweet={block.id === "qr-section-desserts"}
                    premium
                  />
                  {block.groups.length === 1 && block.groups[0]?.key !== "other" ? (
                    renderGrid(block.groups[0].items)
                  ) : (
                    <div className="space-y-10">
                      {block.groups.map((group) => (
                        <div key={group.key} id={`subcat-${group.key}`} className="space-y-4">
                          <MenuSubcategoryHeader
                            icon={group.icon}
                            labelDe={group.labelDe}
                            labelAr={group.labelAr}
                            subtitle={group.subtitle}
                            variant="table"
                            drink={block.id === "qr-section-drinks"}
                            sweet={block.id === "qr-section-desserts"}
                            premium
                          />
                          {renderGrid(group.items)}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        )}
      </main>

      <QrProductDetailSheet
        product={detailItem}
        catalog={menuItems}
        oftenOrderedWith={oftenOrderedWith}
        open={!!detailItemId}
        onClose={() => setDetailItemId(null)}
        onOpenProduct={(item) => setDetailItemId(item.id)}
        onConfirm={(payload) => {
          addLineToCart(payload)
          setDetailItemId(null)
        }}
      />

      <AnimatePresence>
        {!cartOpen && cartCount > 0 ? (
          <QrMenuFloatingBar cartCount={cartCount} cartTotal={cartTotal} onOpen={() => setCartOpen(true)} />
        ) : null}
      </AnimatePresence>

      <QrMenuCartSheet
        open={cartOpen}
        tableLabel={displayLabel}
        cart={cart}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onClose={() => setCartOpen(false)}
        onIncrement={increment}
        onDecrement={decrement}
        onSubmit={submitOrder}
        submitting={submitting}
      />
    </PageShell>
    </MenuScrollGuardProvider>
  )
}
