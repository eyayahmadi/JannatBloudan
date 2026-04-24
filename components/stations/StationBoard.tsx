"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  ChefHat,
  CheckCircle2,
  Clock,
  Monitor,
  Plus,
  Printer,
  PrinterCheck,
  QrCode,
  Truck,
  UtensilsCrossed,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  useRealtimeOrders,
  type KitchenOrder,
  type OrderItem,
  type OrderType,
} from "@/lib/hooks/useRealtimeOrders"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { useI18n } from "@/lib/i18n/context"
import { printKitchenTicket } from "@/lib/print/kitchen-ticket"
import { SITE } from "@/lib/site-config"
import {
  NEXT_ITEM_STATUS,
  STATION_META,
  type ItemStatus,
  type Station,
} from "@/lib/stations/config"
import { inferStation } from "@/lib/stations/inference"
import { AIAgentBadge, type AgentContext } from "@/components/ai/AIAgentBadge"
import { SPRING_SOFT } from "@/lib/ui/motion"

const STATION_TO_AGENT: Record<Station, AgentContext> = {
  KITCHEN: "kitchen",
  BAR: "bar",
  SHISHA: "shisha",
}

const ORDER_TYPE_ICON: Record<OrderType, typeof QrCode> = {
  qr_self_service: QrCode,
  server: UtensilsCrossed,
  pos: Monitor,
  delivery: Truck,
}

const COLUMNS: { key: ItemStatus; icon: typeof Clock; color: string }[] = [
  { key: "new", icon: Clock, color: "blue" },
  { key: "preparing", icon: ChefHat, color: "orange" },
  { key: "ready", icon: CheckCircle2, color: "green" },
]

const COLOR_MAP: Record<string, { card: string; badge: string; border: string }> = {
  blue: {
    card: "bg-blue-50/80 dark:bg-blue-950/30",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    border: "border-blue-200/60 dark:border-blue-800/40",
  },
  orange: {
    card: "bg-amber-50/80 dark:bg-amber-950/30",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
    border: "border-amber-200/60 dark:border-amber-800/40",
  },
  green: {
    card: "bg-emerald-50/80 dark:bg-emerald-950/30",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
  },
}

const MOCK_ITEMS_BY_STATION: Record<Station, { name: string; quantity: number; notes?: string }[]> = {
  KITCHEN: [
    { name: "Shawarma Poulet", quantity: 2 },
    { name: "Manakish Zaatar", quantity: 1 },
    { name: "Pizza Margherita", quantity: 1 },
    { name: "Burger Classic", quantity: 1 },
    { name: "Fattouch", quantity: 1 },
    { name: "Houmous", quantity: 1, notes: "Extra huile d'olive" },
  ],
  BAR: [
    { name: "Coca-Cola", quantity: 2 },
    { name: "Jus d'orange frais", quantity: 1 },
    { name: "Limonade Maison", quantity: 1 },
    { name: "Cafe Turc", quantity: 1 },
    { name: "The a la menthe", quantity: 1 },
    { name: "Baklava", quantity: 1, notes: "Dessert" },
  ],
  SHISHA: [
    { name: "Chicha Double Apple", quantity: 1 },
    { name: "Chicha Mint", quantity: 1 },
    { name: "Chicha Raisin", quantity: 1 },
    { name: "Chicha Pasteque", quantity: 1, notes: "Glacons extra" },
    { name: "Chicha Lemon Mint", quantity: 1 },
  ],
}

