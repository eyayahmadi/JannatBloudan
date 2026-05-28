"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { ElementType } from "react"
import {
  ArrowLeftRight,
  Banknote,
  Building2,
  BellRing,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Table2,
  Truck,
  Wallet,
  AlertTriangle,
  Lock,
  TrendingDown,
  TrendingUp,
  Ticket,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { StaffWorkspaceShell } from "@/components/workspace/StaffWorkspaceShell"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CashRegisterMovementForm } from "@/components/caisse/CashRegisterMovementForm"
import { CaisseInvoicesPanel } from "@/components/caisse/CaisseInvoicesPanel"
import { CaisseTableSessionPanel } from "@/components/caisse/CaisseTableSessionPanel"
import { CaisseFloorPlan } from "@/components/caisse/CaisseFloorPlan"
import { ExternalIncomePanel } from "@/components/caisse/ExternalIncomePanel"
import { SortieCaisseDialog } from "@/components/caisse/SortieCaisseDialog"
import { SortiesJourTable } from "@/components/caisse/SortiesJourTable"
import { CaisseEventTicketsPanel } from "@/components/caisse/CaisseEventTicketsPanel"
import { ClientCreditsPanel } from "@/components/caisse/ClientCreditsPanel"
import { DailyRevenueDashboard } from "@/components/caisse/DailyRevenueDashboard"
import { UrgentPurchasesPanel } from "@/components/purchases/UrgentPurchasesPanel"
import { usePurchaseNotifications } from "@/lib/hooks/usePurchaseNotifications"
import { useCreditNotifications } from "@/lib/hooks/useCreditNotifications"
import { TablesToCashList } from "@/components/caisse/TablesToCashList"
import { ClientPreviewDialog } from "@/components/admin/ClientPreviewDialog"
import { resolveClientPreviewUrl } from "@/lib/admin/restaurant-tables"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PremiumStatCard, PremiumSection } from "@/components/ui/premium"
import { FadeIn } from "@/components/ui/motion-primitives"
import { useAuth } from "@/lib/context/AuthContext"
import { cn } from "@/lib/utils"

type DashboardPayload = {
  ok?: boolean
  date?: string
  summary?: Record<string, unknown>
  fiscal?: Record<string, unknown>
  alerts?: Array<{ code: string; severity: string; message: string }>
  closing?: Record<string, unknown> | null
  disabled?: boolean
}

