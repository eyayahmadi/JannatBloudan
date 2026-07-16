"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import Link from "next/link"
import { useAdminPortal } from "@/components/admin/admin-portal-context"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { useI18n } from "@/lib/i18n/context"
import { formatMessage } from "@/lib/i18n/format-message"
import { resolveLocalizedName } from "@/lib/i18n/localized-name"
import type { Locale } from "@/lib/i18n/config"
import { resolveOrderCustomerDisplay } from "@/lib/orders/customer-display"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { MotionCard, CountUp } from "@/components/ui/motion-primitives"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type StatCard = {
  id: string
  title: string
  value: string
  change: number
  icon: React.ElementType
  color: string
}

type RevenueChartPoint = {
  dayKey: (typeof DAY_KEYS)[number]
  dateKey: string
  amount: number
}

type DashboardPeriod = "today" | "week" | "month"

type OrderItem = {
  quantity: number
  unit_price: number
  subtotal?: number
  product_name?: string | null
  products?: {
    id?: string | null
    name?: string | null
    name_de?: string | null
    name_fr?: string | null
    name_en?: string | null
    name_ar?: string | null
  } | null
}

type Order = {
  id: string
  order_number?: string | null
  customer_name?: string | null
  customer_email?: string | null
  table_number?: number | null
  status?: string | null
  total: number | string
  created_at: string
  order_items?: OrderItem[] | null
  rating?: number | null
}

type Product = {
  id: string
  name: string
  name_de?: string | null
  name_fr?: string | null
  name_en?: string | null
  name_ar?: string | null
  stock_quantity?: number | string | null
}

type TopProduct = {
  id: string
  name: string
  sales: number
  revenue: number
  trend: number
}

type InventoryAlert = {
  item: string
  stock: number
  unit: string
  threshold: number
  status: "critical" | "warning"
}

const formatNumber = (value: number, decimals = 0) => {
  const fixed = value.toFixed(decimals)
  const parts = fixed.split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return parts.join(decimals > 0 ? "." : "")
}

const formatCurrency = (value: number) => `${formatNumber(value)} EUR`

const formatCurrencyDetailed = (value: number) => `${formatNumber(value, 2)} EUR`

const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

const normalizeText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

const getPeriodRange = (period: DashboardPeriod) => {
  const now = new Date()
  const start = new Date(now)

  if (period === "today") {
    start.setHours(0, 0, 0, 0)
  } else if (period === "week") {
    const mondayIndex = (now.getDay() + 6) % 7
    start.setDate(now.getDate() - mondayIndex)
    start.setHours(0, 0, 0, 0)
  } else {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }

  return { start, end: now }
}

const getPreviousRange = (range: { start: Date; end: Date }) => {
  const duration = range.end.getTime() - range.start.getTime()
  return {
    start: new Date(range.start.getTime() - duration),
    end: range.start,
  }
}

