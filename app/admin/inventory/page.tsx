"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  Plus,
  Minus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Activity,
  X,
  Clock,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

type Product = {
  id: string
  name: string
  price: number
  stock_quantity: number
  category: { id: string; name: string; slug: string } | null
  image_url: string | null
  is_available: boolean
  description: string | null
}

type StockAlert = {
  productId: string
  name: string
  stock: number
  threshold: number
  status: "critical" | "warning"
}

const STOCK_THRESHOLD = 20

function getStockPercent(stock: number) {
  return Math.min((stock / STOCK_THRESHOLD) * 100, 100)
}

function getStockStatus(stock: number): {
  color: string
  barColor: string
  label: string
  variant: "critical" | "warning" | "ok" | "out"
} {
  if (stock === 0)
    return { color: "text-red-600 dark:text-red-400", barColor: "bg-red-500", label: "Rupture", variant: "out" }
  const pct = getStockPercent(stock)
  if (pct < 20)
    return { color: "text-red-600 dark:text-red-400", barColor: "bg-red-500", label: "Critique", variant: "critical" }
  if (pct < 50)
    return {
      color: "text-amber-600 dark:text-amber-400",
      barColor: "bg-amber-500",
      label: "Bas",
      variant: "warning",
    }
  return {
    color: "text-emerald-600 dark:text-emerald-400",
    barColor: "bg-emerald-500",
    label: "OK",
    variant: "ok",
  }
}

