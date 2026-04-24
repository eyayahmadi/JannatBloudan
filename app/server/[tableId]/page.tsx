"use client"

import { useState, useMemo, useCallback } from "react"
import { useParams } from "next/navigation"
import { Plus, Minus, Trash2, ShoppingCart, UtensilsCrossed, Search, CheckCircle2, HandPlatter, Receipt, BellRing } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { OrderTypeSelector } from "@/components/site/OrderTypeSelector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  useRealtimeOrders,
  type KitchenOrderInput,
  type OrderStatus,
} from "@/lib/hooks/useRealtimeOrders"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { useTableAlerts } from "@/lib/hooks/useTableAlerts"

type MenuItem = { id: string; name: string; price: number; category: string }
type CartLine = { item: MenuItem; quantity: number }

const CATEGORIES = [
  "Tout",
  "Shawarma",
  "Manakish",
  "Plats chauds",
  "Mezzes",
  "Pizzas",
  "Burgers",
  "Desserts",
  "Boissons",
]

const MENU: MenuItem[] = [
  { id: "sw1", name: "Shawarma Poulet", price: 12.0, category: "Shawarma" },
  { id: "sw2", name: "Shawarma Viande", price: 14.0, category: "Shawarma" },
  { id: "sw3", name: "Shawarma Mixte", price: 15.0, category: "Shawarma" },
  { id: "mn1", name: "Manakish Zaatar", price: 6.0, category: "Manakish" },
  { id: "mn2", name: "Manakish Fromage", price: 8.0, category: "Manakish" },
  { id: "pc1", name: "Poulet Grille", price: 18.0, category: "Plats chauds" },
  { id: "pc2", name: "Kafta Grille", price: 16.0, category: "Plats chauds" },
  { id: "mz1", name: "Houmous", price: 7.0, category: "Mezzes" },
  { id: "mz2", name: "Fattouch", price: 8.0, category: "Mezzes" },
  { id: "mz3", name: "Tabboule", price: 7.5, category: "Mezzes" },
  { id: "pz1", name: "Pizza Margherita", price: 14.0, category: "Pizzas" },
  { id: "pz2", name: "Pizza Viande", price: 16.0, category: "Pizzas" },
  { id: "bg1", name: "Burger Classic", price: 13.0, category: "Burgers" },
  { id: "bg2", name: "Burger Cheese", price: 15.0, category: "Burgers" },
  { id: "bg3", name: "Burger Double", price: 18.0, category: "Burgers" },
  { id: "ds1", name: "Baklawa", price: 6.0, category: "Desserts" },
  { id: "ds2", name: "Knefe", price: 8.0, category: "Desserts" },
  { id: "ds3", name: "Mhallabieh", price: 5.0, category: "Desserts" },
  { id: "bv1", name: "Jus d'Orange", price: 4.0, category: "Boissons" },
  { id: "bv2", name: "Ayran", price: 3.0, category: "Boissons" },
  { id: "bv3", name: "Cafe Turc", price: 3.5, category: "Boissons" },
]

const STATUS_LABEL_FR: Record<OrderStatus, string> = {
  received: "Reçue",
  preparing: "En préparation",
  ready: "Prête",
  delivering: "Service en cours",
  completed: "Terminée",
  cancelled: "Annulée",
}

