"use client"

import { useEffect, useMemo, useState } from "react"
import {
  DollarSign,
  TrendingUp,
  Receipt,
  PiggyBank,
  FileText,
  Printer,
  Plus,
  Loader2,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Period = "today" | "week" | "month"

type ExpenseCategory = { id: string; name: string; color?: string | null }

type SummaryByCategory = { name: string; color: string; total: number }
type SummaryByDay = { day: string; revenue?: number; expenses?: number; profit?: number }

type SummaryResponse = {
  totalExpenses: number
  totalRevenue: number
  profit: number
  byCategory: SummaryByCategory[]
  byDay: SummaryByDay[]
  periodDays?: number
  source: string
}

const TVA_RATE = 0.19

const formatCurrency = (v: number) => {
  const parts = v.toFixed(2).split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `${parts.join(",")} EUR`
}

const dayLabel = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3)
}

export default function FinancePage() {
  const [period, setPeriod] = useState<Period>("month")
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [showAddExpense, setShowAddExpense] = useState(false)

  const [form, setForm] = useState({
    categoryId: "",
    label: "",
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash",
    vendor: "",
    notes: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const days = period === "today" ? 1 : period === "week" ? 7 : 30

  const load = async () => {
    setLoading(true)
    try {
      const [sumRes, expRes] = await Promise.all([
        fetch(`/api/expenses/summary?days=${days}`),
        fetch(`/api/expenses?limit=50`),
      ])
      if (sumRes.ok) {
        const data = (await sumRes.json()) as SummaryResponse
        setSummary(data)
      }
      if (expRes.ok) {
        const data = await expRes.json()
        setCategories(data.categories ?? [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const revenue = summary?.totalRevenue ?? 0
  const totalExpenses = summary?.totalExpenses ?? 0
  const tvaCollected = revenue * TVA_RATE
  const netProfit = revenue - totalExpenses - tvaCollected
  const margin = revenue > 0 ? ((revenue - totalExpenses) / revenue) * 100 : 0

  const maxBar = useMemo(
    () => Math.max(1, ...(summary?.byDay ?? []).map((d) => Number(d.revenue ?? 0))),
    [summary],
  )

  const submitExpense = async () => {
    if (!form.label || !form.amount) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: form.categoryId || null,
          label: form.label,
          amount: parseFloat(form.amount),
          expenseDate: form.expenseDate,
          paymentMethod: form.paymentMethod,
          vendor: form.vendor || null,
          notes: form.notes || null,
        }),
      })
      if (res.ok) {
        setShowAddExpense(false)
        setForm({
          categoryId: "",
          label: "",
          amount: "",
          expenseDate: new Date().toISOString().slice(0, 10),
          paymentMethod: "cash",
          vendor: "",
          notes: "",
        })
        await load()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const kpis = [
    {
      title: "Revenus",
      value: formatCurrency(revenue),
      sub: `${summary?.byDay.length ?? 0} jours`,
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/40",
    },
    {
      title: "Depenses",
      value: formatCurrency(totalExpenses),
      sub: `${summary?.byCategory.length ?? 0} categories`,
      icon: TrendingUp,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/40",
    },
    {
      title: "TVA collectee (19%)",
      value: formatCurrency(tvaCollected),
      sub: "A declarer",
      icon: Receipt,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/40",
    },
    {
      title: "Benefice net",
      value: formatCurrency(netProfit),
      sub: `Marge ${margin.toFixed(1)}%`,
      icon: PiggyBank,
      color:
        netProfit >= 0
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400",
      bg:
        netProfit >= 0
          ? "bg-green-100 dark:bg-green-900/40"
          : "bg-red-100 dark:bg-red-900/40",
    },
  ]

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell>
        <SiteHeader
          backHref="/admin"
          hideMainNav
          trailing={
            <div className="flex items-center gap-2">
              {(["today", "week", "month"] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setPeriod(p)}
                >
                  {p === "today" ? "Jour" : p === "week" ? "7 jours" : "30 jours"}
                </Button>
              ))}
            </div>
          }
        />

        <div className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Tableau de bord financier
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {summary?.source === "supabase" ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2" />
                    Donnees en direct depuis Supabase
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500 mr-2" />
                    Mode demo (ajoutez SUPABASE_URL / SERVICE_ROLE pour activer le live)
                  </>
                )}
              </p>
            </div>
            <Button onClick={() => setShowAddExpense(!showAddExpense)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter depense
            </Button>
          </div>

          {showAddExpense && (
            <Card className="mb-8 border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10">
              <CardHeader>
                <CardTitle>Nouvelle depense</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Categorie</label>
                    <Select
                      value={form.categoryId}
                      onValueChange={(v) => setForm({ ...form, categoryId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Libelle *</label>
                    <Input
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="Ex: Achat viande"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Montant (EUR) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date</label>
                    <Input
                      type="date"
                      value={form.expenseDate}
                      onChange={(e) =>
                        setForm({ ...form, expenseDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Paiement</label>
                    <Select
                      value={form.paymentMethod}
                      onValueChange={(v) => setForm({ ...form, paymentMethod: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Especes</SelectItem>
                        <SelectItem value="card">Carte</SelectItem>
                        <SelectItem value="bank_transfer">Virement</SelectItem>
                        <SelectItem value="auto_debit">Prelevement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Fournisseur</label>
                    <Input
                      value={form.vendor}
                      onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddExpense(false)}>
                    Annuler
                  </Button>
                  <Button onClick={submitExpense} disabled={submitting || !form.label || !form.amount}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, i) => {
              const Icon = kpi.icon
              return (
                <Card
                  key={i}
                  className="hover:shadow-lg transition-shadow dark:bg-slate-800/60 dark:border-slate-700"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-xl ${kpi.bg}`}>
                        <Icon className={`h-6 w-6 ${kpi.color}`} />
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      {kpi.title}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {loading ? "..." : kpi.value}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {kpi.sub}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {summary?.byDay && summary.byDay.length > 0 && (
            <Card className="mb-8 dark:bg-slate-800/60 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  Evolution journaliere ({summary.byDay.length} jours)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-end justify-between gap-1 overflow-x-auto">
                  {summary.byDay.map((d) => (
                    <div
                      key={d.day}
                      className="flex min-w-[16px] flex-1 flex-col items-center gap-1"
                    >
                      <div className="flex h-full w-full flex-col justify-end rounded bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                        <div
                          className="rounded-t bg-gradient-to-t from-amber-600 to-orange-400 transition-all"
                          style={{
                            height: `${(Number(d.revenue ?? 0) / maxBar) * 100}%`,
                          }}
                          title={`${d.day}: ${formatCurrency(Number(d.revenue ?? 0))}`}
                        />
                      </div>
                      {summary.byDay.length <= 14 && (
                        <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300">
                          {dayLabel(d.day)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="dark:bg-slate-800/60 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Depenses par categorie</CardTitle>
              </CardHeader>
              <CardContent>
                {(!summary || summary.byCategory.length === 0) ? (
                  <p className="text-sm text-slate-500">
                    {loading ? "Chargement..." : "Aucune depense sur la periode."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {summary.byCategory.map((exp) => {
                      const pct = totalExpenses > 0 ? (exp.total / totalExpenses) * 100 : 0
                      return (
                        <div key={exp.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {exp.name}
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {formatCurrency(exp.total)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full"
                              style={{
                                width: `${pct}%`,
                                background:
                                  exp.color || "linear-gradient(to right,#f59e0b,#f97316)",
                              }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{pct.toFixed(1)}%</p>
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-600 pt-3">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatCurrency(totalExpenses)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-800/60 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  Bilan —{" "}
                  {period === "today"
                    ? "Aujourd'hui"
                    : period === "week"
                      ? "7 derniers jours"
                      : "30 derniers jours"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                    <span className="text-sm text-green-800 dark:text-green-300">Revenus</span>
                    <span className="font-bold text-green-700 dark:text-green-400">
                      {formatCurrency(revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                    <span className="text-sm text-red-800 dark:text-red-300">Depenses</span>
                    <span className="font-bold text-red-700 dark:text-red-400">
                      - {formatCurrency(totalExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
                    <span className="text-sm text-amber-800 dark:text-amber-300">
                      TVA (19%)
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      - {formatCurrency(tvaCollected)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                    <div className="flex justify-between">
                      <span className="text-base font-semibold">Benefice net</span>
                      <span
                        className={`text-xl font-bold ${
                          netProfit >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {netProfit >= 0 ? "+" : ""}
                        {formatCurrency(netProfit)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Badge
                        className={
                          netProfit >= 0
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        }
                      >
                        {netProfit >= 0 ? "Rentable" : "Deficit"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="dark:bg-slate-800/60 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  Factures & documents
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Exporter PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Les factures sont synchronisees avec la table{" "}
                <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">
                  invoices
                </code>{" "}
                (API{" "}
                <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">
                  /api/invoices
                </code>
                ).
              </p>
            </CardContent>
          </Card>
        </div>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
