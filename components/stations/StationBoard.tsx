"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from "react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import type { AppRole } from "@/lib/auth/roles"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  Ban,
  ChefHat,
  CheckCircle2,
  Clock,
  Monitor,
  Printer,
  PrinterCheck,
  QrCode,
  Repeat,
  Truck,
  UtensilsCrossed,
  XOctagon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type BoardGroupedItem,
  kdsRenderLog,
  pruneBoardGroupCache,
  sortBoardGroups,
  stabilizeGroupsArray,
  stableBoardGroup,
} from "@/lib/orders/kds-board-groups"
import { RealtimeIndicator } from "@/components/realtime/RealtimeIndicator"
import {
  useRealtimeOrders,
  useItemPending,
  type KitchenOrder,
  type OrderItem,
  type OrderType,
} from "@/lib/hooks/useRealtimeOrders"
import { notificationsStore } from "@/lib/notifications/notifications-store"
import { useStationAvailability } from "@/lib/hooks/useStationAvailability"
import { useI18n } from "@/lib/i18n/context"
import { printStationTicket } from "@/lib/print/kitchen-ticket"
import { SITE } from "@/lib/site-config"
import {
  NEXT_ITEM_STATUS,
  STATION_META,
  type ItemStatus,
  type Station,
} from "@/lib/stations/config"
import {
  autoReasonForStatus,
  type RefusalReasonCode,
} from "@/lib/stations/refusal-reasons"
import {
  serverAudience,
  stationServiceChainAudience,
} from "@/lib/notifications/audience"
import { AIAgentBadge, type AgentContext } from "@/components/ai/AIAgentBadge"
import { StationAvailabilityControl } from "@/components/stations/StationAvailabilityControl"
import { ItemRefuseDialog } from "@/components/stations/ItemRefuseDialog"
import { StationBoardToast } from "@/components/stations/StationBoardToast"
import { OrderProductName } from "@/components/orders/OrderProductName"

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

type ColumnKey = ItemStatus

const COLUMNS: { key: ColumnKey; icon: typeof Clock; color: string }[] = [
  { key: "new", icon: Clock, color: "blue" },
  { key: "accepted", icon: CheckCircle2, color: "amber" },
  { key: "preparing", icon: ChefHat, color: "orange" },
  { key: "ready", icon: CheckCircle2, color: "green" },
  { key: "refused", icon: Ban, color: "red" },
]

const COLOR_MAP: Record<string, { card: string; badge: string; border: string }> = {
  blue: {
    card: "bg-blue-50/80 dark:bg-blue-950/30",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    border: "border-blue-200/60 dark:border-blue-800/40",
  },
  amber: {
    card: "bg-amber-50/80 dark:bg-amber-950/30",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
    border: "border-amber-200/60 dark:border-amber-800/40",
  },
  orange: {
    card: "bg-orange-50/80 dark:bg-orange-950/30",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200",
    border: "border-orange-200/60 dark:border-orange-800/40",
  },
  green: {
    card: "bg-emerald-50/80 dark:bg-emerald-950/30",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
  },
  red: {
    card: "bg-red-50/80 dark:bg-red-950/30",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200",
    border: "border-red-200/60 dark:border-red-800/40",
  },
}