export default function ServerTableOrderPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const { addOrder, updateStatus, orders } = useRealtimeOrders()
  const { add: addNotification } = useNotifications()
  const { activeByTable, resolveTable } = useTableAlerts()

  const tableAlerts = activeByTable(String(tableId))
  const tableOrders = orders.filter(
    (o) => String(o.table_number) === String(tableId) && o.status !== "cancelled",
  )

  const [orderMode, setOrderMode] = useState<"qr_self_service" | "server" | "pos">("server")
  const [category, setCategory] = useState("Tout")
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const filteredMenu = useMemo(() => {
    let items = MENU
    if (category !== "Tout") items = items.filter((m) => m.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((m) => m.name.toLowerCase().includes(q))
    }
    return items
  }, [category, search])

  const total = cart.reduce((s, l) => s + l.item.price * l.quantity, 0)
  const cartCount = cart.reduce((s, l) => s + l.quantity, 0)

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id)
      if (existing) return prev.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l))
      return [...prev, { item, quantity: 1 }]
    })
  }, [])

  const updateQty = useCallback((itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.item.id === itemId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    )
  }, [])

  const removeLine = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((l) => l.item.id !== itemId))
  }, [])

  const submitOrder = useCallback(() => {
    if (cart.length === 0) return

    const orderNumber = String(1000 + Math.floor(Math.random() * 9000))
    const order: KitchenOrderInput = {
      id: crypto.randomUUID(),
      order_number: orderNumber,
      table_number: Number(tableId),
      order_type: "server",
      status: "received",
      items: cart.map((l) => ({ name: l.item.name, quantity: l.quantity })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_name: "Serveur",
      total: Math.round(total * 100) / 100,
    }

    addOrder(order)
    setCart([])
    setToast(`Commande #${orderNumber} envoyee!`)
    setTimeout(() => setToast(null), 3000)
    addNotification({ type: "new_order", title: "Nouvelle commande", message: `Commande ${orderNumber} — Table ${tableId} envoyee en cuisine` })
  }, [cart, tableId, total, addOrder, addNotification])

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <SiteHeader
          backHref="/server"
          backLabel="Tables"
          hideMainNav
          trailing={
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                Table {tableId}
              </Badge>
              {cartCount > 0 && (
                <Badge className="bg-amber-600 text-white">
                  <ShoppingCart className="mr-1 h-3 w-3" />
                  {cartCount}
                </Badge>
              )}
            </div>
          }
        />

        {toast && (
          <div className="fixed right-4 top-20 z-[100] animate-in slide-in-from-right fade-in rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 shadow-lg dark:border-emerald-700 dark:bg-emerald-950">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              {toast}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-7xl flex-1 px-4 py-4">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Table {tableId} — Prise de commande
            </h1>
            <OrderTypeSelector value={orderMode} onChange={setOrderMode} />
          </div>

          {(tableAlerts.length > 0 || tableOrders.length > 0) && (
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              {tableAlerts.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-950/30">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-900 dark:text-red-200">
                    <BellRing className="h-4 w-4 animate-pulse" />
                    Alertes client
                  </div>
                  <ul className="space-y-1.5">
                    {tableAlerts.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-red-900 dark:bg-red-900/30 dark:text-red-100"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {a.type === "call_server" ? (
                            <HandPlatter className="h-3.5 w-3.5" />
                          ) : (
                            <Receipt className="h-3.5 w-3.5" />
                          )}
                          {a.type === "call_server" ? "Appel serveur" : a.type === "request_bill" ? "Addition" : a.type}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveTable(String(tableId), a.type)}
                          className="h-7 px-2 text-xs"
                        >
                          Traité
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tableOrders.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                    <UtensilsCrossed className="h-4 w-4" />
                    Commandes en cours
                  </div>
                  <ul className="space-y-1.5">
                    {tableOrders.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
                      >
                        <div>
                          <span className="font-semibold">#{o.order_number}</span>{" "}
                          <span className="text-amber-700 dark:text-amber-300">— {STATUS_LABEL_FR[o.status]}</span>
                        </div>
                        <div className="flex gap-1">
                          {o.status === "ready" && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(o.id, "delivering")}
                              className="h-7 px-2 text-xs"
                            >
                              Apportée
                            </Button>
                          )}
                          {o.status === "delivering" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(o.id, "completed")}
                              className="h-7 px-2 text-xs"
                            >
                              Servie
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Menu panel */}
            <div className="flex-1">
              <div className="mb-3 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                      category === cat
                        ? "bg-amber-600 text-white shadow-md"
                        : "bg-white text-slate-600 hover:bg-amber-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filteredMenu.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition",
                      "hover:border-amber-300 hover:shadow-md active:scale-[0.97]",
                      "dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-amber-600",
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                      <UtensilsCrossed className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                    </div>
                    <span className="text-center text-sm font-medium text-slate-800 dark:text-slate-200">
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {item.price.toFixed(2)} DT
                    </span>
                  </button>
                ))}
                {filteredMenu.length === 0 && (
                  <div className="col-span-full py-12 text-center text-sm text-slate-400">
                    Aucun produit trouve
                  </div>
                )}
              </div>
            </div>

            {/* Cart panel */}
            <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:w-96">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Commande — Table {tableId}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-xs">
                  Vider
                </Button>
              </div>

              <div className="max-h-[400px] overflow-y-auto p-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <ShoppingCart className="mb-2 h-10 w-10 opacity-40" />
                    <p className="text-sm">Ajoutez des plats</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((line) => (
                      <div
                        key={line.item.id}
                        className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                            {line.item.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {line.item.price.toFixed(2)} DT
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" onClick={() => updateQty(line.item.id, -1)} className="h-8 w-8">
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">
                            {line.quantity}
                          </span>
                          <Button variant="outline" size="icon" onClick={() => updateQty(line.item.id, 1)} className="h-8 w-8">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="w-16 text-right text-sm font-semibold text-slate-900 dark:text-white">
                          {(line.item.price * line.quantity).toFixed(2)}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => removeLine(line.item.id)} className="h-8 w-8 text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="mb-3 flex items-center justify-between text-lg font-bold text-slate-900 dark:text-white">
                  <span>Total</span>
                  <span>{total.toFixed(2)} DT</span>
                </div>
                <Button
                  onClick={submitOrder}
                  disabled={cart.length === 0}
                  className="w-full gap-2 bg-amber-600 text-white hover:bg-amber-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Envoyer en cuisine
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    </RequireAuth>
  )
}
