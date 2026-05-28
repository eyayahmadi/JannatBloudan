"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Download,
  DollarSign,
  Users,
  Package,
  Loader2,
  Database,
  Truck,
  CreditCard,
  Wallet,
  Receipt,
  PieChart,
} from "lucide-react"
import Link from "next/link"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type SalesRow = {
  date: string
  revenue: number
  orders: number
  avgOrder: number
}

type ProductStat = {
  name: string
  category: string
  sold: number
  revenue: number
  profit: number
}

type StaffRow = {
  userId?: string
  name: string
  orders: number
  sales: number
  rating: number
}

type CommercialPayload = {
  payments?: {
    succeededTotal: number
    byMethod?: Record<string, { count: number; amount: number }>
    cashSucceeded: number
    nonCashSucceeded: number
  }
  invoices?: {
    paidTotal: number
    paidCount: number
    validatedTotal: number
    validatedCount: number
    cancelledCount: number
    discountSum: number
    hospitalityTotal: number
    hospitalityCount: number
  }
  invoiceLines?: {
    cancelledLines: number
    cancelledLinesSubtotal: number
    wasteLines: number
    wasteSubtotal: number
  }
  offers?: { redemptionCount: number; amountSaved: number }
  expenses?: { total: number; count: number }
  stockMovements?: Record<string, { movements: number; quantity: number }>
  cashRegister?: {
    byKind?: Record<string, { count: number; amount: number }>
    employeeAdvances?: { total: number; count: number }
  }
} | null

type ReportsPayload = {
  ok: boolean
  source?: string
  salesByDay: SalesRow[]
  topProducts: ProductStat[]
  staffPerformance: StaffRow[]
  stockSnapshot: {
    inventoryValueApprox: number
    lowStockCount: number
    outOfStockCount: number
  } | null
  kpis?: { totalRevenue: number; totalOrders: number; avgBasket: number }
  commercial?: CommercialPayload | null
}

type SupplierPayload = {
  ok: boolean
  totals?: { count: number; sum_ttc_sample: number; by_status: Record<string, number> }
  recent?: Array<{
    id: string
    status?: string
    total_ttc: number
    supplier_name_raw: string | null
    invoice_date: string | null
  }>
}

