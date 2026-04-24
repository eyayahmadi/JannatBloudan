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
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { MotionCard, CountUp, StaggerList, StaggerItem } from "@/components/ui/motion-primitives"
import { SITE } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type StatCard = {
  title: string
  value: string
  change: number
  icon: React.ElementType
  color: string
}

type DashboardPeriod = "today" | "week" | "month"

type OrderItem = {
  quantity: number
  unit_price: number
  subtotal?: number
  product_name?: string | null
  products?: {
    name?: string | null
  } | null
}

type Order = {
  id: string
  order_number?: string | null
  customer_name?: string | null
  customer_email?: string | null
  status?: string | null
  total: number | string
  created_at: string
  order_items?: OrderItem[] | null
  rating?: number | null
}

type Product = {
  id: string
  name: string
  stock_quantity?: number | string | null
}

type TopProduct = {
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

const getAverageRating = (orders: Order[]) => {
  const ratings = orders
    .map((order) => (typeof order.rating === "number" ? order.rating : null))
    .filter((rating): rating is number => rating !== null)
  if (!ratings.length) return null
  const total = ratings.reduce((sum, rating) => sum + rating, 0)
  return total / ratings.length
}

export default function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>("today")
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const [ordersResponse, productsResponse] = await Promise.all([fetch("/api/orders"), fetch("/api/products")])

        if (!ordersResponse.ok) {
          throw new Error("Impossible de charger les commandes")
        }
        if (!productsResponse.ok) {
          throw new Error("Impossible de charger les produits")
        }

        const ordersPayload = await ordersResponse.json()
        const productsPayload = await productsResponse.json()

        setOrders(ordersPayload.orders ?? [])
        setProducts(productsPayload.products ?? [])
      } catch (error) {
        console.error(error)
        setOrders([])
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
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
        ? "Revenus du jour"
        : selectedPeriod === "week"
          ? "Revenus de la semaine"
          : "Revenus du mois"

    return [
      {
        title: periodTitle,
        value: loading ? "-" : formatCurrency(revenue),
        change: calcChange(revenue, previousRevenue),
        icon: DollarSign,
        color: "text-green-600",
      },
      {
        title: "Commandes",
        value: loading ? "-" : orderCount.toString(),
        change: calcChange(orderCount, previousOrderCount),
        icon: ShoppingBag,
        color: "text-blue-600",
      },
      {
        title: "Clients",
        value: loading ? "-" : customerKeys.size.toString(),
        change: calcChange(customerKeys.size, previousCustomerKeys.size),
        icon: Users,
        color: "text-purple-600",
      },
      {
        title: "Note moyenne",
        value: loading ? "-" : averageRating ? averageRating.toFixed(1) : "-",
        change: averageRating && previousAverageRating ? calcChange(averageRating, previousAverageRating) : 0,
        icon: Star,
        color: "text-yellow-600",
      },
    ]
  }, [loading, periodOrders, previousOrders, selectedPeriod])

  const revenueData = useMemo(() => {
    const labels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    const today = new Date()
    const items: { day: string; amount: number }[] = []

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

      items.push({ day: labels[date.getDay()], amount })
    }

    return items
  }, [orders])

  const maxRevenue = Math.max(1, ...revenueData.map((data) => data.amount))

  const topProducts = useMemo((): TopProduct[] => {
    const aggregateSales = (ordersList: Order[]) => {
      const map = new Map<string, { sales: number; revenue: number }>()
      ordersList.forEach((order) => {
        order.order_items?.forEach((item) => {
          const name = item.product_name || item.products?.name || "Produit"
          const current = map.get(name) || { sales: 0, revenue: 0 }
          const revenue = toNumber(item.subtotal) || toNumber(item.unit_price) * toNumber(item.quantity)
          map.set(name, {
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
      .map(([name, value]) => {
        const previousValue = previous.get(name)
        const trend = previousValue ? calcChange(value.revenue, previousValue.revenue) : 0
        return {
          name,
          sales: value.sales,
          revenue: value.revenue,
          trend,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [periodOrders, previousOrders])

  const recentOrders = useMemo(() => {
    return [...periodOrders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((order) => ({
        id: order.order_number || `#${order.id.slice(0, 6)}`,
        customer: order.customer_name || order.customer_email || "Client",
        items: order.order_items?.reduce((sum, item) => sum + toNumber(item.quantity), 0) ?? 0,
        total: toNumber(order.total),
        status: order.status || "en attente",
        time: new Date(order.created_at).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }))
  }, [periodOrders])

  const inventoryAlerts = useMemo((): InventoryAlert[] => {
    const sorted = [...products]
      .filter((product) => product.stock_quantity !== null && product.stock_quantity !== undefined)
      .map((product) => ({
        name: product.name,
        stock: toNumber(product.stock_quantity),
      }))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 4)

    return sorted.map((item) => {
      const threshold = item.stock <= 5 ? 5 : 10
      return {
        item: item.name,
        stock: item.stock,
        unit: "unites",
        threshold,
        status: item.stock <= 5 ? "critical" : "warning",
      }
    })
  }, [products])

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

  return (
    <RequireAuth roles={["ADMIN"]} fallback={<div className="p-6 text-center">Chargement...</div>}>
      <PageShell>
        <SiteHeader
          backHref="/"
          hideMainNav
          trailing={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant={selectedPeriod === "today" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedPeriod("today")}
              >
                Aujourd&apos;hui
              </Button>
              <Button
                variant={selectedPeriod === "week" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedPeriod("week")}
              >
                Semaine
              </Button>
              <Button
                variant={selectedPeriod === "month" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedPeriod("month")}
              >
                Mois
              </Button>
            </div>
          }
        />

        <PageHero
          imageSrc={SITE.images.interior}
          imageAlt=""
          kicker="Administration"
          title="Tableau de bord"
          subtitle="Vue d’ensemble des ventes, stocks et satisfaction."
          height="sm"
        />

        <div className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 animate-fade-up [animation-delay:80ms]">
          <Button asChild variant="outline" className="h-20 bg-transparent">
            <Link href="/admin/menu" className="flex flex-col gap-2">
              <span className="font-semibold">Gestion du Menu</span>
              <span className="text-xs">Plats & Categories</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 bg-transparent">
            <Link href="/admin/inventory" className="flex flex-col gap-2">
              <span className="font-semibold">Stock</span>
              <span className="text-xs">Inventaire</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 bg-transparent">
            <Link href="/admin/purchases" className="flex flex-col gap-2">
              <span className="font-semibold">Achats</span>
              <span className="text-xs">Factures</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 bg-transparent">
            <Link href="/admin/staff" className="flex flex-col gap-2">
              <span className="font-semibold">Personnel</span>
              <span className="text-xs">Equipe</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 bg-transparent">
            <Link href="/admin/reports" className="flex flex-col gap-2">
              <span className="font-semibold">Rapports</span>
              <span className="text-xs">Statistiques</span>
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 animate-fade-up [animation-delay:160ms]">
          <Button asChild variant="outline" className="h-20 border-orange-300/50 bg-orange-50/50 dark:border-orange-800/30 dark:bg-orange-950/20">
            <Link href="/kitchen" className="flex flex-col gap-2">
              <span className="font-semibold">🍽️ Cuisine (KDS)</span>
              <span className="text-xs">Station cuisine</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-cyan-300/60 bg-gradient-to-br from-cyan-50 to-sky-50 dark:border-cyan-700/40 dark:from-cyan-950/30 dark:to-sky-950/30">
            <Link href="/bar" className="flex flex-col gap-2">
              <span className="font-semibold">🍹 Bar</span>
              <span className="text-xs">Station boissons</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-violet-300/60 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:border-violet-700/40 dark:from-violet-950/30 dark:to-fuchsia-950/30">
            <Link href="/shisha" className="flex flex-col gap-2">
              <span className="font-semibold">💨 Chicha</span>
              <span className="text-xs">Station shisha</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-indigo-300/60 bg-gradient-to-br from-indigo-50 to-purple-50 dark:border-indigo-700/40 dark:from-indigo-950/30 dark:to-purple-950/30">
            <Link href="/driver" className="flex flex-col gap-2">
              <span className="font-semibold">🛵 Livreur</span>
              <span className="text-xs">Tracking livraisons</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-blue-300/50 bg-blue-50/50 dark:border-blue-800/30 dark:bg-blue-950/20">
            <Link href="/pos" className="flex flex-col gap-2">
              <span className="font-semibold">Caisse (POS)</span>
              <span className="text-xs">Point de vente</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-purple-300/50 bg-purple-50/50 dark:border-purple-800/30 dark:bg-purple-950/20">
            <Link href="/admin/qr" className="flex flex-col gap-2">
              <span className="font-semibold">QR Codes</span>
              <span className="text-xs">Tables connectees</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-emerald-300/50 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-950/20">
            <Link href="/admin/finance" className="flex flex-col gap-2">
              <span className="font-semibold">Finances</span>
              <span className="text-xs">Revenus & depenses</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-rose-300/50 bg-rose-50/50 dark:border-rose-800/30 dark:bg-rose-950/20">
            <Link href="/admin/hr" className="flex flex-col gap-2">
              <span className="font-semibold">RH</span>
              <span className="text-xs">Employes & planning</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-cyan-300/50 bg-cyan-50/50 dark:border-cyan-800/30 dark:bg-cyan-950/20">
            <Link href="/server" className="flex flex-col gap-2">
              <span className="font-semibold">Serveur</span>
              <span className="text-xs">Commandes table</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-violet-400/60 bg-gradient-to-br from-violet-50 to-purple-50 dark:border-violet-700/40 dark:from-violet-950/30 dark:to-purple-950/30">
            <Link href="/admin/ai" className="flex flex-col gap-2">
              <span className="font-semibold">IA Agents</span>
              <span className="text-xs">10 agents intelligents</span>
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 animate-fade-up [animation-delay:240ms]">
          <Button asChild variant="outline" className="h-20 border-pink-300/50 bg-pink-50/50 dark:border-pink-800/30 dark:bg-pink-950/20">
            <Link href="/admin/events/private" className="flex flex-col gap-2">
              <span className="font-semibold">Evenements prives</span>
              <span className="text-xs">Reservations privees</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-indigo-300/50 bg-indigo-50/50 dark:border-indigo-800/30 dark:bg-indigo-950/20">
            <Link href="/admin/agents" className="flex flex-col gap-2">
              <span className="font-semibold">Observability</span>
              <span className="text-xs">Monitoring agents IA</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-slate-300/50 bg-slate-50/50 dark:border-slate-700/30 dark:bg-slate-900/30">
            <Link href="/admin/settings" className="flex flex-col gap-2">
              <span className="font-semibold">Parametres</span>
              <span className="text-xs">Config systeme</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-amber-400/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-700/40 dark:from-amber-950/30 dark:to-orange-950/30">
            <Link href="/admin/users" className="flex flex-col gap-2">
              <span className="font-semibold">Gestion utilisateurs</span>
              <span className="text-xs">Comptes & roles</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 border-lime-300/50 bg-lime-50/50 dark:border-lime-800/30 dark:bg-lime-950/20">
            <Link href="/admin/events" className="flex flex-col gap-2">
              <span className="font-semibold">Evenements publics</span>
              <span className="text-xs">Calendrier & billets</span>
            </Link>
          </Button>
        </div>

        {/* Stats Grid — animated premium KPI cards */}
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const isNumeric = /[0-9]/.test(stat.value) && stat.value !== "-"
            const numeric = isNumeric
              ? parseFloat(stat.value.replace(/[^0-9.-]/g, "")) || 0
              : 0
            const hasEuro = /€/.test(stat.value)
            const hasPercent = stat.value.endsWith("%")
            const decimals = stat.value.includes(".") ? 1 : 0
            return (
              <StaggerItem key={index}>
                <MotionCard className="relative h-full p-6 shimmer-gold">
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
                  <p className="text-3xl font-bold text-amber-950 dark:text-amber-50 numeric-display">
                    {isNumeric ? (
                      <CountUp
                        value={numeric}
                        prefix={hasEuro ? "€" : ""}
                        suffix={hasPercent ? "%" : ""}
                        decimals={decimals}
                      />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <div className="hairline-gold mt-4" />
                </MotionCard>
              </StaggerItem>
            )
          })}
        </StaggerList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenus sur 7 jours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-4">
                {revenueData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-slate-100 rounded-lg overflow-hidden h-full flex flex-col justify-end">
                      <div
                        className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-blue-500"
                        style={{ height: `${(data.amount / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-slate-900">{data.day}</p>
                      <p className="text-xs text-slate-600">{formatCurrency(data.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-sm text-slate-500">Chargement...</div>
                ) : topProducts.length === 0 ? (
                  <div className="text-sm text-slate-500">Aucun produit vendu.</div>
                ) : (
                  topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{product.name}</p>
                        <p className="text-xs text-slate-600">{product.sales} ventes</p>
                      </div>
                      <div className="text-right">
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
                <CardTitle>Commandes recentes</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/orders">Voir tout</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-sm text-slate-500">Chargement...</div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-sm text-slate-500">Aucune commande pour cette periode.</div>
                ) : (
                  recentOrders.map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{order.id}</p>
                          <p className="text-sm text-slate-600">{order.customer}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-600">{order.items} articles</p>
                          <p className="font-bold text-slate-900">{formatCurrencyDetailed(order.total)}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
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
                <CardTitle>Alertes Stock</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/inventory">Gerer</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-sm text-slate-500">Chargement...</div>
                ) : inventoryAlerts.length === 0 ? (
                  <div className="text-sm text-slate-500">Aucune alerte de stock.</div>
                ) : (
                  inventoryAlerts.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
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
                            Stock: {item.stock} {item.unit}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Commander
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Alerts */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Alertes intelligentes
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
                      <p className="font-medium text-red-900 dark:text-red-200 text-sm">Aucune commande</p>
                      <p className="text-xs text-red-700 dark:text-red-400">Aucune commande enregistree pour cette periode. Verifiez le systeme.</p>
                    </div>
                  </div>
                )}
                {inventoryAlerts.filter(a => a.status === "critical").length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/30">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-200 text-sm">Rupture de stock critique</p>
                      <p className="text-xs text-red-700 dark:text-red-400">{inventoryAlerts.filter(a => a.status === "critical").length} produit(s) en rupture critique. Commandez immediatement.</p>
                    </div>
                  </div>
                )}
                {stats[0] && stats[0].change < -10 && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800/30">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                      <TrendingDown className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-200 text-sm">Baisse de revenus</p>
                      <p className="text-xs text-orange-700 dark:text-orange-400">Les revenus sont en baisse de {Math.abs(stats[0].change)}% par rapport a la periode precedente.</p>
                    </div>
                  </div>
                )}
                {recentOrders.length > 0 && recentOrders.some(o => o.status === "en attente") && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/40">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-200 text-sm">Commandes en attente</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">Des commandes sont en attente depuis plus longtemps que la normale.</p>
                    </div>
                  </div>
                )}
                {periodOrders.length > 0 && inventoryAlerts.length === 0 && stats[0]?.change >= 0 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                      <Star className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-200 text-sm">Tout va bien</p>
                      <p className="text-xs text-green-700 dark:text-green-400">Aucune alerte critique. Les operations se deroulent normalement.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Suggestions d&apos;optimisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                    <p className="font-medium text-blue-900 dark:text-blue-200 text-sm">Mettre en avant &quot;{topProducts[0]?.name}&quot;</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">Ce plat genere le plus de revenus. Envisagez de le promouvoir en homepage et sur les reseaux sociaux.</p>
                  </div>
                )}
                {topProducts.length > 1 && topProducts[topProducts.length - 1]?.trend < 0 && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800/30">
                    <p className="font-medium text-purple-900 dark:text-purple-200 text-sm">Revoir le prix de &quot;{topProducts[topProducts.length - 1]?.name}&quot;</p>
                    <p className="text-xs text-purple-700 dark:text-purple-400">Ce produit est en baisse. Considerez une promotion ou un ajustement de recette.</p>
                  </div>
                )}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                  <p className="font-medium text-emerald-900 dark:text-emerald-200 text-sm">Optimiser les heures de pointe</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Analysez les heures de commande pour ajuster le personnel et reduire les temps d&apos;attente.</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
                  <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">Programme de fidelite</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Les clients reguliers generent 60% du chiffre. Renforcez le programme de fidelite pour augmenter la retention.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        <AIAgentBadge context="admin" />
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
