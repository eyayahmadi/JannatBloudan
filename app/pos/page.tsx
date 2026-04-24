"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  Shuffle,
  ReceiptText,
  CheckCircle2,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRealtimeOrders, type KitchenOrderInput } from "@/lib/hooks/useRealtimeOrders"
import { useNotifications } from "@/lib/hooks/useNotifications"

type MenuItem = {
  id: string
  name: string
  price: number
  category: string
  image?: string
}

type TicketLine = {
  item: MenuItem
  quantity: number
}

type DailySummary = {
  date: string
  cashTotal: number
  cardTotal: number
  orderCount: number
}

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

const TVA_RATE = 0.19
const DAILY_KEY = "jb-pos-daily"

function loadDaily(): DailySummary {
  if (typeof window === "undefined")
    return { date: "", cashTotal: 0, cardTotal: 0, orderCount: 0 }
  try {
    const raw = JSON.parse(localStorage.getItem(DAILY_KEY) ?? "{}")
    const today = new Date().toISOString().split("T")[0]
    if (raw.date === today) return raw as DailySummary
    return { date: today, cashTotal: 0, cardTotal: 0, orderCount: 0 }
  } catch {
    return { date: new Date().toISOString().split("T")[0], cashTotal: 0, cardTotal: 0, orderCount: 0 }
  }
}

function saveDaily(d: DailySummary) {
  if (typeof window !== "undefined") localStorage.setItem(DAILY_KEY, JSON.stringify(d))
}

