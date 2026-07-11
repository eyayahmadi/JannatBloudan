"use client"

import { useEffect, useState, useCallback } from "react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OrderProductName } from "@/components/orders/OrderProductName"
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
import { CashRegisterMovementForm } from "@/components/caisse/CashRegisterMovementForm"
import { useRealtimeOrders, type KitchenOrderInput } from "@/lib/hooks/useRealtimeOrders"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { cashierAudience } from "@/lib/notifications/audience"
import { useMenuCatalog } from "@/lib/hooks/useMenuCatalog"
import { StaffMenuPicker } from "@/components/menu/StaffMenuPicker"
import {
  mergeStaffCartLine,
  staffCartLineFromAdd,
  staffCartToOrderItems,
  staffCartTotal,
  type StaffCartLine,
  type StaffMenuAddPayload,
} from "@/lib/menu/staff-cart"
import { formatVariantLabel } from "@/lib/menu/cart-line"

type TicketLine = StaffCartLine

type DailySummary = {
  date: string
  cashTotal: number
  cardTotal: number
  orderCount: number
}

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
  const { catalog, data: menuData, loading: menuLoading } = useMenuCatalog({ pollMs: 15_000 })

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

  const subtotal = staffCartTotal(ticket)
  const tva = subtotal * TVA_RATE
  const total = subtotal + tva

  const addToTicket = useCallback((payload: StaffMenuAddPayload) => {
    setTicket((prev) => mergeStaffCartLine(prev, staffCartLineFromAdd(payload)))
  }, [])

  const updateQty = useCallback((lineId: string, delta: number) => {
    setTicket((prev) => {
      return prev
        .map((l) => (l.lineId === lineId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    })
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setTicket((prev) => prev.filter((l) => l.lineId !== lineId))
  }, [])

  const clearTicket = useCallback(() => {
    setTicket([])
    setTicketNumber(Math.floor(1000 + Math.random() * 9000))
  }, [])

  const handlePayment = useCallback(
    async (method: "cash" | "card" | "mixed") => {
      if (ticket.length === 0) return

      const customerLabel = `POS · Ticket #${ticketNumber}`
      const payloadItems = staffCartToOrderItems(ticket)

      try {
        const res = await fetch("/api/orders/walk-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: String(ticketNumber),
            customerName: customerLabel,
            channel: "POS",
            items: payloadItems,
            total: Math.round(total * 100) / 100,
          }),
        })
        const json = await res.json()
        if (!res.ok) {
          setToast(json.error ?? "Échec envoi commande")
          setTimeout(() => setToast(null), 4000)
          return
        }

        const o = json.order
        const order: KitchenOrderInput = {
          id: o.id,
          order_number: o.order_number,
          table_number: null,
          order_type: "pos",
          status: "received",
          items: (o.items ?? []).map(
            (it: {
              id: string
              name: string
              name_ar?: string | null
              quantity: number
              unit_price?: number
              station?: string
              item_status?: string
            }) => ({
              id: it.id,
              name: it.name,
              name_ar: it.name_ar ?? null,
              quantity: it.quantity,
              unit_price: it.unit_price,
              station: it.station,
              item_status: it.item_status ?? "new",
            }),
          ),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total: Number(o.total ?? total),
        }
        addOrder(order)
      } catch {
        setToast("Erreur réseau — commande non enregistrée")
        setTimeout(() => setToast(null), 4000)
        return
      }

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
      addNotification({
        type: "payment_received",
        title: "Paiement recu",
        message: `Ticket ${ticketNumber} paye par ${method} — ${total.toFixed(2)}€`,
        audience: cashierAudience(),
      })
    },
    [ticket, ticketNumber, total, addOrder, clearTicket, addNotification],
  )

  const ticketCount = ticket.reduce((s, l) => s + l.quantity, 0)

  const menuPanel = (
    <div className="flex flex-1 flex-col overflow-hidden p-3">
      <StaffMenuPicker
        catalog={catalog}
        categories={menuData?.categories ?? []}
        stationAvailability={menuData?.station_availability ?? []}
        loading={menuLoading}
        onAdd={addToTicket}
        className="h-full"
      />
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
                key={line.lineId}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
              >
                <div className="flex-1 min-w-0">
                  <OrderProductName
                    name={line.product.name}
                    name_ar={line.product.name_ar}
                    size="sm"
                    truncate
                  />
                  {line.variant ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatVariantLabel(line.variant)}
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {line.unitPrice.toFixed(2)} DT
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => updateQty(line.lineId, -1)}
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
                    onClick={() => updateQty(line.lineId, 1)}
                    className="h-8 w-8"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="w-16 text-right text-sm font-semibold text-slate-900 dark:text-white">
                  {(line.unitPrice * line.quantity).toFixed(2)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeLine(line.lineId)}
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
    <RequireAuth roles={["ADMIN", "CASHIER"]}>
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

        <div className="border-t border-slate-200 bg-slate-50/95 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mx-auto max-w-7xl">
            <CashRegisterMovementForm />
          </div>
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
