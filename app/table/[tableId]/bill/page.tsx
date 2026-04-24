"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, CreditCard, Receipt, Wallet } from "lucide-react"

import { PageShell } from "@/components/site/PageShell"
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders"
import { useTableAlerts } from "@/lib/hooks/useTableAlerts"

export default function TableBillPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const { orders, updateStatus } = useRealtimeOrders()
  const { raise } = useTableAlerts()
  const [method, setMethod] = useState<"card" | "wallet" | "server">("card")
  const [done, setDone] = useState(false)

  const tableOrders = useMemo(
    () =>
      orders.filter(
        (o) => String(o.table_number) === String(tableId) && o.status !== "cancelled",
      ),
    [orders, tableId],
  )
  const total = tableOrders.reduce((s, o) => s + o.total, 0)
  const tax = Math.round(total * 0.1 * 100) / 100
  const grandTotal = Math.round((total + tax) * 100) / 100

  function pay() {
    if (method === "server") {
      raise({
        tableId: String(tableId),
        type: "request_bill",
        message: `Table ${tableId} demande l'addition (paiement sur place)`,
      })
      setDone(true)
      return
    }
    tableOrders.forEach((o) => updateStatus(o.id, "completed"))
    raise({
      tableId: String(tableId),
      type: "payment_done",
      message: `Table ${tableId} a payé en ligne (${grandTotal.toFixed(2)}€)`,
    })
    setDone(true)
  }

  return (
    <PageShell className="dark:bg-neutral-950">
      <header className="sticky top-0 z-50 border-b border-amber-200/40 bg-white/80 backdrop-blur-xl dark:border-amber-900/30 dark:bg-neutral-900/80">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href={`/table/${tableId}`} className="text-amber-900 dark:text-amber-200">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Table {tableId}
            </p>
            <p className="text-sm font-semibold text-amber-950 dark:text-white">Addition & paiement</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {done ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
            <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
              {method === "server" ? "Serveur prévenu" : "Paiement confirmé"}
            </h2>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
              {method === "server"
                ? "Un serveur arrive avec l'addition."
                : `Merci! Votre reçu a été généré pour ${grandTotal.toFixed(2)}€.`}
            </p>
            <Link
              href={`/table/${tableId}`}
              className="mt-5 inline-block rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
            >
              Retour à la table
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-2xl border border-amber-100 bg-white p-4 dark:border-amber-900/30 dark:bg-neutral-900">
              <div className="mb-3 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-700" />
                <h2 className="text-sm font-semibold text-amber-950 dark:text-white">Récapitulatif</h2>
              </div>
              {tableOrders.length === 0 ? (
                <p className="text-sm text-amber-800/70">Aucune commande sur cette table.</p>
              ) : (
                <div className="space-y-3">
                  {tableOrders.map((o) => (
                    <div key={o.id} className="rounded-xl bg-amber-50 px-3 py-2.5 dark:bg-neutral-800">
                      <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
                        <span className="font-semibold">#{o.order_number}</span>
                        <span>{new Date(o.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <ul className="mt-1 space-y-0.5 text-sm text-amber-950 dark:text-amber-100">
                        {o.items.map((it, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{it.quantity}× {it.name}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 text-right text-sm font-semibold text-amber-900 dark:text-amber-200">
                        {o.total.toFixed(2)}€
                      </p>
                    </div>
                  ))}

                  <div className="space-y-1 border-t border-amber-100 pt-3 text-sm dark:border-amber-900/30">
                    <div className="flex justify-between text-amber-800 dark:text-amber-300">
                      <span>Sous-total</span>
                      <span>{total.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-amber-800 dark:text-amber-300">
                      <span>TVA (10%)</span>
                      <span>{tax.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-amber-950 dark:text-white">
                      <span>Total</span>
                      <span>{grandTotal.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              {(
                [
                  { id: "card", label: "Carte", icon: CreditCard },
                  { id: "wallet", label: "Wallet", icon: Wallet },
                  { id: "server", label: "Sur place", icon: Receipt },
                ] as const
              ).map((m) => {
                const Icon = m.icon
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs font-semibold transition ${
                      method === m.id
                        ? "border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-100"
                        : "border-amber-100 bg-white text-amber-800 hover:border-amber-300 dark:border-amber-900/30 dark:bg-neutral-900 dark:text-amber-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {m.label}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={pay}
              disabled={tableOrders.length === 0}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 py-4 text-center text-lg font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98] disabled:opacity-40"
            >
              {method === "server" ? "Appeler le serveur" : `Payer ${grandTotal.toFixed(2)}€`}
            </button>
          </>
        )}
      </main>
    </PageShell>
  )
}