const calcChange = (current: number, previous: number) => {
  if (!previous) return 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const
const CHART_BAR_AREA_PX = 160

function WidgetSkeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/60 dark:bg-slate-700/40 ${className ?? ""}`} />
}

const resolveIntlLocale = (locale: Locale): string => {
  switch (locale) {
    case "ar":
      return "ar-TN"
    case "en":
      return "en-GB"
    case "de":
      return "de-DE"
    default:
      return "fr-FR"
  }
}

const getAverageRating = (orders: Order[]) => {
  const ratings = orders
    .map((order) => (typeof order.rating === "number" ? order.rating : null))
    .filter((rating): rating is number => rating !== null)
  if (!ratings.length) return null
  const total = ratings.reduce((sum, rating) => sum + rating, 0)
  return total / ratings.length
}

export default function AdminDashboard() {
  const { dashboardPeriod: selectedPeriod } = useAdminPortal()
  const { t, locale } = useI18n()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<"orders" | "products" | "generic" | null>(null)
  const [overviewExtras, setOverviewExtras] = useState({
    reservationsToday: 0,
    upcomingEvents: 0,
  })

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setLoadError(null)
        const [ordersResponse, productsResponse] = await Promise.all([fetch("/api/orders"), fetch("/api/products")])

        if (cancelled) return

        if (!ordersResponse.ok) {
          setLoadError("orders")
          return
        }
        if (!productsResponse.ok) {
          setLoadError("products")
          return
        }

        const ordersPayload = await ordersResponse.json()
        const productsPayload = await productsResponse.json()

        if (cancelled) return

        setOrders(ordersPayload.orders ?? [])
        setProducts(productsPayload.products ?? [])
      } catch (error) {
        if (cancelled) return
        console.error(error)
        setLoadError("generic")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadOverview() {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const [rRes, eRes] = await Promise.all([fetch("/api/reservations"), fetch("/api/events")])
        const rJson = rRes.ok ? await rRes.json().catch(() => ({})) : {}
        const eJson = eRes.ok ? await eRes.json().catch(() => ({})) : {}
        if (cancelled) return
        const reservations = Array.isArray(rJson.reservations) ? rJson.reservations : []
        const resToday = reservations.filter(
          (x: { reservation_date?: string }) => x.reservation_date === today,
        ).length
        const events = Array.isArray(eJson.events) ? eJson.events : []
        const up = events.filter((e: { event_date?: string }) => (e.event_date ?? "") >= today).length
        setOverviewExtras({ reservationsToday: resToday, upcomingEvents: up })
      } catch {
        if (!cancelled) setOverviewExtras({ reservationsToday: 0, upcomingEvents: 0 })
      }
    }
    void loadOverview()
    return () => {
      cancelled = true
    }
  }, [])

  const { periodOrders, previousOrders } = useMemo(() => {
    const range = getPeriodRange(selectedPeriod)
    const previousRange = getPreviousRange(range)

    const filterByRange = (list: Order[], start: Date, end: Date) =>
      list.filter((order) => {
        const createdAt = new Date(order.created_at)
        return createdAt >= start && createdAt < end
      })

    return {
      periodOrders: filterByRange(orders, range.start, range.end),
      previousOrders: filterByRange(orders, previousRange.start, previousRange.end),
    }
  }, [orders, selectedPeriod])

  const translateStatus = (status: string) => {
    const normalized = normalizeText(status)
    switch (normalized) {
      case "livree":
      case "livre":
      case "delivered":
        return t("admin.dashboard.status.delivered")
      case "en cours":
      case "in progress":
        return t("admin.dashboard.status.inProgress")
      case "en preparation":
      case "in preparation":
        return t("admin.dashboard.status.inPreparation")
      case "preparation":
        return t("admin.dashboard.status.preparation")
      case "prete":
      case "ready":
        return t("admin.dashboard.status.ready")
      case "en attente":
      case "pending":
        return t("admin.dashboard.status.pending")
      default:
        return status
    }
  }

  const isPendingStatus = (status: string) => {
    const normalized = normalizeText(status)
    return normalized === "en attente" || normalized === "pending"
  }

  const stats = useMemo((): StatCard[] => {
    const revenue = periodOrders.reduce((sum, order) => sum + toNumber(order.total), 0)
    const previousRevenue = previousOrders.reduce((sum, order) => sum + toNumber(order.total), 0)

    const orderCount = periodOrders.length
    const previousOrderCount = previousOrders.length

    const customerKeys = new Set(
      periodOrders.map((order) => order.customer_email || order.customer_name || order.id),
    )
    const previousCustomerKeys = new Set(
      previousOrders.map((order) => order.customer_email || order.customer_name || order.id),
    )

    const averageRating = getAverageRating(periodOrders)
    const previousAverageRating = getAverageRating(previousOrders)

    const periodTitle =
      selectedPeriod === "today"
        ? t("admin.dashboard.stats.revenueToday")
        : selectedPeriod === "week"
          ? t("admin.dashboard.stats.revenueWeek")
          : t("admin.dashboard.stats.revenueMonth")

    return [
      {
        id: "revenue",
        title: periodTitle,
        value: loading ? "-" : formatCurrency(revenue),
        change: calcChange(revenue, previousRevenue),
        icon: DollarSign,
        color: "text-green-600",
      },
      {
        id: "orders",
        title: t("admin.dashboard.stats.orders"),
        value: loading ? "-" : orderCount.toString(),
        change: calcChange(orderCount, previousOrderCount),
        icon: ShoppingBag,
        color: "text-blue-600",
      },
      {
        id: "customers",
        title: t("admin.dashboard.stats.customers"),
        value: loading ? "-" : customerKeys.size.toString(),
        change: calcChange(customerKeys.size, previousCustomerKeys.size),
        icon: Users,
        color: "text-purple-600",
      },
      {
        id: "rating",
        title: t("admin.dashboard.stats.averageRating"),
        value: loading ? "-" : averageRating ? averageRating.toFixed(1) : "-",
        change: averageRating && previousAverageRating ? calcChange(averageRating, previousAverageRating) : 0,
        icon: Star,
        color: "text-yellow-600",
      },
    ]
  }, [loading, periodOrders, previousOrders, selectedPeriod, t])

  const revenueChartPoints = useMemo((): RevenueChartPoint[] => {
    const today = new Date()
    const items: RevenueChartPoint[] = []

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today)
      date.setDate(today.getDate() - offset)
      date.setHours(0, 0, 0, 0)

      const next = new Date(date)
      next.setDate(date.getDate() + 1)

      const amount = orders
        .filter((order) => {
          const createdAt = new Date(order.created_at)
          return createdAt >= date && createdAt < next
        })
        .reduce((sum, order) => sum + toNumber(order.total), 0)

      items.push({
        dayKey: DAY_KEYS[date.getDay()],
        dateKey: date.toISOString().slice(0, 10),
        amount,
      })
    }

    return items
  }, [orders])

  const maxRevenue = Math.max(1, ...revenueChartPoints.map((point) => point.amount))

  const topProducts = useMemo((): TopProduct[] => {
    const aggregateSales = (ordersList: Order[]) => {
      const map = new Map<string, { name: string; sales: number; revenue: number }>()
      ordersList.forEach((order) => {
        order.order_items?.forEach((item) => {
          const productKey = String(item.products?.id ?? item.product_name ?? "unknown")
          const name = resolveLocalizedName(
            item.products ?? { name: item.product_name },
            locale,
            t("admin.dashboard.defaults.product"),
          )
          const current = map.get(productKey) || { name, sales: 0, revenue: 0 }
          const revenue = toNumber(item.subtotal) || toNumber(item.unit_price) * toNumber(item.quantity)
          map.set(productKey, {
            name: current.name || name,
            sales: current.sales + toNumber(item.quantity),
            revenue: current.revenue + revenue,
          })
        })
      })
      return map
    }

    const current = aggregateSales(periodOrders)
    const previous = aggregateSales(previousOrders)

    return Array.from(current.entries())
      .map(([id, value]) => {
        const previousValue = previous.get(id)
        const trend = previousValue ? calcChange(value.revenue, previousValue.revenue) : 0
        return {
          id,
          name: value.name,
          sales: value.sales,
          revenue: value.revenue,
          trend,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [periodOrders, previousOrders, locale, t])

  const recentOrders = useMemo(() => {
    return [...periodOrders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((order) => {
        const rawStatus = order.status || "en attente"
        return {
          id: order.order_number || `#${order.id.slice(0, 6)}`,
          customer:
            resolveOrderCustomerDisplay(order.customer_name, order.table_number, locale) ??
            order.customer_email ??
            t("admin.dashboard.defaults.customer"),
          items: order.order_items?.reduce((sum, item) => sum + toNumber(item.quantity), 0) ?? 0,
          total: toNumber(order.total),
          rawStatus,
          status: translateStatus(rawStatus),
          time: new Date(order.created_at).toLocaleTimeString(resolveIntlLocale(locale), {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }
      })
  }, [periodOrders, locale, t])

  const inventoryAlerts = useMemo((): InventoryAlert[] => {
    const sorted = [...products]
      .filter((product) => product.stock_quantity !== null && product.stock_quantity !== undefined)
      .map((product) => ({
        name: resolveLocalizedName(product, locale, product.name),
        stock: toNumber(product.stock_quantity),
      }))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 4)

    return sorted.map((item) => {
      const threshold = item.stock <= 5 ? 5 : 10
      return {
        item: item.name,
        stock: item.stock,
        unit: t("admin.dashboard.inventoryAlerts.units"),
        threshold,
        status: item.stock <= 5 ? "critical" : "warning",
      }
    })
  }, [products, locale, t])

  const getStatusColor = (status: string) => {
    const normalized = normalizeText(status)
    switch (normalized) {
      case "livree":
      case "livre":
        return "bg-green-100 text-green-700"
      case "en cours":
      case "en preparation":
        return "bg-blue-100 text-blue-700"
      case "preparation":
      case "prete":
        return "bg-orange-100 text-orange-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const revenueVal = periodOrders.reduce((sum, order) => sum + toNumber(order.total), 0)

  const dashboardErrorMessage =
    loadError === "orders"
      ? t("admin.dashboard.errors.loadOrders")
      : loadError === "products"
        ? t("admin.dashboard.errors.loadProducts")
        : loadError === "generic"
          ? t("admin.dashboard.errors.loadDashboard")
          : null

  return (
    <RequireAuth roles={["ADMIN"]} fallback={<div className="p-6 text-center">{t("admin.dashboard.loading")}</div>}>
      <div className="animate-fade-up space-y-8">
        <div className="border-b border-[color:var(--lux-bordeaux)]/10 pb-6 dark:border-zinc-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-900/45 dark:text-amber-200/50">
            {t("admin.dashboard.eyebrow")}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-amber-950 dark:text-amber-50 sm:text-3xl">
            {t("admin.dashboard.title")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-amber-900/65 dark:text-amber-200/65">
            {t("admin.dashboard.subtitle")}{" "}
            <span className="font-medium text-amber-950 dark:text-amber-100">
              {selectedPeriod === "today"
                ? t("admin.dashboard.periodToday")
                : selectedPeriod === "week"
                  ? t("admin.dashboard.periodWeek")
                  : t("admin.dashboard.periodMonth")}
            </span>
            . {t("admin.dashboard.subtitleHint")}
          </p>
        </div>

        {dashboardErrorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            {dashboardErrorMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <Link
            href="/admin/finance"
            className="group rounded-2xl border border-amber-900/10 bg-gradient-to-br from-white to-[color:var(--lux-cream)]/40 p-4 shadow-sm transition hover:border-[color:var(--lux-gold)]/35 dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-900/40"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/50 dark:text-amber-200/50">
              {t("admin.dashboard.quickLinks.revenue.title")} (
              {selectedPeriod === "today"
                ? t("admin.dashboard.periodShort.day")
                : selectedPeriod === "week"
                  ? t("admin.dashboard.periodShort.week")
                  : t("admin.dashboard.periodShort.month")}
              )
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-amber-950 dark:text-amber-50" translate="no">
              {loading ? "—" : formatCurrencyDetailed(revenueVal)}
            </p>
            <p className="mt-1 text-[11px] text-amber-900/55 dark:text-amber-200/55">
              {t("admin.dashboard.quickLinks.revenue.subtitle")}
            </p>
          </Link>
          <Link
            href="/pos"
            className="group rounded-2xl border border-amber-900/10 bg-gradient-to-br from-white to-[color:var(--lux-cream)]/40 p-4 shadow-sm transition hover:border-[color:var(--lux-gold)]/35 dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-900/40"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/50 dark:text-amber-200/50">
              {t("admin.dashboard.quickLinks.orders.title")}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-amber-950 dark:text-amber-50" translate="no">
              {loading ? "—" : periodOrders.length}
            </p>
            <p className="mt-1 text-[11px] text-amber-900/55 dark:text-amber-200/55">
              {t("admin.dashboard.quickLinks.orders.subtitle")}
            </p>
          </Link>
          <Link
            href="/admin/ai/reservation"
            className="group rounded-2xl border border-amber-900/10 bg-gradient-to-br from-white to-[color:var(--lux-cream)]/40 p-4 shadow-sm transition hover:border-[color:var(--lux-gold)]/35 dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-900/40"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/50 dark:text-amber-200/50">
              {t("admin.dashboard.quickLinks.reservationsToday.title")}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-amber-950 dark:text-amber-50">
              {overviewExtras.reservationsToday}
            </p>
            <p className="mt-1 text-[11px] text-amber-900/55 dark:text-amber-200/55">
              {t("admin.dashboard.quickLinks.reservationsToday.subtitle")}
            </p>
          </Link>
          <Link
            href="/admin/inventory"
            className="group rounded-2xl border border-amber-900/10 bg-gradient-to-br from-white to-[color:var(--lux-cream)]/40 p-4 shadow-sm transition hover:border-[color:var(--lux-gold)]/35 dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-900/40"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/50 dark:text-amber-200/50">
              {t("admin.dashboard.quickLinks.stockAlerts.title")}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-amber-950 dark:text-amber-50">
              {inventoryAlerts.length}
            </p>
            <p className="mt-1 text-[11px] text-amber-900/55 dark:text-amber-200/55">
              {t("admin.dashboard.quickLinks.stockAlerts.subtitle")}
            </p>
          </Link>
          <Link
            href="/admin/events"
            className="group rounded-2xl border border-amber-900/10 bg-gradient-to-br from-white to-[color:var(--lux-cream)]/40 p-4 shadow-sm transition hover:border-[color:var(--lux-gold)]/35 dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-900/40"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/50 dark:text-amber-200/50">
              {t("admin.dashboard.quickLinks.upcomingEvents.title")}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-amber-950 dark:text-amber-50">
              {overviewExtras.upcomingEvents}
            </p>
            <p className="mt-1 text-[11px] text-amber-900/55 dark:text-amber-200/55">
              {t("admin.dashboard.quickLinks.upcomingEvents.subtitle")}
            </p>
          </Link>
          <Link
            href="/admin/supplier-invoices"
            className="group rounded-2xl border border-amber-900/10 bg-gradient-to-br from-white to-[color:var(--lux-cream)]/40 p-4 shadow-sm transition hover:border-[color:var(--lux-gold)]/35 dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-900/40"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/50 dark:text-amber-200/50">
              {t("admin.dashboard.quickLinks.supplierInvoices.title")}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-amber-950 dark:text-amber-50">→</p>
            <p className="mt-1 text-[11px] text-amber-900/55 dark:text-amber-200/55">
              {t("admin.dashboard.quickLinks.supplierInvoices.subtitle")}
            </p>
          </Link>
          <Link
            href="/caisse"
            className="group rounded-2xl border border-amber-900/10 bg-gradient-to-br from-white to-[color:var(--lux-cream)]/40 p-4 shadow-sm transition hover:border-[color:var(--lux-gold)]/35 dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-900/40"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/50 dark:text-amber-200/50">
              {t("admin.dashboard.quickLinks.cashRegister.title")}
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-amber-950 dark:text-amber-50">
              {t("admin.dashboard.quickLinks.cashRegister.value")}
            </p>
            <p className="mt-1 text-[11px] text-amber-900/55 dark:text-amber-200/55">
              {t("admin.dashboard.quickLinks.cashRegister.subtitle")}
            </p>
          </Link>
          <Link
            href="/admin/staff"
            className="group rounded-2xl border border-amber-900/10 bg-gradient-to-br from-white to-[color:var(--lux-cream)]/40 p-4 shadow-sm transition hover:border-[color:var(--lux-gold)]/35 dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-900/40"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/50 dark:text-amber-200/50">
              {t("admin.dashboard.quickLinks.team.title")}
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-amber-950 dark:text-amber-50">
              {t("admin.dashboard.quickLinks.team.value")}
            </p>
            <p className="mt-1 text-[11px] text-amber-900/55 dark:text-amber-200/55">
              {t("admin.dashboard.quickLinks.team.subtitle")}
            </p>
          </Link>
          <Link
            href="/admin/ai"
            className="group rounded-2xl border border-[color:var(--lux-gold)]/35 bg-gradient-to-br from-[color:var(--lux-bordeaux)]/10 to-[color:var(--lux-cream)]/50 p-4 shadow-sm transition hover:shadow-[var(--lux-shadow-gold)] dark:border-[color:var(--lux-gold)]/25 dark:from-zinc-900 dark:to-zinc-800/80"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--lux-bordeaux)] dark:text-amber-200/70">
              {t("admin.dashboard.quickLinks.aiInsights.title")}
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-amber-950 dark:text-amber-50">
              {t("admin.dashboard.quickLinks.aiInsights.value")}
            </p>
            <p className="mt-1 text-[11px] text-amber-900/60 dark:text-amber-200/55">
              {t("admin.dashboard.quickLinks.aiInsights.subtitle")}
            </p>
          </Link>
        </div>

        {/* Stats Grid — KPI cards (no stagger: avoids blank cards on locale change) */}
        <div id="admin-analytics" className="scroll-mt-28">
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            const isNumeric = /[0-9]/.test(stat.value) && stat.value !== "-"
            const numeric = isNumeric
              ? parseFloat(stat.value.replace(/[^0-9.-]/g, "")) || 0
              : 0
            const hasCurrency = /\bEUR\b|€/i.test(stat.value)
            const hasPercent = stat.value.endsWith("%")
            const decimals = stat.value.includes(".") ? (stat.id === "rating" ? 1 : 2) : 0
            return (
              <MotionCard key={stat.id} className="relative p-6 shimmer-gold">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 rounded-xl bg-[color-mix(in_srgb,var(--lux-gold)_12%,transparent)] ${stat.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    {stat.change !== 0 && (
                      <div
                        className={`flex items-center gap-1 text-sm font-medium rounded-full px-2 py-1 ${
                          stat.change > 0
                            ? "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "bg-rose-100/60 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        }`}
                      >
                        {stat.change > 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        <span>{Math.abs(stat.change)}%</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-amber-900/70 mb-1 dark:text-amber-200/70">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-amber-950 dark:text-amber-50 numeric-display" translate="no">
                    {loading ? (
                      <WidgetSkeleton className="inline-block h-9 w-28" />
                    ) : isNumeric ? (
                      <CountUp
                        value={numeric}
                        prefix={hasCurrency ? "" : ""}
                        suffix={hasCurrency ? " EUR" : hasPercent ? "%" : ""}
                        decimals={decimals}
                      />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <div className="hairline-gold mt-4" />
                </MotionCard>
            )
          })}
        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("admin.dashboard.charts.revenue7Days")}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex w-full items-end gap-2 sm:gap-3" style={{ minHeight: "12rem" }}>
                  {Array.from({ length: 7 }).map((_, index) => (
                    <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <WidgetSkeleton className="h-40 w-full rounded-lg" />
                      <WidgetSkeleton className="h-3 w-10 rounded" />
                      <WidgetSkeleton className="h-3 w-14 rounded" />
                    </div>
                  ))}
                </div>
              ) : dashboardErrorMessage ? (
                <div className="flex min-h-[12rem] items-center justify-center text-sm text-red-600 dark:text-red-400">
                  {dashboardErrorMessage}
                </div>
              ) : (
                <div
                  className="flex w-full items-end gap-2 sm:gap-3"
                  style={{ minHeight: "12rem" }}
                  data-no-translate
                  translate="no"
                >
                  {revenueChartPoints.map((point) => {
                    const dayLabel = t(`admin.dashboard.days.${point.dayKey}`)
                    const barHeightPx =
                      point.amount > 0
                        ? Math.max(Math.round((point.amount / maxRevenue) * CHART_BAR_AREA_PX), 4)
                        : 0
                    return (
                      <div
                        key={point.dateKey}
                        className="flex min-w-0 flex-1 flex-col items-center gap-2"
                      >
                        <div
                          className="relative flex w-full items-end rounded-lg bg-slate-100 dark:bg-slate-800/50"
                          style={{ height: CHART_BAR_AREA_PX }}
                        >
                          <div
                            className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-[height] duration-300 hover:from-blue-700 hover:to-blue-500"
                            style={{ height: barHeightPx }}
                            title={`${dayLabel}: ${formatCurrency(point.amount)}`}
                          />
                        </div>
                        <div className="shrink-0 text-center">
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{dayLabel}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400" translate="no">
                            {formatCurrency(point.amount)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {!loading && !dashboardErrorMessage && orders.length > 0 && revenueChartPoints.every((p) => p.amount === 0) ? (
                <p className="mt-3 text-center text-xs text-slate-500">{t("admin.dashboard.chartsNoData")}</p>
              ) : null}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.dashboard.charts.topProducts")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between gap-3">
                        <WidgetSkeleton className="h-10 flex-1 rounded-lg" />
                        <WidgetSkeleton className="h-8 w-16 rounded" />
                      </div>
                    ))}
                  </div>
                ) : dashboardErrorMessage ? (
                  <div className="text-sm text-red-600 dark:text-red-400">{dashboardErrorMessage}</div>
                ) : topProducts.length === 0 ? (
                  <div className="text-sm text-slate-500">{t("admin.dashboard.topProducts.empty")}</div>
                ) : (
                  topProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{product.name}</p>
                        <p className="text-xs text-slate-600">
                          {formatMessage(t("admin.dashboard.topProducts.sales"), { count: product.sales })}
                        </p>
                      </div>
                      <div className="text-right" translate="no">
                        <p className="font-bold text-slate-900 text-sm">{formatCurrencyDetailed(product.revenue)}</p>
                        <div
                          className={`flex items-center gap-1 text-xs ${
                            product.trend > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {product.trend > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{Math.abs(product.trend)}%</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("admin.dashboard.recentOrders.title")}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/pos">{t("admin.dashboard.recentOrders.viewAll")}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <WidgetSkeleton key={index} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : dashboardErrorMessage ? (
                  <div className="text-sm text-red-600 dark:text-red-400">{dashboardErrorMessage}</div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-sm text-slate-500">{t("admin.dashboard.recentOrders.empty")}</div>
                ) : (
                  recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{order.id}</p>
                          <p className="text-sm text-slate-600">{order.customer}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right" translate="no">
                          <p className="text-sm text-slate-600">
                            {formatMessage(t("admin.dashboard.recentOrders.articles"), { count: order.items })}
                          </p>
                          <p className="font-bold text-slate-900">{formatCurrencyDetailed(order.total)}</p>
                        </div>
                        <Badge className={getStatusColor(order.rawStatus)}>{order.status}</Badge>
                        <p className="text-sm text-slate-500 w-12">{order.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("admin.dashboard.inventoryAlerts.title")}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/inventory">{t("admin.dashboard.inventoryAlerts.manage")}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <WidgetSkeleton key={index} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : dashboardErrorMessage ? (
                  <div className="text-sm text-red-600 dark:text-red-400">{dashboardErrorMessage}</div>
                ) : inventoryAlerts.length === 0 ? (
                  <div className="text-sm text-slate-500">{t("admin.dashboard.inventoryAlerts.empty")}</div>
                ) : (
                  inventoryAlerts.map((item) => (
                    <div key={item.item} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${item.status === "critical" ? "bg-red-100" : "bg-orange-100"}`}
                        >
                          <AlertTriangle
                            className={`w-4 h-4 ${item.status === "critical" ? "text-red-600" : "text-orange-600"}`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{item.item}</p>
                          <p className="text-xs text-slate-600">
                            {formatMessage(t("admin.dashboard.inventoryAlerts.stock"), {
                              stock: item.stock,
                              unit: item.unit,
                            })}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        {t("admin.dashboard.inventoryAlerts.order")}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Alerts */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card id="portal-alerts" className="scroll-mt-28">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                {t("admin.dashboard.alerts.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {periodOrders.length === 0 && !loading && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/30">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-200 text-sm">
                        {t("admin.dashboard.alerts.noOrders.title")}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-400">
                        {t("admin.dashboard.alerts.noOrders.description")}
                      </p>
                    </div>
                  </div>
                )}
                {inventoryAlerts.filter(a => a.status === "critical").length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/30">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-200 text-sm">
                        {t("admin.dashboard.alerts.criticalStock.title")}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-400">
                        {formatMessage(t("admin.dashboard.alerts.criticalStock.description"), {
                          count: inventoryAlerts.filter(a => a.status === "critical").length,
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {stats[0] && stats[0].change < -10 && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800/30">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                      <TrendingDown className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-200 text-sm">
                        {t("admin.dashboard.alerts.revenueDrop.title")}
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-400">
                        {formatMessage(t("admin.dashboard.alerts.revenueDrop.description"), {
                          percent: Math.abs(stats[0].change),
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {recentOrders.length > 0 && recentOrders.some(o => isPendingStatus(o.rawStatus)) && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/40">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-200 text-sm">
                        {t("admin.dashboard.alerts.pendingOrders.title")}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        {t("admin.dashboard.alerts.pendingOrders.description")}
                      </p>
                    </div>
                  </div>
                )}
                {periodOrders.length > 0 && inventoryAlerts.length === 0 && stats[0]?.change >= 0 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                      <Star className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-200 text-sm">
                        {t("admin.dashboard.alerts.allGood.title")}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        {t("admin.dashboard.alerts.allGood.description")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card id="portal-suggestions" className="scroll-mt-28">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                {t("admin.dashboard.suggestions.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                    <p className="font-medium text-blue-900 dark:text-blue-200 text-sm">
                      {formatMessage(t("admin.dashboard.suggestions.promoteTop.title"), {
                        name: topProducts[0]?.name ?? "",
                      })}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      {t("admin.dashboard.suggestions.promoteTop.description")}
                    </p>
                  </div>
                )}
                {topProducts.length > 1 && topProducts[topProducts.length - 1]?.trend < 0 && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800/30">
                    <p className="font-medium text-purple-900 dark:text-purple-200 text-sm">
                      {formatMessage(t("admin.dashboard.suggestions.reviewPrice.title"), {
                        name: topProducts[topProducts.length - 1]?.name ?? "",
                      })}
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-400">
                      {t("admin.dashboard.suggestions.reviewPrice.description")}
                    </p>
                  </div>
                )}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                  <p className="font-medium text-emerald-900 dark:text-emerald-200 text-sm">
                    {t("admin.dashboard.suggestions.peakHours.title")}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {t("admin.dashboard.suggestions.peakHours.description")}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
                  <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">
                    {t("admin.dashboard.suggestions.loyalty.title")}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {t("admin.dashboard.suggestions.loyalty.description")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <AIAgentBadge context="admin" />
      </div>
    </RequireAuth>
  )
}