function elapsed(created: string): string {
  const diff = Math.floor((Date.now() - new Date(created).getTime()) / 1000)
  const m = Math.floor(diff / 60)
  const s = diff % 60
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`
  return `${s}s`
}

type GroupedItem = { order: KitchenOrder; items: OrderItem[] }

type StationItemCardProps = {
  order: KitchenOrder
  items: OrderItem[]
  color: string
  station: Station
  onAdvance: (itemId: string, next: ItemStatus) => void
  onPrint: () => void
}

function StationItemCard({
  order,
  items,
  color,
  station,
  onAdvance,
  onPrint,
}: StationItemCardProps) {
  const { t, locale } = useI18n()
  const [time, setTime] = useState(elapsed(order.created_at))
  const colors = COLOR_MAP[color]
  const TypeIcon = ORDER_TYPE_ICON[order.order_type]
  const avgPrep = STATION_META[station].avgPrepMinutes

  useEffect(() => {
    setTime(elapsed(order.created_at))
    const iv = setInterval(() => setTime(elapsed(order.created_at)), 30_000)
    return () => clearInterval(iv)
  }, [order.created_at])

  // Detection "retard": dans preparing depuis plus que la moyenne de la station
  const isLate = items.some((it) => {
    if (it.item_status !== "preparing" || !it.started_at) return false
    const diff = (Date.now() - new Date(it.started_at).getTime()) / 60000
    return diff > avgPrep
  })

  const typeLabel = t(`kitchen.ticket.orderType.${order.order_type}`, order.order_type)

  void locale

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={SPRING_SOFT}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative rounded-2xl border p-4 shadow-md backdrop-blur-sm transition-shadow",
        "hover:shadow-xl dark:shadow-black/20",
        colors.card,
        colors.border,
        isLate && "ring-2 ring-red-400/70 dark:ring-red-500/60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            #{order.order_number}
          </span>
          {order.table_number !== null && (
            <Badge variant="outline" className="text-xs">
              {t("kitchen.table", "Table")} {order.table_number}
            </Badge>
          )}
          {isLate && (
            <Badge className="bg-red-500 text-white text-[10px] uppercase" variant="secondary">
              <AlertCircle className="me-1 h-3 w-3" />
              {t("stations.lateAlert", "Retard")}
            </Badge>
          )}
        </div>
        <Badge
          className={cn("text-[10px] uppercase tracking-wide", colors.badge)}
          variant="secondary"
        >
          <TypeIcon className="me-1 h-3 w-3" />
          {typeLabel}
        </Badge>
      </div>

      {order.customer_name && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {order.customer_name}
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const next = NEXT_ITEM_STATUS[item.item_status]
          const canAdvance = next && next !== "served"
          return (
            <li
              key={item.id}
              className="flex items-start gap-2 rounded-lg bg-white/50 p-2 text-sm dark:bg-black/20"
            >
              <span className="shrink-0 rounded bg-slate-900 px-1.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                {item.quantity}x
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-white">
                  {item.name}
                </p>
                {item.notes && (
                  <p className="mt-0.5 text-xs italic text-amber-700 dark:text-amber-300">
                    {item.notes}
                  </p>
                )}
              </div>
              {canAdvance && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAdvance(item.id, next!)
                  }}
                  className={cn(
                    "shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
                    "bg-white/80 text-slate-700 hover:bg-slate-900 hover:text-white",
                    "dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-white dark:hover:text-slate-900",
                    colors.border,
                  )}
                >
                  {next === "preparing"
                    ? t("stations.action.start", "Lancer")
                    : next === "ready"
                      ? t("stations.action.markReady", "Pret")
                      : t("stations.action.markServed", "Servi")}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-slate-700/40">
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3" />
          {time}
        </div>
        <button
          type="button"
          onClick={onPrint}
          className={cn(
            "rounded-full bg-white/90 p-1.5 text-slate-600 shadow-sm transition",
            "hover:bg-slate-900 hover:text-white hover:shadow-md",
            "dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-white dark:hover:text-slate-900",
          )}
          title={`${t("kitchen.print", "Imprimer")} #${order.order_number}`}
          aria-label={`${t("kitchen.printTicket", "Imprimer ticket")} ${order.order_number}`}
        >
          <Printer className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

const AUTO_PRINT_KEY_PREFIX = "station.autoPrint."

export type StationBoardProps = {
  station: Station
}

export function StationBoard({ station }: StationBoardProps) {
  const { t, locale } = useI18n()
  const {
    orders,
    addOrder,
    updateItemStatus,
    lastEvent,
    getStationItems,
  } = useRealtimeOrders()
  const { add: addNotification } = useNotifications()
  const [mobileTab, setMobileTab] = useState<ItemStatus>("new")
  const [toast, setToast] = useState<string | null>(null)
  const prevLastEvent = useRef(lastEvent)
  const [autoPrint, setAutoPrint] = useState(false)
  const printedIds = useRef<Set<string>>(new Set())

  const meta = STATION_META[station]
  const stationLabel = t(meta.i18nKey, station)
  const autoPrintKey = `${AUTO_PRINT_KEY_PREFIX}${station}`

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(autoPrintKey)
      if (stored === "true") setAutoPrint(true)
    } catch {
      /* ignore */
    }
  }, [autoPrintKey])

  const toggleAutoPrint = useCallback(() => {
    setAutoPrint((v) => {
      const next = !v
      try {
        window.localStorage.setItem(autoPrintKey, String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [autoPrintKey])

  const handlePrint = useCallback(
    (order: KitchenOrder, stationItems: OrderItem[]) => {
      // On imprime uniquement les items de cette station
      const stationOnlyOrder: KitchenOrder = { ...order, items: stationItems }
      const ok = printKitchenTicket(stationOnlyOrder, {
        restaurantName: SITE.name,
        locale,
        station,
      })
      if (!ok) {
        setToast("Impossible d'ouvrir la fenetre d'impression")
        setTimeout(() => setToast(null), 3000)
      }
    },
    [locale, station],
  )

  // Items de cette station uniquement, regroupes par commande + colonne statut
  const stationItems = useMemo(
    () => getStationItems(station),
    [getStationItems, station],
  )

  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const visibleItems = useMemo(
    () =>
      stationItems.filter(({ item, order }) => {
        if (item.item_status === "served") {
          return new Date(order.updated_at).getTime() > oneHourAgo
        }
        return true
      }),
    [stationItems, oneHourAgo],
  )

  const columns = COLUMNS.map((col) => {
    const matching = visibleItems.filter(({ item }) => item.item_status === col.key)
    // Regroupement par commande
    const grouped = new Map<string, GroupedItem>()
    matching.forEach(({ order, item }) => {
      const g = grouped.get(order.id)
      if (g) g.items.push(item)
      else grouped.set(order.id, { order, items: [item] })
    })
    return {
      ...col,
      label: t(`stations.status.${col.key}`, col.key),
      groups: Array.from(grouped.values()).sort(
        (a, b) =>
          new Date(a.order.created_at).getTime() -
          new Date(b.order.created_at).getTime(),
      ),
    }
  })

  const activeCount = visibleItems.filter((x) => x.item.item_status !== "ready").length

  // Toast nouvelle commande + auto-print
  useEffect(() => {
    if (lastEvent === "NEW_ORDER" && prevLastEvent.current !== lastEvent) {
      const ordersWithStation = orders.filter((o) =>
        o.items.some((it) => it.station === station && it.item_status === "new"),
      )
      if (ordersWithStation.length === 0) {
        prevLastEvent.current = lastEvent
        return
      }
      setToast(`${meta.emoji} ${t("kitchen.newOrderToast", "Nouvelle commande!")}`)
      const tid = setTimeout(() => setToast(null), 3000)

      if (autoPrint) {
        const latest = [...ordersWithStation].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]
        if (latest && !printedIds.current.has(latest.id)) {
          const stationOnly = latest.items.filter((it) => it.station === station)
          handlePrint(latest, stationOnly)
          printedIds.current.add(latest.id)
        }
      }
      prevLastEvent.current = lastEvent
      return () => clearTimeout(tid)
    }
    prevLastEvent.current = lastEvent
  }, [lastEvent, autoPrint, orders, station, meta.emoji, t, handlePrint])

  // Simulation: genere une commande contenant AU MOINS un item de cette station
  const simulateOrder = useCallback(() => {
    const pool = MOCK_ITEMS_BY_STATION[station]
    const count = Math.max(1, Math.floor(Math.random() * 3))
    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count)
    const items: OrderItem[] = picked.map((it, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      name: it.name,
      quantity: it.quantity,
      notes: it.notes,
      station: inferStation(it.name) === "KITCHEN" ? station : inferStation(it.name),
      item_status: "new",
    }))
    const types: OrderType[] = ["qr_self_service", "server", "pos", "delivery"]
    const orderType = types[Math.floor(Math.random() * types.length)]
    const isDineIn = orderType === "server" || orderType === "qr_self_service"
    const total = items.reduce((s, it) => s + it.quantity * (5 + Math.random() * 15), 0)

    const order: KitchenOrder = {
      id: crypto.randomUUID(),
      order_number: String(1000 + Math.floor(Math.random() * 9000)),
      table_number: isDineIn ? Math.floor(Math.random() * 20) + 1 : null,
      order_type: orderType,
      status: "received",
      items,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_name: orderType === "delivery" ? "Client livraison" : undefined,
      total: Math.round(total * 100) / 100,
    }
    addOrder(order)
    addNotification({
      type: "new_order",
      title: `${meta.emoji} ${stationLabel}`,
      message: `${t("kitchen.orderNumber", "Commande")} ${order.order_number}`,
    })
  }, [addOrder, addNotification, meta.emoji, stationLabel, station, t])

  const handleAdvance = useCallback(
    (orderId: string, itemId: string, next: ItemStatus) => {
      updateItemStatus(orderId, itemId, next)
      if (next === "ready") {
        addNotification({
          type: "order_ready",
          title: `${meta.emoji} ${stationLabel}`,
          message: t("stations.status.ready", "Pret"),
        })
      }
    },
    [updateItemStatus, addNotification, meta.emoji, stationLabel, t],
  )

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <SiteHeader
          backHref="/admin"
          backLabel={t("nav.admin", "Admin")}
          hideMainNav
          trailing={
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "hidden sm:inline-flex text-xs font-semibold",
                  `bg-gradient-to-r ${meta.gradient} text-white border-0`,
                )}
              >
                {meta.emoji} {stationLabel}
              </Badge>
              <Badge variant="outline" className="hidden md:inline-flex text-xs">
                {activeCount}{" "}
                {t("kitchen.orderNumber", "items").toLowerCase()}
              </Badge>
              <Button
                size="sm"
                variant={autoPrint ? "default" : "outline"}
                onClick={toggleAutoPrint}
                className={cn(
                  "gap-1.5",
                  autoPrint && "bg-emerald-600 hover:bg-emerald-700 text-white",
                )}
                title={
                  autoPrint
                    ? t("kitchen.autoPrintOn", "Auto-impression ON")
                    : t("kitchen.autoPrintOff", "Auto-impression OFF")
                }
              >
                {autoPrint ? (
                  <PrinterCheck className="h-4 w-4" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                <span className="hidden lg:inline">
                  {t("kitchen.autoPrint", "Auto-impression")}
                </span>
              </Button>
              <Button size="sm" onClick={simulateOrder} className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("kitchen.simulate", "Simuler commande")}
                </span>
              </Button>
            </div>
          }
        />

        {toast && (
          <div className="fixed end-4 top-20 z-[100] animate-in slide-in-from-right fade-in rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 shadow-lg dark:border-amber-700 dark:bg-amber-950">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {toast}
            </div>
          </div>
        )}

        {/* Station hero */}
        <div
          className={cn(
            "relative overflow-hidden border-b",
            "bg-gradient-to-r",
            meta.gradient,
          )}
        >
          <div className="mx-auto max-w-7xl px-4 py-5 text-white sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{meta.emoji}</div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  {stationLabel}
                </h1>
                <p className="text-xs opacity-90 sm:text-sm">
                  {t("stations.avgPrep", "Prep. moyenne")}: {meta.avgPrepMinutes}{" "}
                  {t("stations.mins", "min")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold leading-none">{activeCount}</p>
                <p className="text-[10px] uppercase tracking-wide opacity-90">
                  {t("common.total", "Total")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex gap-1 border-b border-slate-200 bg-white/80 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:hidden">
          {columns.map((col) => {
            const count = col.groups.reduce((s, g) => s + g.items.length, 0)
            return (
              <button
                key={col.key}
                type="button"
                onClick={() => setMobileTab(col.key)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition",
                  mobileTab === col.key
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400",
                )}
              >
                {col.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Desktop kanban */}
        <div className="hidden flex-1 gap-4 p-4 md:grid md:grid-cols-3 lg:gap-6 lg:p-6">
          {columns.map((col) => {
            const ColIcon = col.icon
            const itemCount = col.groups.reduce((s, g) => s + g.items.length, 0)
            return (
              <div key={col.key} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <ColIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {col.label}
                  </h2>
                  <Badge variant="outline" className="ms-auto text-xs">
                    {itemCount}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  {col.groups.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 dark:border-slate-800">
                      <p className="text-center text-sm text-slate-400 dark:text-slate-500">
                        {t("stations.emptyQueue", "File vide")}
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false} mode="popLayout">
                      {col.groups.map(({ order, items }) => (
                        <StationItemCard
                          key={`${order.id}-${col.key}`}
                          order={order}
                          items={items}
                          color={col.color}
                          station={station}
                          onAdvance={(itemId, next) =>
                            handleAdvance(order.id, itemId, next)
                          }
                          onPrint={() => handlePrint(order, items)}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile column */}
        <div className="flex flex-1 flex-col gap-3 p-4 md:hidden">
          {(() => {
            const col = columns.find((c) => c.key === mobileTab)!
            return col.groups.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 dark:border-slate-800">
                <p className="text-center text-sm text-slate-400 dark:text-slate-500">
                  {t("stations.emptyQueue", "File vide")}
                </p>
              </div>
            ) : (
              col.groups.map(({ order, items }) => (
                <StationItemCard
                  key={`${order.id}-${col.key}`}
                  order={order}
                  items={items}
                  color={col.color}
                  station={station}
                  onAdvance={(itemId, next) => handleAdvance(order.id, itemId, next)}
                  onPrint={() => handlePrint(order, items)}
                />
              ))
            )
          })()}
        </div>

        {/* Agent IA dédié à cette station */}
        <AIAgentBadge context={STATION_TO_AGENT[station]} />
      </PageShell>
    </RequireAuth>
  )
}
