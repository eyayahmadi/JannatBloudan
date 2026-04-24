"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Minus, ShoppingCart, X, ChevronRight, UtensilsCrossed, ArrowLeft } from "lucide-react"
import { PageShell } from "@/components/site/PageShell"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders"

const categories = [
  { id: "all", label: "Tout", icon: "🍽️" },
  { id: "shawarma", label: "Shawarma", icon: "🌯" },
  { id: "pizza", label: "Pizzas", icon: "🍕" },
  { id: "burger", label: "Burgers", icon: "🍔" },
  { id: "hot-dishes", label: "Plats", icon: "🍲" },
  { id: "mezze", label: "Mezzés", icon: "🥗" },
  { id: "dessert", label: "Desserts", icon: "🍰" },
  { id: "drink", label: "Boissons", icon: "🥤" },
]

type CartEntry = { id: number; name: string; price: number; quantity: number }

export default function TableMenuPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const router = useRouter()
  const { addOrder } = useRealtimeOrders()

  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")
  const [cart, setCart] = useState<CartEntry[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const products = (data.products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: typeof p.price === "number" ? p.price : parseFloat(p.price) || 0,
          image: p.image_url || "/placeholder.svg",
          category: p.categories?.slug || p.categories?.name?.toLowerCase() || "other",
          isAvailable: p.is_available !== false,
        }))
        setMenuItems(products.filter((p: any) => p.isAvailable))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => (activeCategory === "all" ? menuItems : menuItems.filter((i: any) => i.category === activeCategory)),
    [activeCategory, menuItems],
  )

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const increment = (id: number) =>
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, quantity: c.quantity + 1 } : c)))

  const decrement = (id: number) =>
    setCart((prev) => {
      const item = prev.find((c) => c.id === id)
      if (item && item.quantity > 1) return prev.map((c) => (c.id === id ? { ...c, quantity: c.quantity - 1 } : c))
      return prev.filter((c) => c.id !== id)
    })

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0)

  const submitOrder = () => {
    if (cart.length === 0) return
    const localId = "ORD-" + Date.now()
    const orderNumber = `T${tableId}-${String(Math.floor(1000 + Math.random() * 9000))}`
    const items = cart.map((c) => ({
      name: c.name,
      quantity: c.quantity,
      unitPrice: c.price,
    }))

    // Optimistic UI local (immediat, meme offline)
    addOrder({
      id: localId,
      order_number: orderNumber,
      table_number: Number(tableId),
      order_type: "qr_self_service",
      status: "received",
      items: items.map((i) => ({ name: i.name, quantity: i.quantity })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_name: `Client Table ${tableId}`,
      total: cartTotal,
    })

    // Persistance Supabase (fire-and-forget, fallback serveur gere)
    void fetch("/api/orders/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: localId,
        orderNumber,
        tableId: Number(tableId),
        items,
        total: cartTotal,
      }),
    }).catch(() => {})

    router.push(`/table/${tableId}/order?oid=${localId}`)
  }

  return (
    <PageShell className="dark:bg-neutral-950">
      <header className="sticky top-0 z-50 border-b border-amber-200/40 bg-white/80 shadow-sm backdrop-blur-xl dark:border-amber-900/30 dark:bg-neutral-900/80">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link
            href={`/table/${tableId}`}
            className="flex items-center gap-2 text-amber-900 dark:text-amber-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <div className="leading-tight">
              <p className="text-xs font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Table {tableId}
              </p>
              <p className="text-sm font-semibold">Menu</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-950 shadow-sm transition hover:shadow-md dark:border-amber-800 dark:bg-neutral-800 dark:text-white"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="sticky top-14 z-40 border-b border-amber-200/30 bg-white/70 backdrop-blur-md dark:border-amber-900/20 dark:bg-neutral-900/70">
        <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-3">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "shrink-0 gap-1.5 rounded-full px-4 py-2 text-sm font-medium",
                activeCategory !== cat.id &&
                  "border-amber-900/10 bg-white/90 text-amber-950 hover:border-amber-400 dark:border-amber-800 dark:bg-neutral-800 dark:text-amber-100",
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-2xl flex-1 px-4 py-6">
        {loading ? (
          <p className="text-center text-amber-800/70">Chargement...</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-amber-800/70 dark:text-amber-300/70">
              <span className="font-semibold text-amber-950 dark:text-white">{filtered.length}</span> plat
              {filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filtered.map((item) => {
                const inCart = cart.find((c) => c.id === item.id)
                return (
                  <div
                    key={item.id}
                    className="group overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:shadow-lg dark:border-amber-900/30 dark:bg-neutral-900"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-amber-50 dark:bg-neutral-800">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-amber-950 dark:text-white">{item.name}</h3>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-base font-bold text-amber-700 dark:text-amber-400">
                          {item.price.toFixed(2)}€
                        </span>
                        {inCart ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => decrement(item.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-800 transition hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-amber-950 dark:text-white">
                              {inCart.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => increment(item.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white shadow transition hover:bg-amber-700"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md transition hover:shadow-lg"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>

      {cartCount > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-4 text-white shadow-2xl shadow-amber-600/30 transition hover:shadow-amber-600/50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/20 px-1.5 text-sm font-bold">
                {cartCount}
              </span>
              <span className="font-semibold">Voir le panier</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">{cartTotal.toFixed(2)}€</span>
              <ChevronRight className="h-5 w-5" />
            </div>
          </button>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative mt-auto flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-amber-100 px-5 py-4 dark:border-amber-900/30">
              <h2 className="text-lg font-bold text-amber-950 dark:text-white">
                Votre commande — Table {tableId}
              </h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-full p-1.5 text-amber-800 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <ShoppingCart className="h-12 w-12 text-amber-300 dark:text-amber-700" />
                <p className="text-amber-800 dark:text-amber-400">Ajoutez des plats pour commencer</p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 dark:bg-neutral-800"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-amber-950 dark:text-white">{item.name}</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">{item.price.toFixed(2)}€</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decrement(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 text-amber-700 transition hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-amber-950 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => increment(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white transition hover:bg-amber-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="ml-4 w-16 text-right text-sm font-bold text-amber-950 dark:text-white">
                        {(item.price * item.quantity).toFixed(2)}€
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-amber-100 px-5 py-4 dark:border-amber-900/30">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-semibold text-amber-800 dark:text-amber-300">Total</span>
                    <span className="text-xl font-bold text-amber-950 dark:text-white">{cartTotal.toFixed(2)}€</span>
                  </div>
                  <button
                    type="button"
                    onClick={submitOrder}
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 py-4 text-center text-lg font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
                  >
                    Commander — {cartTotal.toFixed(2)}€
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}
