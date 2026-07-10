"use client"

import { useState, useCallback } from "react"
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
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

type CartLine = StaffCartLine
type Channel = "takeaway" | "phone" | "manual"

const CHANNEL_LABEL: Record<Channel, string> = {
  takeaway: "À emporter",
  phone: "Téléphone",
  manual: "Manuelle",
}

export default function ServerWalkInPage() {
  const { addOrder } = useRealtimeOrders()
  const { add: addNotification } = useNotifications()
  const { catalog, data: menuData, loading: menuLoading } = useMenuCatalog({ pollMs: 15_000 })

  const [channel, setChannel] = useState<Channel>("takeaway")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [generalNote, setGeneralNote] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const total = staffCartTotal(cart)
  const cartCount = cart.reduce((s, l) => s + l.quantity, 0)

  const addToCart = useCallback((payload: StaffMenuAddPayload) => {
    setCart((prev) => mergeStaffCartLine(prev, staffCartLineFromAdd(payload)))
  }, [])

  const updateQty = useCallback((lineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.lineId === lineId ? { ...l, quantity: l.quantity + delta } : l,
        )
        .filter((l) => l.quantity > 0),
    )
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setCart((prev) => prev.filter((l) => l.lineId !== lineId))
  }, [])

  const setLineNote = useCallback((lineId: string, note: string) => {
    setCart((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, note } : l)),
    )
  }, [])

  const submitOrder = useCallback(async () => {
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
    const payloadItems = cart.map((l) => {
      const orderItem = staffCartToOrderItems([l])[0]
      const baseNote = l.note?.trim()
      const generalLabel = generalNote.trim() ? `[${generalNote.trim()}]` : ""
      const finalNote = [orderItem.notes, baseNote, generalLabel].filter(Boolean).join(" — ") || undefined
      return {
        ...orderItem,
        notes: finalNote,
      }
    })

    try {
      const res = await fetch("/api/orders/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          customerName: customerLabel,
          channel: CHANNEL_LABEL[channel],
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
            quantity: number
            unit_price?: number
            notes?: string
            station?: string
            item_status?: string
          }) => ({
            id: it.id,
            name: it.name,
            quantity: it.quantity,
            notes: it.notes,
            unit_price: it.unit_price,
            station: it.station,
            item_status: it.item_status ?? "new",
          }),
        ),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customer_name: customerLabel,
        total: Number(o.total ?? total),
      }

      addOrder(order)
      setCart([])
      setGeneralNote("")
      setToast(`Commande #${o.order_number} envoyée en cuisine !`)
      setTimeout(() => setToast(null), 3000)
      const stationAudience = audienceForStationsFromItems(order.items)
      addNotification({
        type: "new_order",
        title: "Nouvelle commande sans table",
        message: `Commande ${o.order_number} — ${CHANNEL_LABEL[channel]} — ${cleanName}`,
        audience: [...new Set([...stationAudience, "CASHIER" as const])],
      })
    } catch {
      setToast("Erreur réseau — commande non enregistrée")
      setTimeout(() => setToast(null), 4000)
    }
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
                <StaffMenuPicker
                  catalog={catalog}
                  categories={menuData?.categories ?? []}
                  stationAvailability={menuData?.station_availability ?? []}
                  loading={menuLoading}
                  onAdd={addToCart}
                />
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
                          key={line.lineId}
                          className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
                        >
                          <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                {line.product.name}
                              </p>
                              {line.variant ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatVariantLabel(line.variant)}
                                </p>
                              ) : null}
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {line.unitPrice.toFixed(2)} €
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
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
                                size="icon"
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
                              size="icon"
                              onClick={() => removeLine(line.lineId)}
                              className="h-8 w-8 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Input
                            value={line.note ?? ""}
                            onChange={(e) =>
                              setLineNote(line.lineId, e.target.value)
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
