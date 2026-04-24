"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { CheckCircle2, Clock, ChefHat, BellRing, PartyPopper } from "lucide-react"
import { PageShell } from "@/components/site/PageShell"

type OrderItem = { name: string; quantity: number }

type Order = {
  id: string
  order_number: string
  table_number: number
  order_type: string
  status: "received" | "preparing" | "ready" | "completed"
  items: OrderItem[]
  created_at: string
  updated_at: string
  customer_name: string
  total: number
}

const steps: { key: Order["status"]; label: string; icon: typeof Clock }[] = [
  { key: "received", label: "Reçue", icon: Clock },
  { key: "preparing", label: "En préparation", icon: ChefHat },
  { key: "ready", label: "Prête", icon: BellRing },
  { key: "completed", label: "Terminée", icon: PartyPopper },
]

export default function OrderConfirmationPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("oid")

  const [order, setOrder] = useState<Order | null>(null)

  const loadOrder = useCallback(() => {
    const raw = localStorage.getItem("jb-realtime-orders")
    if (!raw) return
    try {
      const orders: Order[] = JSON.parse(raw)
      const found = orders.find((o) => o.id === orderId)
      if (found) setOrder(found)
    } catch {
      /* ignore */
    }
  }, [orderId])

  useEffect(() => {
    loadOrder()
    const interval = setInterval(loadOrder, 3000)
    return () => clearInterval(interval)
  }, [loadOrder])

  const currentStepIdx = order ? steps.findIndex((s) => s.key === order.status) : 0

  return (
    <PageShell className="dark:bg-neutral-950">
      <div className="flex min-h-screen flex-col items-center justify-start px-4 py-10">
        {/* Success animation */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30 animate-[bounce_1s_ease-in-out]">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-amber-950 dark:text-white">
          Commande envoyée !
        </h1>
        <p className="mb-8 text-center text-amber-800/70 dark:text-amber-300/70">
          Votre commande a bien été transmise en cuisine.
        </p>

        {/* Order info card */}
        {order && (
          <div className="w-full max-w-md space-y-6">
            <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm dark:border-amber-900/30 dark:bg-neutral-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Commande
                  </p>
                  <p className="text-lg font-bold text-amber-950 dark:text-white">{order.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Table
                  </p>
                  <p className="text-lg font-bold text-amber-950 dark:text-white">{order.table_number}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-amber-100 pt-4 dark:border-amber-900/30">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-amber-900 dark:text-amber-200">
                      {item.quantity}× {item.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-amber-100 pt-4 dark:border-amber-900/30">
                <span className="font-semibold text-amber-800 dark:text-amber-300">Total</span>
                <span className="text-xl font-bold text-amber-950 dark:text-white">{order.total.toFixed(2)}€</span>
              </div>
            </div>

            {/* Status tracker */}
            <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm dark:border-amber-900/30 dark:bg-neutral-900">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Suivi en temps réel
              </h2>

              <div className="relative space-y-6">
                {steps.map((step, idx) => {
                  const Icon = step.icon
                  const isActive = idx <= currentStepIdx
                  const isCurrent = idx === currentStepIdx

                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                            isActive
                              ? "border-amber-500 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30"
                              : "border-amber-200 bg-amber-50 text-amber-400 dark:border-amber-800 dark:bg-neutral-800 dark:text-amber-700"
                          } ${isCurrent ? "scale-110 ring-4 ring-amber-200/50 dark:ring-amber-700/30" : ""}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {idx < steps.length - 1 && (
                          <div
                            className={`mt-1 h-6 w-0.5 transition-colors duration-500 ${
                              idx < currentStepIdx
                                ? "bg-amber-500"
                                : "bg-amber-200 dark:bg-amber-800"
                            }`}
                          />
                        )}
                      </div>
                      <div className="pt-2">
                        <p
                          className={`text-sm font-semibold transition-colors ${
                            isActive
                              ? "text-amber-950 dark:text-white"
                              : "text-amber-400 dark:text-amber-700"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Thank-you message for completed orders */}
            {order.status === "completed" && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/40 dark:bg-green-950/30">
                <PartyPopper className="mx-auto mb-3 h-8 w-8 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-bold text-green-800 dark:text-green-300">
                  Merci pour votre commande !
                </h3>
                <p className="mt-1 text-sm text-green-700/80 dark:text-green-400/70">
                  Nous espérons que vous avez apprécié votre repas. À bientôt !
                </p>
              </div>
            )}

            <p className="text-center text-xs text-amber-600/60 dark:text-amber-500/40">
              Mise à jour automatique toutes les 3 secondes
            </p>
          </div>
        )}

        {!order && (
          <div className="text-center text-amber-700 dark:text-amber-400">
            <p>Chargement de la commande…</p>
          </div>
        )}
      </div>
    </PageShell>
  )
}
