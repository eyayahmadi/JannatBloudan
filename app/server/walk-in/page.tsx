"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  UtensilsCrossed,
  Search,
  CheckCircle2,
  PackageOpen,
  Lock,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { StaffWorkspaceShell } from "@/components/workspace/StaffWorkspaceShell"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  useRealtimeOrders,
  type KitchenOrderInput,
} from "@/lib/hooks/useRealtimeOrders"
import { useNotifications } from "@/lib/hooks/useNotifications"
import {
  audienceForStationsFromItems,
} from "@/lib/notifications/audience"

type MenuItem = { id: string; name: string; price: number; category: string }
type CartLine = { item: MenuItem; quantity: number; note?: string }
type Channel = "takeaway" | "phone" | "manual"

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

const CHANNEL_LABEL: Record<Channel, string> = {
  takeaway: "À emporter",
  phone: "Téléphone",
  manual: "Manuelle",
}

export default function ServerWalkInPage() {
  const { addOrder } = useRealtimeOrders()
  const { add: addNotification } = useNotifications()

  const [channel, setChannel] = useState<Channel>("takeaway")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [generalNote, setGeneralNote] = useState("")
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
      if (existing)
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      return [...prev, { item, quantity: 1 }]
    })
  }, [])

  const updateQty = useCallback((itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.item.id === itemId ? { ...l, quantity: l.quantity + delta } : l,
        )
        .filter((l) => l.quantity > 0),
    )
  }, [])

  const removeLine = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((l) => l.item.id !== itemId))
  }, [])

  const setLineNote = useCallback((itemId: string, note: string) => {
    setCart((prev) =>
      prev.map((l) => (l.item.id === itemId ? { ...l, note } : l)),
    )
  }, [])

  const submitOrder = useCallback(() => {
    if (cart.length === 0) return
    const cleanName = customerName.trim()
    if (!cleanName) {
      setToast("Indiquez le nom du client (suivi de la commande)")
      setTimeout(() => setToast(null), 3000)
      return
    }

    const orderNumber = String(1000 + Math.floor(Math.random() * 9000))
    const phone = customerPhone.trim()
    const customerLabel = `${CHANNEL_LABEL[channel]} · ${cleanName}${phone ? ` · ${phone}` : ""}`
    const annotatedItems = cart.map((l) => {
      const baseNote = l.note?.trim()
      const generalLabel = generalNote.trim() ? `[${generalNote.trim()}]` : ""
      const finalNote = [baseNote, generalLabel].filter(Boolean).join(" — ") || undefined
      return {
        name: l.item.name,
        quantity: l.quantity,
        notes: finalNote,
      }
    })

    const order: KitchenOrderInput = {
      id: crypto.randomUUID(),
      order_number: orderNumber,
      table_number: null,
      order_type: "pos",
      status: "received",
      items: annotatedItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_name: customerLabel,
      total: Math.round(total * 100) / 100,
    }

    addOrder(order)
    setCart([])
    setGeneralNote("")
    setToast(`Commande #${orderNumber} envoyée en cuisine !`)
    setTimeout(() => setToast(null), 3000)
    // Audience : stations effectivement présentes dans la commande + caisse
    // (encaissement à venir) + admin. Pas de bruit pour les stations vides.
    const stationAudience = audienceForStationsFromItems(annotatedItems)
    addNotification({
      type: "new_order",
      title: "Nouvelle commande sans table",
      message: `Commande ${orderNumber} — ${CHANNEL_LABEL[channel]} — ${cleanName}`,
      audience: [...new Set([...stationAudience, "CASHIER" as const])],
    })
  }, [cart, channel, customerName, customerPhone, generalNote, total, addOrder, addNotification])

  return (
    <RequireAuth roles={["ADMIN", "SERVER", "CASHIER"]}>
      <StaffWorkspaceShell
        title="Commande sans table"
        subtitle="À emporter, téléphone, manuelle — sans encaissement"
      >
        <PageShell className="min-h-screen bg-slate-100 dark:bg-slate-950">
          <SiteHeader
            backHref="/server/tables"
            backLabel="Tables"
            hideMainNav
            trailing={
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {CHANNEL_LABEL[channel]}
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

          <div className="site-container flex-1 py-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PackageOpen className="h-5 w-5 text-amber-600" />
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Commande sans table
                </h1>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                <Lock className="h-3 w-3" /> aucun encaissement ici — la caisse encaisse plus tard
              </div>
            </div>

            <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-slate-500">
                  Type
                </Label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                  className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                >
                  <option value="takeaway">À emporter</option>
                  <option value="phone">Téléphone</option>
                  <option value="manual">Manuelle (au comptoir)</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="walk-name" className="text-[11px] uppercase tracking-wide text-slate-500">
                  Nom client *
                </Label>
                <Input
                  id="walk-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex. Karim B."
                  className="h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="walk-phone" className="text-[11px] uppercase tracking-wide text-slate-500">
                  Téléphone (optionnel)
                </Label>
                <Input
                  id="walk-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+216 …"
                  className="h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="walk-note" className="text-[11px] uppercase tracking-wide text-slate-500">
                  Note générale
                </Label>
                <Input
                  id="walk-note"
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  placeholder="Ex. à venir chercher dans 20 min"
                  className="h-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row">
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
                      Aucun produit trouvé
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:w-96">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Panier — {CHANNEL_LABEL[channel]}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCart([])}
                    className="text-xs"
                  >
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
                          className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
                        >
                          <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                {line.item.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {line.item.price.toFixed(2)} DT
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQty(line.item.id, -1)}
                                className="h-8 w-8"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">
                                {line.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQty(line.item.id, 1)}
                                className="h-8 w-8"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="w-16 text-right text-sm font-semibold text-slate-900 dark:text-white">
                              {(line.item.price * line.quantity).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLine(line.item.id)}
                              className="h-8 w-8 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Input
                            value={line.note ?? ""}
                            onChange={(e) =>
                              setLineNote(line.item.id, e.target.value)
                            }
                            placeholder="Note / allergie (ex. sans oignon)"
                            className="mt-2 h-7 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="mb-3 flex items-center justify-between text-lg font-bold text-slate-900 dark:text-white">
                    <span>Total indicatif</span>
                    <span>{total.toFixed(2)} DT</span>
                  </div>
                  <p className="mb-3 text-[11px] text-slate-500">
                    Le ticket est remis à la caisse pour encaissement.
                  </p>
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
      </StaffWorkspaceShell>
    </RequireAuth>
  )
}
