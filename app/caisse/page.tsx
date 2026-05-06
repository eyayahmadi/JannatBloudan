"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { ElementType } from "react"
import {
  ArrowLeftRight,
  Banknote,
  Building2,
  LayoutDashboard,
  Receipt,
  Table2,
  Wallet,
  AlertTriangle,
  Lock,
  TrendingDown,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
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
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [tables, setTables] = useState<{ table_number?: number; payment_stage?: string; session?: { total?: number } | null }[]>([])
  const [closing, setClosing] = useState({
    physical: "",
    declared: "",
    comment: "",
  })
  const { user } = useAuth()

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

  const tabDefault = useMemo(() => "vue", [])

  return (
    <RequireAuth roles={["ADMIN", "CASHIER"]}>
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

          <Tabs defaultValue={tabDefault}>
            <TabsList className="flex flex-wrap gap-1">
              <TabsTrigger value="vue" className="gap-1">
                <LayoutDashboard className="h-3.5 w-3.5" /> Synthèse
              </TabsTrigger>
              <TabsTrigger value="factures" className="gap-1">
                <Receipt className="h-3.5 w-3.5" /> Factures &amp; paiements
              </TabsTrigger>
              <TabsTrigger value="tables" className="gap-1">
                <Table2 className="h-3.5 w-3.5" /> Tables
              </TabsTrigger>
              <TabsTrigger value="mouvements" className="gap-1">
                <Banknote className="h-3.5 w-3.5" /> Sorties
              </TabsTrigger>
              <TabsTrigger value="cloture" className="gap-1">
                <Lock className="h-3.5 w-3.5" /> Clôture jour
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vue" className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricBox
                  label="Ventes (paiements jour)"
                  value={`${nf(summary.totalSalesToday as number)} €`}
                  icon={ArrowLeftRight}
                />
                <MetricBox label="Cash encaissé" value={`${nf(summary.cashPaid as number)} €`} icon={Banknote} />
                <MetricBox
                  label="Carte + online"
                  value={`${nf((summary.cardAndElectronic ?? summary.cardPaid) as number)} €`}
                  icon={Wallet}
                />
                <MetricBox
                  label="Sorties caisse jour"
                  value={`${nf(summary.sortiesCaisse as number)} €`}
                  accent="text-rose-600"
                  icon={TrendingDown}
                />
                <MetricBox
                  label="Avances employés"
                  value={`${nf(summary.employeeAdvances as number)} €`}
                  icon={Receipt}
                />
              </div>

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

            <TabsContent value="factures" className="mt-4">
              <CaisseInvoicesPanel date={date} />
            </TabsContent>

            <TabsContent value="tables" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Plan de salle — statut paiement</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tables.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Tables indisponibles (schéma `restaurant_tables` non chargé ou vide).
                    </p>
                  ) : (
                    tables.map((t) => (
                      <div
                        key={`${t.table_number}`}
                        className="rounded-lg border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70"
                      >
                        <div className="font-semibold">Table {String(t.table_number)}</div>
                        <div className="mt-2 text-xs text-muted-foreground">Statut</div>
                        <div className="text-sm capitalize">{String(t.payment_stage ?? "—")}</div>
                        {t.session ? (
                          <div className="mt-2 text-sm">
                            Total session : {""}
                            <strong>{nf(t.session.total)} €</strong>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">Pas de session ouverte.</p>
                        )}
                        <Button asChild variant="outline" size="sm" className="mt-3">
                          <Link href="/pos/tables">Ouvrir plan POS</Link>
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mouvements" className="mt-4 space-y-6">
              <CashRegisterMovementForm />
              <EmployeeAdvanceSnippet />
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
        </div>
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}

function nf(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return "—"
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
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

function EmployeeAdvanceSnippet() {
  const [staffId, setStaffId] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [list, setList] = useState<{ id?: string; position?: string }[]>([])

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
                {String(s.position ?? "?")} · {String(s.id ?? "").slice(0, 8)}…
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