function emptyCommercial(): CommercialPayload {
  return null
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("week")
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<ReportsPayload | null>(null)
  const [supplier, setSupplier] = useState<SupplierPayload | null>(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([
        fetch(`/api/admin/reports-data?period=${selectedPeriod}`, { cache: "no-store" }).then((x) =>
          x.json(),
        ),
        fetch("/api/admin/supplier-stats", { cache: "no-store" }).then((x) => x.json()),
      ])
      setReports(r as ReportsPayload)
      setSupplier(s as SupplierPayload)
    } catch {
      setReports(null)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const usingLive = reports?.ok === true && reports.source === "supabase"

  const salesData = usingLive ? reports!.salesByDay ?? [] : []
  const productStats = usingLive ? reports!.topProducts ?? [] : []
  const staffStats = reports?.staffPerformance ?? []

  const stockSnapshot =
    reports?.stockSnapshot ??
    (usingLive
      ? ({ inventoryValueApprox: 0, lowStockCount: 0, outOfStockCount: 0 } as ReportsPayload["stockSnapshot"])
      : null)

  const commercial = usingLive ? reports?.commercial ?? emptyCommercial() : emptyCommercial()

  const totalRevenue =
    usingLive && reports!.kpis
      ? reports!.kpis.totalRevenue
      : salesData.reduce((sum, day) => sum + day.revenue, 0)
  const totalOrders =
    usingLive && reports!.kpis ? reports!.kpis.totalOrders : salesData.reduce((sum, day) => sum + day.orders, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const periodLabel =
    selectedPeriod === "today" ? "Aujourd'hui" : selectedPeriod === "week" ? "7 derniers jours" : "30 derniers jours"

  const paymentBadges = useMemo(() => {
    const bm = commercial?.payments?.byMethod ?? {}
    return Object.entries(bm)
      .sort((a, b) => (b[1]?.amount ?? 0) - (a[1]?.amount ?? 0))
      .slice(0, 8)
      .map(([k, v]) => (
        <Badge key={k} variant="secondary" className="font-normal">
          {k}: {(v.amount ?? 0).toFixed(2)} € ({v.count})
        </Badge>
      ))
  }, [commercial])

  const stockMovementRows = useMemo(() => {
    const sm = commercial?.stockMovements ?? {}
    return Object.entries(sm)
      .sort((a, b) => (b[1]?.movements ?? 0) - (a[1]?.movements ?? 0))
      .slice(0, 14)
      .map(([k, v]) => (
        <div key={k} className="flex justify-between text-sm gap-4 border-b border-border/70 py-1.5 last:border-0">
          <span className="truncate font-medium">{k}</span>
          <span className="shrink-0 text-muted-foreground">
            {(v.quantity ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} qty · {v.movements} mvts
          </span>
        </div>
      ))
  }, [commercial])

  const cashKindRows = useMemo(() => {
    const bk = commercial?.cashRegister?.byKind ?? {}
    return Object.entries(bk)
      .sort((a, b) => (b[1]?.amount ?? 0) - (a[1]?.amount ?? 0))
      .slice(0, 10)
      .map(([k, v]) => (
        <div key={k} className="flex justify-between text-sm gap-4 border-b border-border/70 py-1.5 last:border-0">
          <span className="truncate capitalize">{k.replace(/_/g, " ")}</span>
          <span className="shrink-0">
            {(v.amount ?? 0).toFixed(2)} € <span className="text-muted-foreground">×{v.count}</span>
          </span>
        </div>
      ))
  }, [commercial])

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const pay = commercial?.payments
    const inv = commercial?.invoices

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapports — ${new Date().toLocaleDateString("fr-FR")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1e293b; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #f8fafc; }
            .meta { color: #64748b; margin-bottom: 24px; }
          </style>
        </head>
        <body>
          <h1>Rapports & statistiques</h1>
          <p class="meta">Période : ${periodLabel} · ${usingLive ? "Source : données réelles Supabase (agrégats API)" : "Source : aucune donnée (Supabase requis)"} · ${new Date().toLocaleString("fr-FR")}</p>
          <table>
            <tr><td><strong>Revenus (commandes hors annulées)</strong></td><td>${totalRevenue.toFixed(2)} €</td></tr>
            <tr><td><strong>Commandes</strong></td><td>${totalOrders}</td></tr>
            <tr><td><strong>Panier moyen</strong></td><td>${avgOrderValue.toFixed(2)} €</td></tr>
            ${
              pay
                ? `<tr><td><strong>Paiements réussis (total)</strong></td><td>${pay.succeededTotal.toFixed(2)} €</td></tr>
                   <tr><td><strong>Cash réussi vs hors cash</strong></td><td>${pay.cashSucceeded.toFixed(2)} € · ${pay.nonCashSucceeded.toFixed(2)} €</td></tr>`
                : ""
            }
            ${
              inv
                ? `<tr><td><strong>Factures payées (facturation)</strong></td><td>${inv.paidTotal.toFixed(2)} € (${inv.paidCount})</td></tr>
                   <tr><td><strong>Factures annulées</strong></td><td>${inv.cancelledCount}</td></tr>
                   <tr><td><strong>Hospitalités / hors CA facture</strong></td><td>${inv.hospitalityTotal.toFixed(2)} € (${inv.hospitalityCount})</td></tr>
                   <tr><td><strong>Rabais sur factures (hors hosp.)</strong></td><td>${inv.discountSum.toFixed(2)} €</td></tr>`
                : ""
            }
          </table>
          <h2 style="margin-top:28px">Ventes par jour</h2>
          <table><thead><tr><th>Date</th><th>Revenus</th><th>Commandes</th><th>Panier moy.</th></tr></thead><tbody>
            ${salesData
              .map(
                (d) =>
                  `<tr><td>${d.date}</td><td>${d.revenue.toFixed(2)} €</td><td>${d.orders}</td><td>${d.avgOrder.toFixed(2)} €</td></tr>`,
              )
              .join("")}
          </tbody></table>
          <h2 style="margin-top:28px">Top produits</h2>
          <table><thead><tr><th>Produit</th><th>Vendus</th><th>CA</th></tr></thead><tbody>
            ${productStats
              .slice(0, 12)
              .map((p) => `<tr><td>${p.name}</td><td>${p.sold}</td><td>${p.revenue.toFixed(2)} €</td></tr>`)
              .join("")}
          </tbody></table>
        </body>
      </html>`
    printWindow.document.write(reportHTML)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <AdminPageFrame
      title="Rapports & statistiques"
      subtitle="Synthèse financière et opérationnelle depuis la base (aucun jeu statique)."
      trailing={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => void loadReports()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Rafraîchir
          </Button>
          <Button
            variant={selectedPeriod === "today" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedPeriod("today")}
          >
            Aujourd&apos;hui
          </Button>
          <Button
            variant={selectedPeriod === "week" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedPeriod("week")}
          >
            7 jours
          </Button>
          <Button
            variant={selectedPeriod === "month" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedPeriod("month")}
          >
            30 jours
          </Button>
          <Button size="pillSm" className="gap-2" onClick={handleExportPDF}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {usingLive ? (
          <Badge variant="outline" className="border-green-600/40 bg-green-50 text-green-900 dark:bg-green-950/40">
            <Database className="mr-1 h-3 w-3" /> {periodLabel} · données Supabase
          </Badge>
        ) : (
          <Badge variant="outline" className="border-amber-500/40 bg-amber-50 text-amber-950 dark:bg-amber-950/25">
            Connectez Supabase et chargez les scripts SQL commerciaux pour activer ces rapports.
          </Badge>
        )}
        <Link href="/admin/insights" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Insights ops
        </Link>
        <Link
          href="/admin/supplier-invoices"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Factures fournisseurs
        </Link>
        <Link
          href="/admin/copilot"
          className="text-sm font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-300"
        >
          Copilot admin →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-600">Revenus (commandes)</p>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalRevenue.toFixed(2)}€</p>
            {commercial?.invoices?.paidTotal != null && commercial.invoices.paidTotal > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Facturation payée (ref.) : {commercial.invoices.paidTotal.toFixed(2)} € ({commercial.invoices.paidCount}{" "}
                fact.)
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-600">Commandes</p>
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-600">Panier moyen</p>
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{avgOrderValue.toFixed(2)}€</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-600">Paiements réussis</p>
              <CreditCard className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {commercial?.payments?.succeededTotal != null
                ? `${commercial.payments.succeededTotal.toFixed(2)}€`
                : usingLive
                  ? "0.00€"
                  : "—"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {commercial?.payments
                ? `Cash ${commercial.payments.cashSucceeded.toFixed(2)} € · Hors cash ${commercial.payments.nonCashSucceeded.toFixed(2)} €`
                : usingLive
                  ? "Aucun paiement sur la fenêtre ou table `payments` absente."
                  : "Données indisponibles sans Supabase."}
            </p>
          </CardContent>
        </Card>
      </div>

      {usingLive ? (
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Facturation & hospitalité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/40">
                  <p className="text-xs text-muted-foreground">Factures annulées</p>
                  <p className="text-2xl font-bold">{commercial?.invoices?.cancelledCount ?? 0}</p>
                </div>
                <div className="rounded-lg bg-violet-50 p-4 dark:bg-violet-950/25">
                  <p className="text-xs text-violet-800 dark:text-violet-200">Rabais factures (hors hosp.)</p>
                  <p className="text-2xl font-bold">{commercial?.invoices?.discountSum?.toFixed(2) ?? "0.00"} €</p>
                </div>
                <div className="rounded-lg bg-rose-50 p-4 dark:bg-rose-950/25">
                  <p className="text-xs text-rose-800 dark:text-rose-200">Hospitalités / hors CA</p>
                  <p className="text-2xl font-bold">{commercial?.invoices?.hospitalityTotal?.toFixed(2) ?? "0.00"} €</p>
                  <p className="text-xs text-muted-foreground">{commercial?.invoices?.hospitalityCount ?? 0} fact.</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/25">
                  <p className="text-xs text-amber-900 dark:text-amber-200">Offres appliquées (épargne)</p>
                  <p className="text-2xl font-bold">{commercial?.offers?.amountSaved?.toFixed(2) ?? "0.00"} €</p>
                  <p className="text-xs text-muted-foreground">{commercial?.offers?.redemptionCount ?? 0} applications</p>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Lignes facture · annulations & pertes</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex justify-between">
                    <span>Lignes annulées</span>
                    <strong className="text-foreground">{commercial?.invoiceLines?.cancelledLines ?? 0}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Total HT/TTC lignes annulées</span>
                    <strong>{(commercial?.invoiceLines?.cancelledLinesSubtotal ?? 0).toFixed(2)} €</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Pertes / gaspillage</span>
                    <strong>{commercial?.invoiceLines?.wasteLines ?? 0} lignes</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Montant lignes perte</span>
                    <strong>{(commercial?.invoiceLines?.wasteSubtotal ?? 0).toFixed(2)} €</strong>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <PieChart className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Dépenses, caisse table, stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/20">
                  <p className="text-xs text-muted-foreground">Dépenses (livre)</p>
                  <p className="text-xl font-bold">{(commercial?.expenses?.total ?? 0).toFixed(2)} €</p>
                  <p className="text-xs text-muted-foreground">{commercial?.expenses?.count ?? 0} lignes</p>
                </div>
                <div className="rounded-lg bg-sky-50 p-4 dark:bg-sky-950/20">
                  <p className="text-xs text-muted-foreground">Avances salaires (caisse)</p>
                  <p className="text-xl font-bold">
                    {(commercial?.cashRegister?.employeeAdvances?.total ?? 0).toFixed(2)} €
                  </p>
                  <p className="text-xs text-muted-foreground">{commercial?.cashRegister?.employeeAdvances?.count ?? 0} mouv.</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mouvements caisse (`cash_register_movements`)
                </p>
                {cashKindRows.length ? <div className="rounded-lg border p-3">{cashKindRows}</div> : (
                  <p className="text-muted-foreground">Aucun mouvement ou table absente.</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Stock (`stock_movements` — quantités abs.)
                </p>
                {stockMovementRows.length ? <div className="max-h-[220px] overflow-y-auto rounded-lg border p-3">{stockMovementRows}</div> : (
                  <p className="text-muted-foreground">Aucun mouvement sur la période.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Détail des paiements par moyen (statut `succeeded`)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {paymentBadges.length ? paymentBadges : (
                  <p className="text-sm text-muted-foreground">Pas de paiement encaissé sur la fenêtre.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Fournisseurs · intelligence rapide</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {supplier?.ok && supplier.totals ? (
              <>
                <p>
                  Factures analysées dans l&apos;échantillon :{" "}
                  <strong>{supplier.totals.count}</strong> · Total TTC (échantillon) :{" "}
                  <strong>{supplier.totals.sum_ttc_sample.toFixed(2)} €</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(supplier.totals.by_status).map(([k, v]) => (
                    <Badge key={k} variant="secondary">
                      {k}: {v}
                    </Badge>
                  ))}
                </div>
                <ul className="mt-3 space-y-1 border-t border-border pt-3">
                  {(supplier.recent ?? []).slice(0, 5).map((r) => (
                    <li key={r.id} className="flex justify-between gap-2 text-muted-foreground">
                      <span className="truncate">{r.supplier_name_raw ?? r.id.slice(0, 8)}</span>
                      <span>
                        {r.total_ttc.toFixed(2)} € · {r.status}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/admin/supplier-invoices">Ouvrir la validation OCR</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Module factures désactivé ou non configuré.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ventes journalières</CardTitle>
        </CardHeader>
        <CardContent>
          {salesData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {usingLive ? "Aucune commande hors annulation sur cette période." : "Aucune donnée — configurez Supabase."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Revenus</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Commandes</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Panier moyen</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((day, index) => (
                    <tr key={day.date + index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-4 text-sm">
                        {new Date(day.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-green-600">{day.revenue.toFixed(2)}€</td>
                      <td className="px-4 py-4 text-right text-sm">{day.orders}</td>
                      <td className="px-4 py-4 text-right text-sm">{day.avgOrder.toFixed(2)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[560px] space-y-3 overflow-y-auto">
              {productStats.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {usingLive ? "Aucune ligne produit active sur la période." : "Données indisponibles."}
                </p>
              ) : (
                productStats.slice(0, 12).map((product, index) => (
                  <div key={product.name + index} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-600">
                          {product.category} · {product.sold} vendus
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{product.revenue.toFixed(2)}€</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Charge par serveur (si `assigned_to` renseigné)</CardTitle>
          </CardHeader>
          <CardContent>
            {staffStats.length === 0 ? (
              <p className="mb-4 text-sm text-muted-foreground">
                {!usingLive
                  ? "Renseignez Supabase puis assignez les commandes pour voir cette répartition."
                  : "Aucune commande avec `assigned_to` sur la période."}
              </p>
            ) : (
              <div className="space-y-4">
                {staffStats.map((staff, index) => (
                  <div
                    key={(staff.userId ?? staff.name) + index}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
                        {staff.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{staff.name}</p>
                        <p className="text-xs text-slate-600">{staff.orders} commandes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{staff.sales.toFixed(2)}€</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock (instantané)</CardTitle>
        </CardHeader>
        <CardContent>
          {stockSnapshot == null ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Résumé stock indisponible (Supabase désactivé).</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-6 text-center">
                <p className="mb-2 text-sm text-slate-600">Valeur stock (approx.)</p>
                <p className="text-3xl font-bold">{stockSnapshot.inventoryValueApprox.toFixed(2)}€</p>
              </div>
              <div className="rounded-lg bg-red-50 p-6 text-center">
                <p className="mb-2 text-sm text-red-700">SKU en alerte (`v_low_stock`)</p>
                <p className="text-3xl font-bold text-red-600">{stockSnapshot.lowStockCount}</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-6 text-center">
                <p className="mb-2 text-sm text-orange-700">Ruptures (qty = 0)</p>
                <p className="text-3xl font-bold text-orange-600">{stockSnapshot.outOfStockCount}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageFrame>
  )
}