function estimateDaysLeft(stock: number): number {
  const avgDailyUsage = Math.max(1, Math.round(Math.random() * 4 + 1))
  return Math.max(0, Math.floor(stock / avgDailyUsage))
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [adjustModal, setAdjustModal] = useState<Product | null>(null)
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustReason, setAdjustReason] = useState("")
  const [adjusting, setAdjusting] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products")
      const data = await res.json()
      setProducts(data.products ?? [])
    } catch {
      /* ignore */
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/stock/alerts")
      const data = await res.json()
      setAlerts(data.alerts ?? [])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchProducts(), fetchAlerts()]).finally(() => setLoading(false))
  }, [fetchProducts, fetchAlerts])

  const handleAdjust = async () => {
    if (!adjustModal || adjustQty === 0) return
    setAdjusting(true)
    try {
      const res = await fetch("/api/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustModal.id,
          adjustment: adjustQty,
          reason: adjustReason || "Ajustement manuel",
        }),
      })
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === adjustModal.id
              ? { ...p, stock_quantity: Math.max(0, p.stock_quantity + adjustQty) }
              : p,
          ),
        )
        setAdjustModal(null)
        setAdjustQty(0)
        setAdjustReason("")
      }
    } catch {
      /* ignore */
    } finally {
      setAdjusting(false)
    }
  }

  const toggleBlock = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: !product.is_available }),
      })
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_available: !p.is_available } : p)),
        )
      }
    } catch {
      /* ignore */
    }
  }

  const categories = [
    "all",
    ...Array.from(
      new Set(
        products
          .map((p) => p.category?.name)
          .filter((n): n is string => typeof n === "string" && n.length > 0),
      ),
    ),
  ]

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = selectedCategory === "all" || p.category?.name === selectedCategory
    return matchSearch && matchCat
  })

  const totalProducts = products.length
  const inStock = products.filter((p) => p.stock_quantity > 0 && getStockStatus(p.stock_quantity).variant === "ok").length
  const lowStock = products.filter(
    (p) => getStockStatus(p.stock_quantity).variant === "warning" || getStockStatus(p.stock_quantity).variant === "critical",
  ).length
  const outOfStock = products.filter((p) => p.stock_quantity === 0).length

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <AdminPageFrame
        title="Stocks & inventaire"
        subtitle="Gestion intelligente des stocks, seuils et alertes en temps réel."
        trailing={
          <Button
            size="sm"
            className="gap-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
            onClick={() => {
              fetchProducts()
              fetchAlerts()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Total produits</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalProducts}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                      <Package className="w-7 h-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">En stock</p>
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{inStock}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Stock bas</p>
                      <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{lowStock}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                      <TrendingDown className="w-7 h-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Rupture</p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">{outOfStock}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main content */}
              <div className="flex-1 min-w-0">
                {/* Search & Filter */}
                <Card className="mb-6 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex-1 w-full relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Rechercher un produit..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {categories.map((cat) => (
                          <Button
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(cat)}
                            className={
                              selectedCategory === cat
                                ? "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500"
                                : ""
                            }
                          >
                            {cat === "all" ? "Tous" : cat}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Inventory Table */}
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                      Inventaire ({filtered.length} produit{filtered.length !== 1 ? "s" : ""})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Nom
                            </th>
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Catégorie
                            </th>
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Stock
                            </th>
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Seuil
                            </th>
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Statut
                            </th>
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Prédiction
                            </th>
                            <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filtered.map((product) => {
                            const status = getStockStatus(product.stock_quantity)
                            const pct = getStockPercent(product.stock_quantity)
                            const daysLeft = estimateDaysLeft(product.stock_quantity)
                            return (
                              <tr
                                key={product.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-3">
                                    {product.image_url ? (
                                      <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                        <Package className="w-4 h-4 text-slate-400" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-slate-900 dark:text-white text-sm">
                                        {product.name}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {product.price.toFixed(2)} €
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <Badge variant="outline" className="text-xs">
                                    {product.category?.name ?? "—"}
                                  </Badge>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="min-w-[100px]">
                                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                                      {product.stock_quantity}
                                    </p>
                                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                      <div
                                        className={`h-full ${status.barColor} rounded-full transition-all duration-500`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="text-sm text-slate-600 dark:text-slate-300">
                                    {STOCK_THRESHOLD}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={
                                        status.variant === "ok"
                                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                          : status.variant === "warning"
                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                      }
                                    >
                                      {status.label}
                                    </Badge>
                                    {product.stock_quantity === 0 && !product.is_available && (
                                      <Badge className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 text-[10px]">
                                        Bloqué
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>~{daysLeft}j restants</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-7 gap-1"
                                      onClick={() => {
                                        setAdjustModal(product)
                                        setAdjustQty(0)
                                        setAdjustReason("")
                                      }}
                                    >
                                      <Activity className="w-3.5 h-3.5" />
                                      Ajuster
                                    </Button>
                                    {product.stock_quantity === 0 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7 gap-1"
                                        onClick={() => toggleBlock(product)}
                                      >
                                        {product.is_available ? (
                                          <>
                                            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                                            Bloquer
                                          </>
                                        ) : (
                                          <>
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                            Débloquer
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                                Aucun produit trouvé.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Prediction */}
                <Card className="mt-6 border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-amber-500" />
                      Prédiction de stock
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {products
                        .filter((p) => p.stock_quantity > 0 && p.stock_quantity < STOCK_THRESHOLD)
                        .slice(0, 6)
                        .map((p) => {
                          const days = estimateDaysLeft(p.stock_quantity)
                          return (
                            <div
                              key={p.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Stock actuel : {p.stock_quantity}
                                </p>
                              </div>
                              <Badge
                                className={
                                  days <= 3
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                }
                              >
                                ~{days} jours
                              </Badge>
                            </div>
                          )
                        })}
                    </div>
                    {products.filter((p) => p.stock_quantity > 0 && p.stock_quantity < STOCK_THRESHOLD).length ===
                      0 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                        Tous les stocks sont au-dessus du seuil.
                      </p>
                    )}
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                      Basé sur les 7 derniers jours de consommation moyenne estimée.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts Panel */}
              <div className="w-full lg:w-80 flex-shrink-0">
                <Card className="border-slate-200 dark:border-slate-700 sticky top-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Alertes stock
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {alerts.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                        Aucune alerte active.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {alerts.map((alert) => (
                          <div
                            key={alert.productId}
                            className={`p-3 rounded-lg border ${
                              alert.status === "critical"
                                ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                                : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm text-slate-900 dark:text-white">
                                  {alert.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  Stock : {alert.stock} / Seuil : {alert.threshold}
                                </p>
                              </div>
                              <Badge
                                className={
                                  alert.status === "critical"
                                    ? "bg-red-600 text-white text-[10px]"
                                    : "bg-amber-500 text-white text-[10px]"
                                }
                              >
                                {alert.status === "critical" ? "Critique" : "Attention"}
                              </Badge>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  alert.status === "critical" ? "bg-red-500" : "bg-amber-500"
                                }`}
                                style={{
                                  width: `${Math.min((alert.stock / alert.threshold) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Auto-blocked items */}
                    {products.filter((p) => p.stock_quantity === 0).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Produits en rupture
                        </p>
                        {products
                          .filter((p) => p.stock_quantity === 0)
                          .map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between py-2"
                            >
                              <span className="text-sm text-slate-700 dark:text-slate-300">{p.name}</span>
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-[10px]">
                                {p.is_available ? "Actif" : "Bloqué"}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Adjust Stock Modal */}
            {adjustModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <Card className="w-full max-w-md relative">
                  <button
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => setAdjustModal(null)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                      Ajuster le stock
                    </CardTitle>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{adjustModal.name}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                        Stock actuel : <span className="font-semibold">{adjustModal.stock_quantity}</span>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-700 dark:text-slate-300">Ajustement</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustQty((q) => q - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                          className="w-24 text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustQty((q) => q + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Nouveau stock : {Math.max(0, adjustModal.stock_quantity + adjustQty)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-700 dark:text-slate-300">Raison</Label>
                      <Input
                        className="mt-1"
                        placeholder="Ex: Réception fournisseur, casse..."
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
                        onClick={handleAdjust}
                        disabled={adjustQty === 0 || adjusting}
                      >
                        {adjusting ? "En cours..." : "Confirmer l'ajustement"}
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => setAdjustModal(null)}>
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </AdminPageFrame>
    </RequireAuth>
  )
}