export default function PosPage() {
  const { addOrder } = useRealtimeOrders()
  const { add: addNotification } = useNotifications()

  const [category, setCategory] = useState("Tout")
  const [search, setSearch] = useState("")
  const [ticket, setTicket] = useState<TicketLine[]>([])
  const [ticketNumber, setTicketNumber] = useState(() =>
    Math.floor(1000 + Math.random() * 9000),
  )
  const [daily, setDaily] = useState<DailySummary>(loadDaily)
  const [toast, setToast] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<"menu" | "ticket">("menu")

  useEffect(() => {
    saveDaily(daily)
  }, [daily])

  const filteredMenu = useMemo(() => {
    let items = MENU
    if (category !== "Tout") items = items.filter((m) => m.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((m) => m.name.toLowerCase().includes(q))
    }
    return items
  }, [category, search])

  const subtotal = ticket.reduce((s, l) => s + l.item.price * l.quantity, 0)
  const tva = subtotal * TVA_RATE
  const total = subtotal + tva

  const addToTicket = useCallback((item: MenuItem) => {
    setTicket((prev) => {
      const existing = prev.find((l) => l.item.id === item.id)
      if (existing) return prev.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l))
      return [...prev, { item, quantity: 1 }]
    })
  }, [])

  const updateQty = useCallback((itemId: string, delta: number) => {
    setTicket((prev) => {
      return prev
        .map((l) => (l.item.id === itemId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    })
  }, [])

  const removeLine = useCallback((itemId: string) => {
    setTicket((prev) => prev.filter((l) => l.item.id !== itemId))
  }, [])

  const clearTicket = useCallback(() => {
    setTicket([])
    setTicketNumber(Math.floor(1000 + Math.random() * 9000))
  }, [])

  const handlePayment = useCallback(
    (method: "cash" | "card" | "mixed") => {
      if (ticket.length === 0) return

      const order: KitchenOrderInput = {
        id: crypto.randomUUID(),
        order_number: String(ticketNumber),
        table_number: null,
        order_type: "pos",
        status: "received",
        items: ticket.map((l) => ({ name: l.item.name, quantity: l.quantity })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total: Math.round(total * 100) / 100,
      }
      addOrder(order)

      setDaily((prev) => {
        const updated = { ...prev, orderCount: prev.orderCount + 1 }
        if (method === "cash") updated.cashTotal = prev.cashTotal + total
        else if (method === "card") updated.cardTotal = prev.cardTotal + total
        else {
          const half = total / 2
          updated.cashTotal = prev.cashTotal + half
          updated.cardTotal = prev.cardTotal + half
        }
        updated.cashTotal = Math.round(updated.cashTotal * 100) / 100
        updated.cardTotal = Math.round(updated.cardTotal * 100) / 100
        return updated
      })

      clearTicket()
      setToast("Commande envoyee!")
      setTimeout(() => setToast(null), 2500)
      addNotification({ type: "payment_received", title: "Paiement recu", message: `Ticket ${ticketNumber} paye par ${method} — ${total.toFixed(2)}€` })
    },
    [ticket, ticketNumber, total, addOrder, clearTicket, addNotification],
  )

  const ticketCount = ticket.reduce((s, l) => s + l.quantity, 0)

  const menuPanel = (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Search */}
      <div className="border-b border-slate-200 p-3 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-3 py-2 dark:border-slate-800">
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

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addToTicket(item)}
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
    </div>
  )

  const ticketPanel = (
    <div className="flex flex-1 flex-col overflow-hidden border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Ticket header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Ticket #{ticketNumber}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={clearTicket} className="text-xs">
          Nouveau ticket
        </Button>
      </div>

      {/* Line items */}
      <div className="flex-1 overflow-y-auto p-3">
        {ticket.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-slate-400">
            <ShoppingCart className="mb-2 h-10 w-10 opacity-40" />
            <p className="text-sm">Ticket vide</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ticket.map((line) => (
              <div
                key={line.item.id}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
              >
                <div className="flex-1 min-w-0">
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
                    size="icon-sm"
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
                    size="icon-sm"
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
                  size="icon-sm"
                  onClick={() => removeLine(line.item.id)}
                  className="h-8 w-8 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Sous-total</span>
            <span>{subtotal.toFixed(2)} DT</span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>TVA (19%)</span>
            <span>{tva.toFixed(2)} DT</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-900 dark:border-slate-700 dark:text-white">
            <span>Total</span>
            <span>{total.toFixed(2)} DT</span>
          </div>
        </div>
      </div>

      {/* Payment buttons */}
      <div className="grid grid-cols-3 gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <Button
          onClick={() => handlePayment("cash")}
          disabled={ticket.length === 0}
          className="h-12 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Banknote className="h-4 w-4" />
          Especes
        </Button>
        <Button
          onClick={() => handlePayment("card")}
          disabled={ticket.length === 0}
          className="h-12 gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
        >
          <CreditCard className="h-4 w-4" />
          Carte
        </Button>
        <Button
          onClick={() => handlePayment("mixed")}
          disabled={ticket.length === 0}
          className="h-12 gap-1.5 bg-purple-600 text-white hover:bg-purple-700"
        >
          <Shuffle className="h-4 w-4" />
          Mixte
        </Button>
      </div>
    </div>
  )

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <SiteHeader
          backHref="/admin"
          backLabel="Admin"
          hideMainNav
          trailing={
            <Button asChild size="sm" variant="outline" className="gap-1">
              <a href="/pos/tables">
                <ReceiptText className="h-3.5 w-3.5" />
                Tables à encaisser
              </a>
            </Button>
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

        {/* Mobile tabs */}
        <div className="flex border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:hidden">
          <button
            type="button"
            onClick={() => setMobileView("menu")}
            className={cn(
              "flex-1 px-4 py-3 text-center text-sm font-medium transition",
              mobileView === "menu"
                ? "border-b-2 border-amber-600 text-amber-900 dark:text-amber-200"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            Menu
          </button>
          <button
            type="button"
            onClick={() => setMobileView("ticket")}
            className={cn(
              "relative flex-1 px-4 py-3 text-center text-sm font-medium transition",
              mobileView === "ticket"
                ? "border-b-2 border-amber-600 text-amber-900 dark:text-amber-200"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            Ticket
            {ticketCount > 0 && (
              <span className="absolute right-4 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1.5 text-[10px] font-bold text-white">
                {ticketCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop layout */}
        <div className="hidden flex-1 md:flex">
          <div className="flex w-2/3 flex-col bg-slate-50 dark:bg-slate-950">{menuPanel}</div>
          <div className="flex w-1/3 flex-col">{ticketPanel}</div>
        </div>

        {/* Mobile layout */}
        <div className="flex flex-1 flex-col md:hidden">
          {mobileView === "menu" ? menuPanel : ticketPanel}
        </div>

        {/* Bottom bar — daily summary */}
        <div className="border-t border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs">
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Aujourd&apos;hui
            </span>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="text-slate-600 dark:text-slate-300">
                <strong>{daily.orderCount}</strong> commande{daily.orderCount !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <Banknote className="h-3.5 w-3.5" />
                <strong>{daily.cashTotal.toFixed(2)}</strong> DT
              </span>
              <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
                <CreditCard className="h-3.5 w-3.5" />
                <strong>{daily.cardTotal.toFixed(2)}</strong> DT
              </span>
            </div>
          </div>
        </div>
        <AIAgentBadge context="pos" />
      </PageShell>
    </RequireAuth>
  )
}