export default function CaisseModulePage() {
  const searchParams = useSearchParams()
  const allowedTabs = useMemo(
    () =>
      [
        "vue",
        "encaisser",
        "factures",
        "tables",
        "externes",
        "evenements",
        "mouvements",
        "credits",
        "revenus",
        "cloture",
      ] as const,
    [],
  )
  const [mainTab, setMainTab] = useState<string>("vue")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [sortieRefresh, setSortieRefresh] = useState(0)
  const [tables, setTables] = useState<
    Array<{
      table_id?: number
      table_number?: number
      table_code?: string | null
      display_name?: string | null
      is_active?: boolean
      zone?: string
      restaurant_status?: string
      payment_stage?: string
      payment_status_label?: string
      payment_status_code?: string
      has_payment_request_alert?: boolean
      payment_request_count?: number
      payment_request_latest_at?: string | null
      has_cashier_call_alert?: boolean
      cashier_call_count?: number
      cashier_call_latest_at?: string | null
      merged_count?: number
      merged_from_table_ids?: number[]
      guests_or_sessions_count?: number
      session?: {
        id?: string
        total?: number
        total_original?: number
        paid_amount?: number
        remaining_amount?: number
        discount_amount?: number
        hospitality_amount?: number
        cancelled_amount?: number
      } | null
    }>
  >([])
  const [lastRequestBadgeCount, setLastRequestBadgeCount] = useState(0)
  /**
   * Focus latéral courant.
   *  - `session` : la session ouverte si la table est occupée (sinon null).
   *  - `table`   : la fiche table elle-même (utile pour afficher l'état d'une table libre).
   */
  const [focusedTable, setFocusedTable] = useState<{
    table_number: number
    session_id: string | null
    table: {
      table_id?: number
      table_number?: number
      zone?: string
      display_name?: string | null
      table_code?: string | null
      payment_status_label?: string
      payment_status_code?: string
      restaurant_status?: string
    } | null
  } | null>(null)
  const [closing, setClosing] = useState({
    physical: "",
    declared: "",
    comment: "",
  })
  const { user } = useAuth()

  // Pousse les digests « achats à prévoir » dans le centre de notifications
  // (CASHIER + ADMIN). La déduplication serveur empêche le spam.
  usePurchaseNotifications()
  useCreditNotifications()

  const loadDashboard = useCallback(async () => {
    const res = await fetch(`/api/caisse/dashboard?date=${encodeURIComponent(date)}`)
    const j = (await res.json()) as DashboardPayload
    setData(j)
  }, [date])

  const loadTables = useCallback(async () => {
    const res = await fetch("/api/caisse/tables-overview")
    if (!res.ok) return
    const j = await res.json()
    setTables(Array.isArray(j.tables) ? j.tables : [])
  }, [])

  useEffect(() => {
    void loadDashboard()
    void loadTables()
  }, [loadDashboard, loadTables])

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadTables()
    }, 8000)
    return () => window.clearInterval(id)
  }, [loadTables])

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && (allowedTabs as readonly string[]).includes(tab)) setMainTab(tab)
  }, [searchParams, allowedTabs])

  useEffect(() => {
    const tn = searchParams.get("table")
    if (!tn || !tables.length) return
    const num = Number(tn)
    if (!Number.isFinite(num)) return
    const row = tables.find((t) => Number(t.table_number) === num)
    if (row) {
      setFocusedTable({
        table_number: num,
        session_id: row.session?.id ? String(row.session.id) : null,
        table: {
          table_id: row.table_id,
          table_number: row.table_number,
          zone: row.zone,
          display_name: row.display_name,
          table_code: row.table_code,
          payment_status_label: row.payment_status_label,
          payment_status_code: row.payment_status_code,
          restaurant_status: row.restaurant_status,
        },
      })
    }
  }, [searchParams, tables])

  const requestAlertsCount = useMemo(
    () => tables.reduce((sum, t) => sum + Number(t.payment_request_count ?? 0), 0),
    [tables],
  )
  const cashierCallCount = useMemo(
    () => tables.reduce((sum, t) => sum + Number(t.cashier_call_count ?? 0), 0),
    [tables],
  )
  const totalCashierAlerts = requestAlertsCount + cashierCallCount

  useEffect(() => {
    if (totalCashierAlerts <= lastRequestBadgeCount) return
    setLastRequestBadgeCount(totalCashierAlerts)
    try {
      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = 880
      gain.gain.value = 0.06
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch {
      // Ignore audio API failures.
    }
  }, [totalCashierAlerts, lastRequestBadgeCount])

  const summary = data?.summary ?? {}
  const fiscal = data?.fiscal ?? {}

  const submitClosing = async () => {
    const phy = Number(String(closing.physical).replace(",", "."))
    const decl = Number(String(closing.declared).replace(",", "."))
    if (!Number.isFinite(phy) || !Number.isFinite(decl)) return
    const res = await fetch("/api/caisse/closing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_date: date,
        cash_counted_physical: phy,
        cash_declared_official: decl,
        declaration_comment: closing.comment.trim() || null,
      }),
    })
    if (res.ok) {
      await loadDashboard()
      setClosing({ physical: "", declared: "", comment: "" })
    }
  }

  const isAdminLike = user?.role === "ADMIN"

  return (
    <RequireAuth roles={["ADMIN", "CASHIER"]}>
      <StaffWorkspaceShell title="Caisse" subtitle="Vue journée, tables et encaissements">
        <PageShell className="min-h-screen bg-[color:var(--lux-cream)] dark:bg-neutral-950">
        <SiteHeader
          hideMainNav
          backHref="/admin"
          backLabel="Admin"
          trailing={
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1">
                <Link href="/pos">
                  <Wallet className="h-4 w-4" /> POS
                </Link>
              </Button>
              {isAdminLike ? (
                <Button asChild size="sm" variant="outline" className="gap-1">
                  <Link href="/admin/taxes">
                    <Building2 className="h-4 w-4" /> Taxes
                  </Link>
                </Button>
              ) : null}
            </div>
          }
        />

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              Gestion de caisse intelligente
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Synthèse des encaissements, TVA suivie hors espèces (configurable admin), journaux et clôture.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <Label className="text-xs text-neutral-500">Date</Label>
                <Input
                  type="date"
                  className="h-9 max-w-[12rem]"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onBlur={() => loadDashboard()}
                />
              </div>
              <SortieCaisseDialog
                businessDate={date}
                onRecorded={() => {
                  void loadDashboard()
                  setSortieRefresh((x) => x + 1)
                }}
              />
              <Button type="button" size="sm" variant="secondary" className="h-9" onClick={() => loadDashboard()}>
                Actualiser
              </Button>
            </div>
          </div>

          {data?.disabled ? (
            <Card className="border-amber-200 bg-amber-50/70 dark:bg-amber-950/40">
              <CardContent className="flex items-center gap-2 py-4 text-sm text-amber-900 dark:text-amber-100">
                <Receipt className="h-5 w-5 shrink-0" />
                Connectez Supabase pour activer le pilotage financier temps réel.
              </CardContent>
            </Card>
          ) : null}

          <Tabs value={mainTab} onValueChange={setMainTab}>
            <TabsList className="flex flex-wrap gap-1">
              <TabsTrigger value="vue" className="gap-1">
                <LayoutDashboard className="h-3.5 w-3.5" /> Synthèse
              </TabsTrigger>
              <TabsTrigger value="encaisser" className="gap-1">
                <Receipt className="h-3.5 w-3.5" /> À encaisser
              </TabsTrigger>
              <TabsTrigger value="factures" className="gap-1">
                <Receipt className="h-3.5 w-3.5" /> Factures &amp; paiements
              </TabsTrigger>
              <TabsTrigger value="tables" className="gap-1">
                <Table2 className="h-3.5 w-3.5" /> Tables
              </TabsTrigger>
              <TabsTrigger value="externes" className="gap-1">
                <Truck className="h-3.5 w-3.5" /> Externes
              </TabsTrigger>
              <TabsTrigger value="evenements" className="gap-1">
                <Ticket className="h-3.5 w-3.5" /> Événements
              </TabsTrigger>
              <TabsTrigger value="mouvements" className="gap-1">
                <Banknote className="h-3.5 w-3.5" /> Sorties
              </TabsTrigger>
              <TabsTrigger value="credits" className="gap-1">
                <PiggyBank className="h-3.5 w-3.5" /> Crédits clients
              </TabsTrigger>
              <TabsTrigger value="revenus" className="gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Revenus stations
              </TabsTrigger>
              <TabsTrigger value="cloture" className="gap-1">
                <Lock className="h-3.5 w-3.5" /> Clôture jour
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vue" className="mt-4 space-y-5">
              <TablesToCashList
                tables={tables}
                limit={6}
                onSeeAll={() => setMainTab("tables")}
                onOpenTable={(t) =>
                  setFocusedTable({
                    table_number: Number(t.table_number ?? 0),
                    session_id: t.session?.id ? String(t.session.id) : null,
                    table: {
                      table_id: t.table_id,
                      table_number: t.table_number,
                      zone: t.zone,
                      display_name: t.display_name,
                      table_code: t.table_code,
                      payment_status_label: t.payment_status_label,
                      payment_status_code: t.payment_status_code,
                      restaurant_status: t.restaurant_status ?? undefined,
                    },
                  })
                }
              />

              <PremiumSection
                title="Synthèse du jour"
                description="Encaissements, mouvements et entrées externes — mis à jour en temps réel."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <PremiumStatCard
                    label="Ventes (paiements jour)"
                    value={Number(summary.totalSalesToday ?? 0)}
                    suffix=" €"
                    decimals={2}
                    accent="bordeaux"
                    icon={ArrowLeftRight}
                  />
                  <PremiumStatCard
                    label="Cash encaissé"
                    value={Number(summary.cashPaid ?? 0)}
                    suffix=" €"
                    decimals={2}
                    accent="gold"
                    icon={Banknote}
                  />
                  <PremiumStatCard
                    label="Carte + online"
                    value={Number((summary.cardAndElectronic ?? summary.cardPaid) ?? 0)}
                    suffix=" €"
                    decimals={2}
                    accent="indigo"
                    icon={Wallet}
                  />
                  <PremiumStatCard
                    label="Sorties caisse jour"
                    value={Number(summary.sortiesCaisse ?? 0)}
                    suffix=" €"
                    decimals={2}
                    accent="rose"
                    icon={TrendingDown}
                  />
                  <PremiumStatCard
                    label="Avances employés"
                    value={Number(summary.employeeAdvances ?? 0)}
                    suffix=" €"
                    decimals={2}
                    accent="amber"
                    icon={Receipt}
                  />
                  <PremiumStatCard
                    label="Entrées externes (plateformes)"
                    value={Number(summary.externalIncomesTotal ?? 0)}
                    suffix=" €"
                    decimals={2}
                    accent="emerald"
                    icon={Truck}
                  />
                  <PremiumStatCard
                    label="Crédits clients ouverts"
                    value={Number((summary as { creditTotalRemaining?: number }).creditTotalRemaining ?? 0)}
                    suffix=" €"
                    decimals={2}
                    accent="rose"
                    icon={PiggyBank}
                    onClick={() => setMainTab("credits")}
                  />
                </div>
              </PremiumSection>

              <FadeIn>
                <ExternalBreakdownCard
                  bySource={(summary as { externalBySource?: Record<string, number> }).externalBySource ?? {}}
                  byMethod={(summary as { externalByMethod?: Record<string, number> }).externalByMethod ?? {}}
                  cashPart={Number((summary as { externalCashIncome?: number }).externalCashIncome ?? 0)}
                  nonCashPart={Number((summary as { externalNonCashIncome?: number }).externalNonCashIncome ?? 0)}
                  total={Number(summary.externalIncomesTotal ?? 0)}
                />
              </FadeIn>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricBox
                  label="Caisse théorique (après mouvements)"
                  value={`${nf(summary.expectedCashDrawerAfterMovements as number)} €`}
                  icon={Banknote}
                />
                <MetricBox
                  label="Écart clôture (compté − attendu)"
                  value={
                    summary.cashGapAtClosing === null || summary.cashGapAtClosing === undefined
                      ? "—"
                      : `${nf(summary.cashGapAtClosing)} €`
                  }
                  icon={AlertTriangle}
                />
                <MetricBox
                  label="Journée clôturée ?"
                  value={(summary.closingLocked as boolean) ? "Oui" : "Non"}
                  icon={Lock}
                />
                <MetricBox
                  label="Total factures (lignes jour)"
                  value={String(summary.invoicesTotalCount ?? "—")}
                  icon={Receipt}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base">Factures journée</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Brouillon: <strong>{(summary.invoicesCounts as { draft?: number })?.draft ?? "—"}</strong>
                    {" · "}Ouvert:
                    <strong> {(summary.invoicesCounts as { validated_open?: number })?.validated_open ?? "—"}</strong>
                    <br />
                    Payées:
                    <strong> {(summary.invoicesCounts as { paid?: number })?.paid ?? "—"}</strong>
                    {" · "}Annul.:
                    <strong> {(summary.invoicesCounts as { cancelled?: number })?.cancelled ?? "—"}</strong>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base">Estimation TVA (règle admin)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <span className="text-muted-foreground">
                      Hors espèces (fact.) : {""}
                      <strong>{nf((fiscal as { electronic_vat_from_invoices_eur?: number })?.electronic_vat_from_invoices_eur)} €</strong>
                      <br />
                      + cash déclaré si option : {""}
                      <strong>{nf((fiscal as { extra_declared_cash_tax_eur?: number })?.extra_declared_cash_tax_eur)} €</strong>
                    </span>
                    <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                      Total estimation : {""}
                      {nf((fiscal as { total_tax_due_estimate_eur?: number })?.total_tax_due_estimate_eur)} €
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Scope fiscal : {""}
                      {String((fiscal as { vat_scope?: string })?.vat_scope)}
                    </p>
                  </CardContent>
                </Card>

                <Card className={cn(!data?.closing && "opacity-90")}>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base">Dernière clôture (date)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {data?.closing ? (
                      <>
                        <p>Réel déclaré : {(data.closing as { cash_declared_official?: number }).cash_declared_official}</p>
                        <p>Interne résiduel : {(data.closing as { cash_internal_residual?: number }).cash_internal_residual}</p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Pas encore clôturée aujourd’hui.</span>
                    )}
                  </CardContent>
                </Card>
              </div>

              <UrgentPurchasesPanel />

              <div className="space-y-3">
                <SortiesJourTable date={date} refreshKey={sortieRefresh} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Alertes
                </div>
                <ul className="space-y-1 text-sm">
                  {(data?.alerts ?? []).map((a) => (
                    <li key={`${a.code}-${a.message}`} className="rounded-md border border-neutral-200/80 px-3 py-2 dark:border-neutral-800">
                      <span className="font-mono text-xs text-muted-foreground">{a.severity}</span> — {a.message}
                    </li>
                  ))}
                  {(data?.alerts ?? []).length === 0 ? (
                    <li className="text-muted-foreground">Aucune alerte automatique détectée.</li>
                  ) : null}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="encaisser" className="mt-4 space-y-4">
              <TablesToCashList
                tables={tables}
                onSeeAll={() => setMainTab("tables")}
                onOpenTable={(t) =>
                  setFocusedTable({
                    table_number: Number(t.table_number ?? 0),
                    session_id: t.session?.id ? String(t.session.id) : null,
                    table: {
                      table_id: t.table_id,
                      table_number: t.table_number,
                      zone: t.zone,
                      display_name: t.display_name,
                      table_code: t.table_code,
                      payment_status_label: t.payment_status_label,
                      payment_status_code: t.payment_status_code,
                      restaurant_status: t.restaurant_status ?? undefined,
                    },
                  })
                }
              />
            </TabsContent>

            <TabsContent value="factures" className="mt-4">
              <CaisseInvoicesPanel date={date} />
            </TabsContent>

            <TabsContent value="tables" className="mt-4 space-y-4">
              <TablesToCashList
                tables={tables}
                onOpenTable={(t) =>
                  setFocusedTable({
                    table_number: Number(t.table_number ?? 0),
                    session_id: t.session?.id ? String(t.session.id) : null,
                    table: {
                      table_id: t.table_id,
                      table_number: t.table_number,
                      zone: t.zone,
                      display_name: t.display_name,
                      table_code: t.table_code,
                      payment_status_label: t.payment_status_label,
                      payment_status_code: t.payment_status_code,
                      restaurant_status: t.restaurant_status ?? undefined,
                    },
                  })
                }
              />
              {requestAlertsCount > 0 || cashierCallCount > 0 ? (
                <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
                  <CardContent className="flex flex-col gap-1 py-3 text-sm font-medium text-amber-900 dark:text-amber-100">
                    {requestAlertsCount > 0 ? (
                      <div className="flex items-center gap-3">
                        <BellRing className="h-4 w-4 animate-pulse" />
                        {requestAlertsCount} demande{requestAlertsCount > 1 ? "s" : ""} d’addition en attente.
                      </div>
                    ) : null}
                    {cashierCallCount > 0 ? (
                      <div className="flex items-center gap-3">
                        <BellRing className="h-4 w-4 animate-pulse" />
                        {cashierCallCount} appel{cashierCallCount > 1 ? "s" : ""} caisse en attente.
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
              {tables.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">
                    Tables indisponibles (schéma `restaurant_tables` non chargé ou vide).
                  </CardContent>
                </Card>
              ) : (
                <CaisseFloorPlan
                  tables={tables}
                  isAdminLike={isAdminLike}
                  onOpenTable={(t) =>
                    setFocusedTable({
                      table_number: Number(t.table_number ?? 0),
                      session_id: t.session?.id ? String(t.session.id) : null,
                      table: {
                        table_id: t.table_id,
                        table_number: t.table_number,
                        zone: t.zone,
                        display_name: t.display_name,
                        table_code: t.table_code,
                        payment_status_label: t.payment_status_label,
                        payment_status_code: t.payment_status_code,
                        restaurant_status: t.restaurant_status ?? undefined,
                      },
                    })
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="externes" className="mt-4 space-y-4">
              <ExternalIncomePanel businessDate={date} />
            </TabsContent>

            <TabsContent value="evenements" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tickets événements (jour sélectionné)</CardTitle>
                </CardHeader>
                <CardContent>
                  <CaisseEventTicketsPanel date={date} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mouvements" className="mt-4 space-y-6">
              <CashRegisterMovementForm />
              <EmployeeAdvanceSnippet />
            </TabsContent>

            <TabsContent value="credits" className="mt-4">
              <ClientCreditsPanel />
            </TabsContent>

            <TabsContent value="revenus" className="mt-4">
              <DailyRevenueDashboard date={date} />
            </TabsContent>

            <TabsContent value="cloture" className="mt-4 max-w-xl space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-[color:var(--lux-gold-deep)]" />
                    Cash déclaré &amp; physique
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Espèces comptées (physique)</Label>
                      <Input
                        className="h-10"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={closing.physical}
                        onChange={(e) => setClosing((c) => ({ ...c, physical: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Espèces déclarées (officiel)</Label>
                      <Input
                        className="h-10"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={closing.declared}
                        onChange={(e) => setClosing((c) => ({ ...c, declared: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Commentaire (écart, incident)</Label>
                    <Textarea rows={3} value={closing.comment} onChange={(e) => setClosing((c) => ({ ...c, comment: e.target.value }))} />
                  </div>
                  <Button type="button" onClick={() => void submitClosing()}>
                    Valider et clôturer ({date})
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Une ligne immuable sera créée (pas de suppression utilisateur). L’interne résiduel = attendu système −
                    déclaré officiel. Les écarts physiques créent une alerte si volumineux.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Sheet
            open={focusedTable !== null}
            onOpenChange={(open) => {
              if (!open) setFocusedTable(null)
            }}
          >
            <SheetContent
              side="right"
              className="w-full overflow-y-auto p-0 sm:max-w-2xl"
            >
              {focusedTable ? (
                <>
                  <SheetHeader className="border-b px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <SheetTitle className="flex items-center gap-2 text-base">
                        <Receipt className="h-4 w-4 text-[color:var(--lux-bordeaux)]" />
                        Table {focusedTable.table_number}
                        {focusedTable.session_id ? " · session active" : " · libre"}
                      </SheetTitle>
                      {(() => {
                        const previewUrl = resolveClientPreviewUrl({
                          id: focusedTable.table?.table_id ?? null,
                          table_code: focusedTable.table?.table_code ?? null,
                          table_number: focusedTable.table_number ?? null,
                        })
                        return previewUrl ? (
                          <ClientPreviewDialog
                            url={previewUrl}
                            label={`Table ${focusedTable.table_number}`}
                            triggerLabel="Vue client"
                            variant="outline"
                            size="sm"
                          />
                        ) : null
                      })()}
                    </div>
                  </SheetHeader>
                  <div className="space-y-3 p-4">
                    {focusedTable.session_id ? (
                      <CaisseTableSessionPanel
                        sessionId={focusedTable.session_id}
                        tableNumber={focusedTable.table_number}
                        onRefreshParents={() => {
                          void loadTables()
                        }}
                      />
                    ) : (
                      <FreeTableDetailPanel table={focusedTable.table} />
                    )}
                  </div>
                </>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
        <SiteFooter />
      </PageShell>
      </StaffWorkspaceShell>
    </RequireAuth>
  )
}

function nf(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return "—"
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

function FreeTableDetailPanel({
  table,
}: {
  table: {
    table_id?: number
    table_number?: number
    zone?: string
    display_name?: string | null
    table_code?: string | null
    payment_status_label?: string
    payment_status_code?: string
    restaurant_status?: string
  } | null
}) {
  if (!table) return null
  return (
    <div className="space-y-3">
      <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CardContent className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border bg-white text-[color:var(--lux-bordeaux)] shadow-sm dark:bg-neutral-800">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Table
              </span>
              <span className="-mt-0.5 text-lg font-bold leading-none">{table.table_number}</span>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                {table.payment_status_label ?? "Libre"}
              </div>
              <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70">
                {table.zone ? `Zone ${table.zone}` : "Aucune zone"}
                {table.display_name ? ` · ${table.display_name}` : ""}
              </div>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
            Aucune session ouverte
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Informations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Row label="Numéro de table" value={`#${table.table_number ?? "—"}`} />
          {table.zone ? <Row label="Zone" value={table.zone} /> : null}
          {table.display_name ? <Row label="Nom affiché" value={table.display_name} /> : null}
          {table.table_code ? <Row label="Code QR" value={table.table_code} mono /> : null}
          {table.restaurant_status ? (
            <Row label="État (POS)" value={table.restaurant_status} />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Actions disponibles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="default" className="h-10 gap-1">
            <Link href={`/pos?table=${encodeURIComponent(String(table.table_number ?? ""))}`}>
              <Wallet className="h-4 w-4" /> Ouvrir sur le POS
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-10 gap-1">
            <Link href="/pos/tables">
              <Table2 className="h-4 w-4" /> Plan POS
            </Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-[11px] text-muted-foreground">
        La session de cette table sera créée automatiquement à la première commande prise sur le POS
        ou via le QR client.
      </p>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-dashed pb-1 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", mono && "font-mono text-xs")}>{value}</span>
    </div>
  )
}

function MetricBox({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  icon: ElementType
  accent?: string
}) {
  return (
    <Card className="border-neutral-200/80 dark:border-neutral-800">
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-10 w-10 shrink-0 rounded-lg bg-muted p-2" />
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className={cn("text-lg font-semibold", accent)}>{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

const EXTERNAL_SOURCE_LABELS: Record<string, { label: string; emoji: string }> = {
  lieferando: { label: "Lieferando", emoji: "🛵" },
  wolt: { label: "Wolt", emoji: "🟦" },
  uber_eats: { label: "Uber Eats", emoji: "🟢" },
  just_eat: { label: "Just Eat", emoji: "🟧" },
  glovo: { label: "Glovo", emoji: "🟡" },
  deliveroo: { label: "Deliveroo", emoji: "🟢" },
  bank_transfer: { label: "Virement bancaire", emoji: "🏦" },
  platform_payout: { label: "Versement plateforme", emoji: "💼" },
  other: { label: "Autre", emoji: "✨" },
}

const EXTERNAL_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Carte",
  online: "En ligne",
  bank_transfer: "Virement",
  platform_payout: "Payout",
}

function ExternalBreakdownCard({
  bySource,
  byMethod,
  cashPart,
  nonCashPart,
  total,
}: {
  bySource: Record<string, number>
  byMethod: Record<string, number>
  cashPart: number
  nonCashPart: number
  total: number
}) {
  const sources = Object.entries(bySource).sort((a, b) => b[1] - a[1])
  const methods = Object.entries(byMethod).sort((a, b) => b[1] - a[1])

  if (sources.length === 0 && total <= 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-3 text-xs text-muted-foreground">
          Aucune entrée externe enregistrée pour cette date. Allez sur l'onglet « Externes » pour saisir
          un payout Lieferando / Wolt / Uber Eats ou un virement bancaire.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">Plateformes externes (jour)</CardTitle>
        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
          Total : {nf(total)} €
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {sources.map(([src, amt]) => {
            const meta = EXTERNAL_SOURCE_LABELS[src] ?? EXTERNAL_SOURCE_LABELS.other
            return (
              <div
                key={src}
                className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm dark:bg-neutral-900/60"
              >
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <span aria-hidden>{meta.emoji}</span> {meta.label}
                </span>
                <span className="font-semibold">{nf(amt)} €</span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t pt-2 text-[11px] text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide text-neutral-500">
            Par mode :
          </span>
          {methods.map(([m, a]) => (
            <span
              key={m}
              className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 dark:bg-neutral-900"
            >
              {EXTERNAL_METHOD_LABELS[m] ?? m} <strong className="text-neutral-800 dark:text-neutral-100">{nf(a)} €</strong>
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-2">
            <span>Cash : <strong className="text-emerald-700 dark:text-emerald-300">{nf(cashPart)} €</strong></span>
            <span>Hors cash : <strong className="text-blue-700 dark:text-blue-300">{nf(nonCashPart)} €</strong></span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function EmployeeAdvanceSnippet() {
  const [staffId, setStaffId] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [list, setList] = useState<{ id?: string; position?: string; employee_label?: string }[]>([])

  useEffect(() => {
    void fetch("/api/caisse/staff-list")
      .then((r) => r.json())
      .then((j) => setList(Array.isArray(j.staff) ? j.staff : []))
      .catch(() => setList([]))
  }, [])

  const submit = async () => {
    const res = await fetch("/api/caisse/employee-advance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staffId,
        amount: Number(String(amount).replace(",", ".")),
        reason,
      }),
    })
    const j = await res.json().catch(() => ({}))
    window.alert(res.ok ? "Avance enregistrée." : j.error ?? "Erreur")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Avance salarié (sortie instantanée en caisse)</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Label className="text-xs">Collaborateur</Label>
          <select
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
          >
            <option value="">—</option>
            {list.map((s) => (
              <option key={String(s.id)} value={String(s.id)}>
                {String(s.employee_label ?? s.position ?? s.id).slice(0, 48)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Montant</Label>
          <Input className="h-10" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="sm:col-span-4">
          <Label className="text-xs">Raison</Label>
          <Input className="h-10" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="sm:col-span-4 flex justify-end">
          <Button type="button" variant="destructive" onClick={() => void submit()}>
            Enregistrer avance ({`sortie cash`})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
