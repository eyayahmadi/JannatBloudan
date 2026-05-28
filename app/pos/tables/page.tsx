"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Banknote, CheckCircle2, CreditCard, Printer, Receipt, Search, Wallet, XCircle } from "lucide-react"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders"
import { useTableAlerts } from "@/lib/hooks/useTableAlerts"
import {
  computeTableSnapshot,
  TABLE_STATUS_META,
  TONE_BADGE,
  type TableStatus,
} from "@/lib/table-status"

const TABLE_IDS = Array.from({ length: 20 }, (_, i) => i + 1)

type PaymentFilter = "all" | "to_pay" | "requested" | "paid"

export default function PosTablesPage() {
  const { orders, updateStatus } = useRealtimeOrders()
  const { alerts, raise, resolveTable } = useTableAlerts()
  const { add: notify } = useNotifications()

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<PaymentFilter>("all")

  const snapshots = useMemo(
    () =>
      TABLE_IDS.map((id) => computeTableSnapshot(id, orders, alerts)).filter(
        (s) => s.activeOrders.length > 0 || s.hasBillAlert || s.hasPaymentDone,
      ),
    [orders, alerts],
  )

  const filtered = useMemo(() => {
    let list = snapshots
    if (search.trim()) {
      const q = search.trim()
      list = list.filter((s) => String(s.tableId).includes(q))
    }
    if (filter === "to_pay") list = list.filter((s) => s.status !== "PAID")
    if (filter === "requested") list = list.filter((s) => s.hasBillAlert)
    if (filter === "paid") list = list.filter((s) => s.status === "PAID")
    return list
  }, [snapshots, search, filter])

  const totals = useMemo(() => {
    const t = { open: 0, paid: 0, requested: 0, sum: 0, cash: 0 }
    snapshots.forEach((s) => {
      t.sum += s.total
      if (s.hasBillAlert) t.requested += 1
      if (s.status === "PAID") t.paid += 1
      else t.open += 1
      if (s.hasPaymentDone) t.cash += 0 // paiement en ligne déjà compté
    })
    return t
  }, [snapshots])

  function validateCash(tableId: number) {
    const snap = snapshots.find((s) => s.tableId === tableId)
    if (!snap) return
    snap.activeOrders.forEach((o) => {
      if (o.status !== "completed") updateStatus(o.id, "completed")
    })
    resolveTable(String(tableId), "request_bill")
    raise({
      tableId: String(tableId),
      type: "payment_done",
      message: `Table ${tableId} — paiement cash encaisse (${snap.total.toFixed(2)}€)`,
    })
    notify({
      type: "payment_received",
      title: "Paiement encaisse",
      message: `Table ${tableId} • ${snap.total.toFixed(2)}€ cash`,
    })
  }

  function cancelBillRequest(tableId: number) {
    resolveTable(String(tableId), "request_bill")
  }

  return (
    <RequireAuth roles={["ADMIN", "CASHIER"]}>
      <PageShell className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/pos" backLabel="POS" hideMainNav />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Tables à encaisser
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Factures ouvertes, demandes d'addition, paiements en ligne
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/pos">Caisse POS</Link>
            </Button>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Tables ouvertes" value={String(totals.open)} tone="yellow" />
            <StatBox
              label="Addition demandée"
              value={String(totals.requested)}
              tone="rose"
            />
            <StatBox label="Payées" value={String(totals.paid)} tone="green" />
            <StatBox
              label="Total en attente"
              value={`${totals.sum.toFixed(2)} €`}
              tone="blue"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-3 text-base text-slate-900 dark:text-white">
                <Receipt className="h-4 w-4" /> Factures ouvertes
                <div className="relative ml-auto w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-8"
                    placeholder="Table..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    { id: "all", label: "Toutes" },
                    { id: "to_pay", label: "À payer" },
                    { id: "requested", label: "Addition demandée" },
                    { id: "paid", label: "Payées" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      filter === f.id
                        ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Aucune table dans cette vue.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-slate-500">
                        <th className="py-2">Table</th>
                        <th>Articles</th>
                        <th>Total</th>
                        <th>Statut</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((snap) => {
                        const meta = TABLE_STATUS_META[snap.status]
                        const itemCount = snap.activeOrders.reduce(
                          (n, o) => n + o.items.reduce((k, it) => k + it.quantity, 0),
                          0,
                        )
                        return (
                          <tr key={snap.tableId} className="border-b last:border-0">
                            <td className="py-3 align-top">
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-slate-700">
                                  {snap.tableId}
                                </span>
                                <div className="text-xs text-slate-500">
                                  #{snap.activeOrders.length} cmd
                                </div>
                              </div>
                            </td>
                            <td className="py-3 align-top">
                              <div className="space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
                                {snap.activeOrders.slice(0, 3).map((o) => (
                                  <div key={o.id}>
                                    <span className="font-semibold">#{o.order_number}</span>
                                    <span className="ml-1 text-slate-500">
                                      {o.items.map((it) => `${it.quantity}× ${it.name}`).join(", ")}
                                    </span>
                                  </div>
                                ))}
                                {snap.activeOrders.length > 3 ? (
                                  <div className="text-slate-500">
                                    +{snap.activeOrders.length - 3} autre(s)
                                  </div>
                                ) : null}
                                <div className="text-slate-500">{itemCount} article(s)</div>
                              </div>
                            </td>
                            <td className="py-3 align-top font-bold text-slate-900 dark:text-white">
                              {snap.total.toFixed(2)}€
                            </td>
                            <td className="py-3 align-top">
                              <Badge className={TONE_BADGE[meta.tone]}>{meta.label}</Badge>
                              {snap.hasPaymentDone && snap.status === "PAID" ? (
                                <div className="mt-1 text-[10px] font-semibold uppercase text-emerald-600">
                                  payé en ligne
                                </div>
                              ) : null}
                            </td>
                            <td className="py-3 align-top">
                              <div className="flex flex-wrap justify-end gap-1.5">
                                {snap.status === "PAID" ? (
                                  <Button size="sm" variant="outline" disabled>
                                    <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" />
                                    Encaissé
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => validateCash(snap.tableId)}
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                      <Banknote className="mr-1 h-3 w-3" />
                                      Cash
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => validateCash(snap.tableId)}
                                    >
                                      <CreditCard className="mr-1 h-3 w-3" />
                                      Carte
                                    </Button>
                                    {snap.hasBillAlert ? (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => cancelBillRequest(snap.tableId)}
                                        title="Ignorer la demande"
                                      >
                                        <XCircle className="h-3 w-3" />
                                      </Button>
                                    ) : null}
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.print()}
                                  title="Imprimer / PDF"
                                >
                                  <Printer className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </PageShell>
    </RequireAuth>
  )
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: keyof typeof TONE_BADGE
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 shadow-sm",
        "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
      )}
    >
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={cn("mt-1 text-xl font-bold", "text-slate-900 dark:text-white")}>{value}</p>
      <div className={cn("mt-2 inline-block rounded-full px-2 py-0.5 text-[10px]", TONE_BADGE[tone])}>
        live
      </div>
    </div>
  )
}
