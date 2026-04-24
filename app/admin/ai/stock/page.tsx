"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Package,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
  Truck,
  Cpu,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type SupplierOrder = {
  product: string
  quantity: number
  estimatedCost: number
  priority: string
}

type Prediction = {
  id: string
  name: string
  stock: number
  unit: string
  avgDailyUsage: number
  daysUntilStockout: number
  recommendedReorderQty: number
  confidence: number
  urgency: "critical" | "warning" | "ok"
  projectedStockoutDate: string
  supplierOrder: SupplierOrder | null
}

type StockResponse = {
  predictions: Prediction[]
  summary: {
    totalProducts: number
    critical: number
    warning: number
    healthy: number
  }
  algorithm: string
  generatedAt: string
}

const URGENCY_STYLES: Record<string, { badge: string; bar: string; label: string }> = {
  critical: {
    badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
    bar: "bg-red-500",
    label: "Critique",
  },
  warning: {
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
    bar: "bg-amber-500",
    label: "Attention",
  },
  ok: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    bar: "bg-emerald-500",
    label: "Sain",
  },
}

export default function StockPredictionPage() {
  const [data, setData] = useState<StockResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStock = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/stock")
      const json = await res.json()
      setData(json)
    } catch {
      /* silently handle */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStock()
  }, [fetchStock])

  const maxDays = data
    ? Math.max(...data.predictions.map((p) => p.daysUntilStockout), 1)
    : 1

  const supplierOrders = data
    ? data.predictions.filter((p) => p.supplierOrder !== null)
    : []

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/admin" backLabel="Dashboard" hideMainNav />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Agent Stock Predictif
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Predictions de rupture et gestion automatisee des commandes
                </p>
              </div>
            </div>
            <Button
              onClick={fetchStock}
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-md"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                  <CardContent className="flex items-center gap-4 py-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                      <Package className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {data.summary.totalProducts}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Total produits
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                  <CardContent className="flex items-center gap-4 py-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/50">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {data.summary.critical}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Critiques
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                  <CardContent className="flex items-center gap-4 py-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {data.summary.warning}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Avertissements
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                  <CardContent className="flex items-center gap-4 py-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                      <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {data.summary.healthy}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Sains
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Table */}
              <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-900 dark:text-white">
                    Predictions de stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                            Produit
                          </th>
                          <th className="pb-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                            Stock actuel
                          </th>
                          <th className="pb-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                            Usage/jour
                          </th>
                          <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                            Jours restants
                          </th>
                          <th className="pb-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                            Date rupture
                          </th>
                          <th className="pb-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                            Qte a commander
                          </th>
                          <th className="pb-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                            Confiance
                          </th>
                          <th className="pb-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                            Urgence
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.predictions.map((p) => {
                          const style = URGENCY_STYLES[p.urgency]
                          const barWidth = Math.min(
                            (p.daysUntilStockout / maxDays) * 100,
                            100,
                          )
                          return (
                            <tr key={p.id} className="group">
                              <td className="py-3 pr-3">
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {p.name}
                                </p>
                              </td>
                              <td className="py-3 text-center text-slate-700 dark:text-slate-300">
                                {p.stock} {p.unit}
                              </td>
                              <td className="py-3 text-center text-slate-700 dark:text-slate-300">
                                {p.avgDailyUsage} {p.unit}
                              </td>
                              <td className="py-3 pr-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                    <div
                                      className={`h-full rounded-full ${style.bar} transition-all`}
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {p.daysUntilStockout}j
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 text-center text-xs text-slate-600 dark:text-slate-400">
                                {p.projectedStockoutDate}
                              </td>
                              <td className="py-3 text-center font-medium text-slate-900 dark:text-white">
                                {p.recommendedReorderQty} {p.unit}
                              </td>
                              <td className="py-3 text-center">
                                <span
                                  className={`text-xs font-bold ${
                                    p.confidence >= 85
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : p.confidence >= 75
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {p.confidence}%
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <Badge className={style.badge}>
                                  {style.label}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Days Until Stockout Chart */}
              <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-900 dark:text-white">
                    Jours avant rupture de stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.predictions.map((p) => {
                      const style = URGENCY_STYLES[p.urgency]
                      const barWidth = Math.min(
                        (p.daysUntilStockout / maxDays) * 100,
                        100,
                      )
                      return (
                        <div key={p.id} className="flex items-center gap-3">
                          <span className="w-28 shrink-0 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                            {p.name}
                          </span>
                          <div className="h-5 flex-1 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`flex h-full items-center rounded-md ${style.bar} px-2 transition-all`}
                              style={{ width: `${Math.max(barWidth, 8)}%` }}
                            >
                              <span className="text-[10px] font-bold text-white">
                                {p.daysUntilStockout}j
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Orders */}
              {supplierOrders.length > 0 && (
                <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-white/80 backdrop-blur dark:border-amber-900/50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-slate-900/80">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
                        <Truck className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-sm text-slate-900 dark:text-white">
                          Commandes fournisseur suggerees
                        </CardTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Produits necessitant une commande urgente
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-amber-200/60 dark:border-amber-800/40">
                            <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                              Produit
                            </th>
                            <th className="pb-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                              Quantite
                            </th>
                            <th className="pb-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                              Cout estime
                            </th>
                            <th className="pb-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                              Priorite
                            </th>
                            <th className="pb-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100/60 dark:divide-amber-900/30">
                          {supplierOrders.map((p) => {
                            const order = p.supplierOrder!
                            const priorityStyle = URGENCY_STYLES[order.priority]
                            return (
                              <tr key={p.id}>
                                <td className="py-3 pr-3 font-medium text-slate-900 dark:text-white">
                                  {order.product}
                                </td>
                                <td className="py-3 text-center text-slate-700 dark:text-slate-300">
                                  {order.quantity} {p.unit}
                                </td>
                                <td className="py-3 text-center font-medium text-slate-900 dark:text-white">
                                  {order.estimatedCost.toFixed(2)} €
                                </td>
                                <td className="py-3 text-center">
                                  <Badge className={priorityStyle.badge}>
                                    {priorityStyle.label}
                                  </Badge>
                                </td>
                                <td className="py-3 text-center">
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                                  >
                                    Commander
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Algorithm Info */}
              <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <CardContent className="flex items-center gap-4 py-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Cpu className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Algorithme:{" "}
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {data.algorithm}
                      </span>
                    </span>
                    <span>
                      Genere le:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {new Date(data.generatedAt).toLocaleString("fr-FR")}
                      </span>
                    </span>
                    <span>
                      Produits analyses:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {data.summary.totalProducts}
                      </span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