function elapsed(created: string): string {
  const diff = Math.floor((Date.now() - new Date(created).getTime()) / 1000)
  const m = Math.floor(diff / 60)
  const s = diff % 60
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`
  return `${s}s`
}

/** Isolated timer — only this subtree re-renders on tick. */
const StationCardElapsedTimer = memo(function StationCardElapsedTimer({
  createdAt,
}: {
  createdAt: string
}) {
  kdsRenderLog("Timer", { createdAt })
  const [time, setTime] = useState(() => elapsed(createdAt))

  useEffect(() => {
    setTime(elapsed(createdAt))
    const iv = setInterval(() => setTime(elapsed(createdAt)), 1000)
    return () => clearInterval(iv)
  }, [createdAt])

  return (
    <span className="inline-block min-w-[4.5rem] tabular-nums">{time}</span>
  )
})

/** Late badge with reserved height so cards do not resize when it appears. */
const StationLateBadgeSlot = memo(function StationLateBadgeSlot({
  items,
  avgPrepMinutes,
}: {
  items: OrderItem[]
  avgPrepMinutes: number
}) {
  const { t } = useI18n()
  const [isLate, setIsLate] = useState(false)

  useEffect(() => {
    const check = () => {
      const late = items.some((it) => {
        if (it.item_status !== "preparing" || !it.started_at) return false
        const diff = (Date.now() - new Date(it.started_at).getTime()) / 60000
        return diff > avgPrepMinutes
      })
      setIsLate(late)
    }
    check()
    const iv = setInterval(check, 30_000)
    return () => clearInterval(iv)
  }, [items, avgPrepMinutes])

  return (
    <span className="inline-flex h-5 min-w-0 items-center">
      {isLate ? (
        <Badge className="bg-red-500 text-white text-[10px] uppercase" variant="secondary">
          <AlertCircle className="me-1 h-3 w-3" />
          {t("stations.lateAlert", "Retard")}
        </Badge>
      ) : null}
    </span>
  )
})

/** Convertit "produit_indisponible" → "produitIndisponible" pour la clé i18n. */
function camel(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

type GroupedItem = BoardGroupedItem

type StationItemCardProps = {
  order: KitchenOrder
  items: OrderItem[]
  color: string
  station: Station
  columnKey: ColumnKey
  isFocused?: boolean
  onAdvanceOrder: (orderId: string, itemId: string, next: ItemStatus, columnKey: ColumnKey) => void
  onRefuseOrder: (
    orderId: string,
    itemId: string,
    name: string,
    currentStatus: ItemStatus,
    columnKey: ColumnKey,
  ) => void
  onPrintOrder: (order: KitchenOrder, items: OrderItem[]) => void
}

function stationCardDomId(orderId: string, columnKey: ColumnKey): string {
  return `station-card-${orderId}-${columnKey}`
}

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node) {
    const style = window.getComputedStyle(node)
    const overflowY = style.overflowY
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return node
    }
    node = node.parentElement
  }
  return null
}

const StationItemCard = memo(function StationItemCard({
  order,
  items,
  color,
  station,
  columnKey,
  isFocused = false,
  onAdvanceOrder,
  onRefuseOrder,
  onPrintOrder,
}: StationItemCardProps) {
  kdsRenderLog("OrderCard", { orderId: order.id, columnKey })
  const { t, locale } = useI18n()
  const colors = COLOR_MAP[color]
  const TypeIcon = ORDER_TYPE_ICON[order.order_type]
  const avgPrep = STATION_META[station].avgPrepMinutes
  const showLateSlot = columnKey === "preparing"

  const typeLabel = t(`kitchen.ticket.orderType.${order.order_type}`, order.order_type)

  void locale

  return (
    <div
      id={stationCardDomId(order.id, columnKey)}
      className={cn(
        "group relative rounded-2xl border p-4 shadow-md backdrop-blur-sm",
        "dark:shadow-black/20",
        colors.card,
        colors.border,
        isFocused && "ring-2 ring-amber-500/80 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950",
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
          {showLateSlot ? <StationLateBadgeSlot items={items} avgPrepMinutes={avgPrep} /> : null}
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
          const canAdvance = !!next && next !== "served"
          const isRefused = item.item_status === "refused" || item.item_status === "waste"
          const isReplaced = item.item_status === "replaced"
          const canRefuse =
            !isRefused &&
            !isReplaced &&
            item.item_status !== "served" &&
            item.item_status !== "cancelled"
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-start gap-2 rounded-lg p-2 text-sm",
                isRefused
                  ? "bg-red-100/60 dark:bg-red-950/40 ring-1 ring-red-300/50"
                  : isReplaced
                    ? "bg-purple-100/60 dark:bg-purple-950/40 ring-1 ring-purple-300/50"
                    : "bg-white/50 dark:bg-black/20",
              )}
            >
              <span className="shrink-0 rounded bg-slate-900 px-1.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                {item.quantity}x
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    isRefused || isReplaced
                      ? "text-slate-500 line-through dark:text-slate-400"
                      : "text-slate-900 dark:text-white",
                  )}
                >
                  <OrderProductName
                    name={item.name}
                    name_ar={item.name_ar}
                    truncate
                  />
                </div>
                {item.notes && (
                  <p className="mt-0.5 text-xs italic text-amber-700 dark:text-amber-300">
                    {item.notes}
                  </p>
                )}
                {isRefused && item.refusal_reason_code && (
                  <p className="mt-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
                    <Ban className="me-1 inline h-3 w-3" />
                    {t(
                      `stations.refusalReason.${camel(item.refusal_reason_code)}`,
                      item.refusal_reason_code,
                    )}
                    {item.refusal_note ? ` — ${item.refusal_note}` : ""}
                  </p>
                )}
                {isReplaced && (
                  <p className="mt-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                    <Repeat className="me-1 inline h-3 w-3" />
                    {t("stations.replacedNotice", "Remplacé")}
                  </p>
                )}
              </div>
              <StationItemActionButtons
                item={item}
                next={next}
                canAdvance={canAdvance}
                canRefuse={canRefuse}
                colors={colors}
                columnKey={columnKey}
                orderId={order.id}
                onAdvanceOrder={onAdvanceOrder}
                onRefuseOrder={onRefuseOrder}
              />
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex h-8 items-center justify-between border-t border-slate-200/60 pt-2 dark:border-slate-700/40">
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3 shrink-0" />
          <StationCardElapsedTimer createdAt={order.created_at} />
        </div>
        <button
          type="button"
          onClick={() => onPrintOrder(order, items)}
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
    </div>
  )
})

type StationItemActionButtonsProps = {
  item: OrderItem
  next: ItemStatus | undefined
  canAdvance: boolean
  canRefuse: boolean
  colors: { border: string }
  columnKey: ColumnKey
  orderId: string
  onAdvanceOrder: StationItemCardProps["onAdvanceOrder"]
  onRefuseOrder: StationItemCardProps["onRefuseOrder"]
}

const StationItemActionButtons = memo(function StationItemActionButtons({
  item,
  next,
  canAdvance,
  canRefuse,
  colors,
  columnKey,
  orderId,
  onAdvanceOrder,
  onRefuseOrder,
}: StationItemActionButtonsProps) {
  kdsRenderLog("ActionButtons", { itemId: item.id, columnKey })
  const { t } = useI18n()
  const pending = useItemPending(item.id)

  return (
    <div className="flex shrink-0 items-center gap-1">
      {canAdvance && next ? (
        <button
          type="button"
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation()
            if (pending) return
            onAdvanceOrder(orderId, item.id, next, columnKey)
          }}
          className={cn(
            "rounded-lg border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
            "bg-white/80 text-slate-700 hover:bg-slate-900 hover:text-white",
            "dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-white dark:hover:text-slate-900",
            colors.border,
            pending && "cursor-not-allowed opacity-50 hover:bg-white/80 hover:text-slate-700 dark:hover:bg-slate-800/80 dark:hover:text-slate-200",
          )}
        >
          {next === "accepted"
            ? t("stations.action.accept", "Accepter")
            : next === "preparing"
              ? t("stations.action.start", "Lancer")
              : next === "ready"
                ? t("stations.action.markReady", "Pret")
                : t("stations.action.markServed", "Servi")}
        </button>
      ) : null}
      {canRefuse ? (
        <button
          type="button"
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation()
            if (pending) return
            onRefuseOrder(orderId, item.id, item.name, item.item_status, columnKey)
          }}
          className={cn(
            "rounded-lg border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
            "border-red-200 bg-white/80 text-red-700 hover:bg-red-600 hover:text-white",
            "dark:border-red-800 dark:bg-slate-800/80 dark:text-red-300 dark:hover:bg-red-700 dark:hover:text-white",
            pending && "cursor-not-allowed opacity-50 hover:bg-white/80 hover:text-red-700 dark:hover:bg-slate-800/80 dark:hover:text-red-300",
          )}
          title={t("stations.action.refuse", "Refuser")}
        >
          <Ban className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  )
})

const AUTO_PRINT_KEY_PREFIX = "station.autoPrint."

type StationColumnData = {
  key: ColumnKey
  icon: typeof Clock
  color: string
  label: string
  groups: BoardGroupedItem[]
}

type StationColumnProps = {
  col: StationColumnData
  station: Station
  focusedOrderId: string | null
  focusedColumnKey: ColumnKey | null
  onAdvanceOrder: StationItemCardProps["onAdvanceOrder"]
  onRefuseOrder: StationItemCardProps["onRefuseOrder"]
  onPrintOrder: StationItemCardProps["onPrintOrder"]
  emptyLabel: string
}

const StationColumn = memo(function StationColumn({
  col,
  station,
  focusedOrderId,
  focusedColumnKey,
  onAdvanceOrder,
  onRefuseOrder,
  onPrintOrder,
  emptyLabel,
}: StationColumnProps) {
  kdsRenderLog(col.key === "preparing" ? "PreparingColumn" : `Column:${col.key}`, {
    count: col.groups.length,
  })
  const ColIcon = col.icon
  const itemCount = col.groups.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="flex flex-col gap-3">
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
            <p className="text-center text-sm text-slate-400 dark:text-slate-500">{emptyLabel}</p>
          </div>
        ) : (
          col.groups.map(({ order, items }) => (
            <StationItemCard
              key={order.id}
              order={order}
              items={items}
              color={col.color}
              station={station}
              columnKey={col.key}
              isFocused={focusedOrderId === order.id && focusedColumnKey === col.key}
              onAdvanceOrder={onAdvanceOrder}
              onRefuseOrder={onRefuseOrder}
              onPrintOrder={onPrintOrder}
            />
          ))
        )}
      </div>
    </div>
  )
}, (prev, next) => {
  return (
    prev.col.groups === next.col.groups &&
    prev.col.label === next.col.label &&
    prev.station === next.station &&
    prev.focusedOrderId === next.focusedOrderId &&
    prev.focusedColumnKey === next.focusedColumnKey &&
    prev.onAdvanceOrder === next.onAdvanceOrder &&
    prev.onRefuseOrder === next.onRefuseOrder &&
    prev.onPrintOrder === next.onPrintOrder &&
    prev.emptyLabel === next.emptyLabel
  )
})


function defaultRolesForStation(station: Station): AppRole[] {
  switch (station) {
    case "KITCHEN":
      return ["ADMIN", "KITCHEN"]
    case "BAR":
      return ["ADMIN", "BAR"]
    case "SHISHA":
      return ["ADMIN", "SHISHA"]
  }
}

export type StationBoardProps = {
  station: Station
  /** `workspace` : intégré dans StaffWorkspaceShell (pas de PageShell plein écran). */
  layout?: "full" | "workspace"
  allowedRoles?: AppRole[]
}

export function StationBoard({ station, layout = "full", allowedRoles }: StationBoardProps) {
  const authRoles = allowedRoles ?? defaultRolesForStation(station)
  const { t, locale } = useI18n()
  const {
    orders,
    updateItemStatus,
    refuseOrderItem,
    isItemPending,
    lastEvent,
    getStationItems,
  } = useRealtimeOrders()
  const stationAvail = useStationAvailability()
  const [mobileTab, setMobileTab] = useState<ItemStatus>("new")
  const [toast, setToast] = useState<string | null>(null)
  const prevLastEvent = useRef(lastEvent)
  const [autoPrint, setAutoPrint] = useState(false)
  const printedIds = useRef<Set<string>>(new Set())
  const [refuseTarget, setRefuseTarget] = useState<{
    orderId: string
    itemId: string
    name: string
    canMarkWaste: boolean
    columnKey: ColumnKey
  } | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null)
  const [focusedColumnKey, setFocusedColumnKey] = useState<ColumnKey | null>(null)
  const boardRootRef = useRef<HTMLDivElement>(null)
  const pendingFocusRef = useRef<{
    orderId: string
    columnKey: ColumnKey
    maintainPosition: boolean
  } | null>(null)
  const savedScrollRef = useRef(0)
  const scrollRestorePendingRef = useRef(false)
  const columnGroupsRef = useRef<Partial<Record<ColumnKey, BoardGroupedItem[]>>>({})
  const [hourBoundary, setHourBoundary] = useState(() => Date.now() - 60 * 60 * 1000)

  useEffect(() => {
    const iv = window.setInterval(() => setHourBoundary(Date.now() - 60 * 60 * 1000), 60_000)
    return () => window.clearInterval(iv)
  }, [])

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
      const stationOnlyOrder: KitchenOrder = { ...order, items: stationItems }
      const ok = printStationTicket(stationOnlyOrder, {
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

  const onPrintOrder = useCallback(
    (order: KitchenOrder, items: OrderItem[]) => {
      handlePrint(order, items)
    },
    [handlePrint],
  )

  // Items de cette station uniquement, regroupes par commande + colonne statut
  const stationItems = useMemo(
    () => getStationItems(station),
    [getStationItems, station],
  )

  const oneHourAgo = hourBoundary
  const visibleItems = useMemo(
    () =>
      stationItems.filter(({ item, order }) => {
        if (item.item_status === "served" || item.item_status === "refused" || item.item_status === "waste" || item.item_status === "replaced") {
          return new Date(order.updated_at).getTime() > oneHourAgo
        }
        return true
      }),
    [stationItems, oneHourAgo],
  )

  const columns = useMemo(() => {
    return COLUMNS.map((col) => {
      const matching = visibleItems.filter(({ item }) => {
        if (col.key === "refused") {
          return item.item_status === "refused" || item.item_status === "waste"
        }
        return item.item_status === col.key
      })

      const itemsByOrder = new Map<string, { order: KitchenOrder; items: OrderItem[] }>()
      const orderIds = new Set<string>()
      matching.forEach(({ order, item }) => {
        orderIds.add(order.id)
        let slot = itemsByOrder.get(order.id)
        if (!slot) {
          slot = { order, items: [] }
          itemsByOrder.set(order.id, slot)
        }
        slot.items.push(item)
      })
      pruneBoardGroupCache(col.key, orderIds)

      const built = Array.from(itemsByOrder.values()).map(({ order, items }) =>
        stableBoardGroup(col.key, order, items),
      )
      const sorted = sortBoardGroups(col.key, built)
      const stabilized = stabilizeGroupsArray(col.key, columnGroupsRef.current[col.key], sorted)
      columnGroupsRef.current[col.key] = stabilized

      return {
        ...col,
        label: t(`stations.status.${col.key}`, col.key),
        groups: stabilized,
      }
    })
  }, [visibleItems, t])

  const queueFocusBeforeAction = useCallback(
    (
      columnKey: ColumnKey,
      orderId: string,
      itemId: string,
    ) => {
      const col = columns.find((c) => c.key === columnKey)
      const groups = col?.groups ?? []
      const idx = groups.findIndex((g) => g.order.id === orderId)
      if (idx < 0) return

      const group = groups[idx]
      const otherItems = group.items.filter((it) => it.id !== itemId)
      const itemStillMatchesColumn = otherItems.some((it) => {
        if (columnKey === "refused") {
          return it.item_status === "refused" || it.item_status === "waste"
        }
        return it.item_status === columnKey
      })

      let nextOrderId: string | null = null
      let maintainPosition = false

      if (itemStillMatchesColumn) {
        nextOrderId = orderId
        maintainPosition = true
      } else if (idx < groups.length - 1) {
        nextOrderId = groups[idx + 1].order.id
      } else if (groups.length > 1 && idx > 0) {
        nextOrderId = groups[idx - 1].order.id
      }

      scrollRestorePendingRef.current = true
      const scrollParent = findScrollParent(boardRootRef.current)
      if (scrollParent) {
        savedScrollRef.current = scrollParent.scrollTop
      }

      if (nextOrderId) {
        pendingFocusRef.current = { orderId: nextOrderId, columnKey, maintainPosition }
      } else {
        pendingFocusRef.current = null
      }
    },
    [columns],
  )

  useLayoutEffect(() => {
    if (!scrollRestorePendingRef.current) return
    scrollRestorePendingRef.current = false

    const scrollParent = findScrollParent(boardRootRef.current)
    if (scrollParent) {
      scrollParent.scrollTop = savedScrollRef.current
    }

    const pending = pendingFocusRef.current
    if (!pending) return
    pendingFocusRef.current = null

    setFocusedOrderId(pending.orderId)
    setFocusedColumnKey(pending.columnKey)

    if (!pending.maintainPosition) {
      requestAnimationFrame(() => {
        const el = document.getElementById(
          stationCardDomId(pending.orderId, pending.columnKey),
        )
        el?.scrollIntoView({ block: "nearest", behavior: "auto" })
      })
    }
  }, [orders])

  const activeCount = useMemo(
    () =>
      visibleItems.filter(
        (x) =>
          x.item.item_status !== "ready" &&
          x.item.item_status !== "refused" &&
          x.item.item_status !== "waste" &&
          x.item.item_status !== "replaced",
      ).length,
    [visibleItems],
  )

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

  const handleAdvance = useCallback(
    async (orderId: string, itemId: string, next: ItemStatus, columnKey: ColumnKey) => {
      if (isItemPending(itemId)) return
      queueFocusBeforeAction(columnKey, orderId, itemId)
      await updateItemStatus(orderId, itemId, next)
      if (next === "ready") {
        notificationsStore.add({
          type: "order_ready",
          title: `${meta.emoji} ${stationLabel}`,
          message: t("stations.status.ready", "Pret"),
          audience: serverAudience(),
        })
      }
    },
    [isItemPending, queueFocusBeforeAction, updateItemStatus, meta.emoji, stationLabel, t],
  )

  const handleAskRefuse = useCallback(
    (
      orderId: string,
      itemId: string,
      name: string,
      currentStatus: ItemStatus,
      columnKey: ColumnKey,
    ) => {
      setRefuseTarget({
        orderId,
        itemId,
        name,
        canMarkWaste: currentStatus === "preparing" || currentStatus === "ready",
        columnKey,
      })
    },
    [],
  )

  const handleAdvanceRef = useRef(handleAdvance)
  const handleAskRefuseRef = useRef(handleAskRefuse)
  handleAdvanceRef.current = handleAdvance
  handleAskRefuseRef.current = handleAskRefuse

  const onAdvanceOrder = useCallback(
    (orderId: string, itemId: string, next: ItemStatus, columnKey: ColumnKey) => {
      void handleAdvanceRef.current(orderId, itemId, next, columnKey)
    },
    [],
  )

  const onRefuseOrder = useCallback(
    (
      orderId: string,
      itemId: string,
      name: string,
      currentStatus: ItemStatus,
      columnKey: ColumnKey,
    ) => {
      handleAskRefuseRef.current(orderId, itemId, name, currentStatus, columnKey)
    },
    [],
  )

  const emptyQueueLabel = t("stations.emptyQueue", "File vide")

  const handleConfirmRefuse = useCallback(
    async ({
      reasonCode,
      reasonNote,
      markWaste,
    }: {
      reasonCode: RefusalReasonCode
      reasonNote: string
      markWaste: boolean
    }) => {
      if (!refuseTarget) return
      if (isItemPending(refuseTarget.itemId)) return
      queueFocusBeforeAction(
        refuseTarget.columnKey,
        refuseTarget.orderId,
        refuseTarget.itemId,
      )
      await refuseOrderItem(refuseTarget.orderId, refuseTarget.itemId, {
        code: reasonCode,
        note: reasonNote || undefined,
        markWaste,
      })
      notificationsStore.add({
        type: "info",
        title: `${meta.emoji} ${stationLabel}`,
        message: `${refuseTarget.name} — ${t(
          `stations.refusalReason.${camel(reasonCode)}`,
          reasonCode,
        )}`,
        audience: stationServiceChainAudience(station),
      })
      setRefuseTarget(null)
    },
    [refuseTarget, isItemPending, queueFocusBeforeAction, refuseOrderItem, meta.emoji, stationLabel, t, station],
  )

  const handleBulkRefuse = useCallback(
    async (overrides?: {
      reasonCode?: RefusalReasonCode
      reasonNote?: string
    }) => {
      const status = stationAvail.get(station).status
      const fallbackReason = autoReasonForStatus(status === "OPEN" ? "BUSY" : status)
      const reason: RefusalReasonCode = overrides?.reasonCode ?? fallbackReason
      const note = overrides?.reasonNote ?? ""
      const targets = orders.flatMap((o) =>
        o.items
          .filter(
            (it) =>
              it.station === station &&
              (it.item_status === "new" || it.item_status === "accepted"),
          )
          .map((it) => ({ orderId: o.id, itemId: it.id, name: it.name })),
      )
      let count = 0
      for (const tgt of targets) {
        const ok = await refuseOrderItem(tgt.orderId, tgt.itemId, {
          code: reason,
          note: note || undefined,
        })
        if (ok) count += 1
      }
      if (count > 0) {
        notificationsStore.add({
          type: "info",
          title: `${meta.emoji} ${stationLabel}`,
          message: t(
            "stations.toast.bulkRefuse",
            "{count} item(s) refusé(s) — {reason}",
          )
            .replace("{count}", String(count))
            .replace("{reason}", t(`stations.refusalReason.${camel(reason)}`, reason)),
          audience: stationServiceChainAudience(station),
        })
      }
      try {
        await fetch(`/api/stations/${station}/refuse-bulk`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            reason_code: reason,
            reason_note: note || undefined,
          }),
        })
      } catch {
        /* ignore */
      }
      setBulkOpen(false)
    },
    [stationAvail, station, orders, refuseOrderItem, meta.emoji, stationLabel, t],
  )

  const header = layout === "workspace" ? (
    <div className="shrink-0 border-b border-slate-200/80 bg-white/90 px-3 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <RealtimeIndicator />
        <Badge
          variant="secondary"
          className={cn(
            "hidden text-xs font-semibold sm:inline-flex",
            `bg-gradient-to-r ${meta.gradient} border-0 text-white`,
          )}
        >
          {meta.emoji} {stationLabel}
        </Badge>
        <StationAvailabilityControl station={station} />
        <Badge variant="outline" className="hidden text-xs md:inline-flex">
          {activeCount} {t("kitchen.orderNumber", "items").toLowerCase()}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setBulkOpen(true)}
          className="gap-1.5 border-red-300 text-red-700 hover:bg-red-600 hover:text-white dark:border-red-800 dark:text-red-300"
          title={t("stations.action.refuseAll", "Refuser toute la file")}
        >
          <XOctagon className="h-4 w-4" />
          <span className="hidden lg:inline">{t("stations.action.refuseAll", "Refuser tout")}</span>
        </Button>
        <Button
          size="sm"
          variant={autoPrint ? "default" : "outline"}
          onClick={toggleAutoPrint}
          className={cn("gap-1.5", autoPrint && "bg-emerald-600 text-white hover:bg-emerald-700")}
          title={
            autoPrint
              ? t("kitchen.autoPrintOn", "Auto-impression ON")
              : t("kitchen.autoPrintOff", "Auto-impression OFF")
          }
        >
          {autoPrint ? <PrinterCheck className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
          <span className="hidden lg:inline">{t("kitchen.autoPrint", "Auto-impression")}</span>
        </Button>
      </div>
    </div>
  ) : (
    <SiteHeader
          backHref="/admin"
          backLabel={t("nav.admin", "Admin")}
          hideMainNav
          trailing={
            <div className="flex items-center gap-2">
              <RealtimeIndicator />
              <Badge
                variant="secondary"
                className={cn(
                  "hidden sm:inline-flex text-xs font-semibold",
                  `bg-gradient-to-r ${meta.gradient} text-white border-0`,
                )}
              >
                {meta.emoji} {stationLabel}
              </Badge>
              <StationAvailabilityControl station={station} />
              <Badge variant="outline" className="hidden md:inline-flex text-xs">
                {activeCount}{" "}
                {t("kitchen.orderNumber", "items").toLowerCase()}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkOpen(true)}
                className="gap-1.5 border-red-300 text-red-700 hover:bg-red-600 hover:text-white dark:border-red-800 dark:text-red-300"
                title={t("stations.action.refuseAll", "Refuser toute la file")}
              >
                <XOctagon className="h-4 w-4" />
                <span className="hidden lg:inline">
                  {t("stations.action.refuseAll", "Refuser tout")}
                </span>
              </Button>
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
            </div>
          }
        />
  )

  const main = (
    <>
        {header}

        <StationBoardToast message={toast} />

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
              <div className="text-right tabular-nums">
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
        <div className="hidden flex-1 gap-4 p-4 md:grid md:grid-cols-3 lg:grid-cols-5 lg:gap-4 lg:p-6">
          {columns.map((col) => (
            <StationColumn
              key={col.key}
              col={col}
              station={station}
              focusedOrderId={focusedOrderId}
              focusedColumnKey={focusedColumnKey}
              onAdvanceOrder={onAdvanceOrder}
              onRefuseOrder={onRefuseOrder}
              onPrintOrder={onPrintOrder}
              emptyLabel={emptyQueueLabel}
            />
          ))}
        </div>

        {/* Mobile column */}
        <div className="flex flex-1 flex-col gap-3 p-4 md:hidden">
          {(() => {
            const col = columns.find((c) => c.key === mobileTab)!
            return (
              <StationColumn
                col={col}
                station={station}
                focusedOrderId={focusedOrderId}
                focusedColumnKey={focusedColumnKey}
                onAdvanceOrder={onAdvanceOrder}
                onRefuseOrder={onRefuseOrder}
                onPrintOrder={onPrintOrder}
                emptyLabel={emptyQueueLabel}
              />
            )
          })()}
        </div>

        {/* Agent IA dédié à cette station */}
        <AIAgentBadge context={STATION_TO_AGENT[station]} />

        {/* Refus item */}
        <ItemRefuseDialog
          open={!!refuseTarget}
          onOpenChange={(o) => {
            if (!o) setRefuseTarget(null)
          }}
          itemName={refuseTarget?.name ?? ""}
          canMarkWaste={!!refuseTarget?.canMarkWaste}
          defaultReason={(() => {
            const status = stationAvail.get(station).status
            if (status === "PAUSED" || status === "CLOSED") return "station_fermee"
            if (status === "CLOSING_SOON") return "fin_service"
            if (status === "BUSY") return "rush"
            return "produit_indisponible"
          })()}
          onConfirm={handleConfirmRefuse}
        />

        {/* Refus en bloc */}
        <ItemRefuseDialog
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          itemName={t("stations.refuseDialog.allItems", "tous les items en attente")}
          canMarkWaste={false}
          defaultReason={(() => {
            const status = stationAvail.get(station).status
            if (status === "PAUSED" || status === "CLOSED") return "station_fermee"
            if (status === "CLOSING_SOON") return "fin_service"
            return "rush"
          })()}
          onConfirm={async ({ reasonCode, reasonNote }) => {
            await handleBulkRefuse({ reasonCode, reasonNote })
          }}
        />
    </>
  )

  if (layout === "workspace") {
    return (
      <RequireAuth roles={authRoles}>
        <div
          ref={boardRootRef}
          className="flex min-h-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950"
        >
          {main}
        </div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth roles={authRoles}>
      <PageShell className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div ref={boardRootRef} className="flex min-h-0 flex-1 flex-col">
          {main}
        </div>
      </PageShell>
    </RequireAuth>
  )
}
