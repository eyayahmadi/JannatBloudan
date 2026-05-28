"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Filter,
  Flame,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  TrendingUp,
  UserCheck,
  XCircle,
} from "lucide-react"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n/context"
import {
  PURCHASE_REASON_CODES,
  PURCHASE_STATUSES,
  PURCHASE_URGENCIES,
  REASON_META,
  STATUS_META,
  URGENCY_META,
  URGENCY_RANK,
  type PurchaseRecommendation,
  type PurchaseReasonCode,
  type PurchaseStatus,
  type PurchaseUrgency,
} from "@/lib/purchases/types"
import { cn } from "@/lib/utils"

type ListResponse = {
  recommendations: PurchaseRecommendation[]
  stats?: {
    open: number
    total: number
    byUrgency: Record<PurchaseUrgency, number>
    byStatus: Partial<Record<PurchaseStatus, number>>
    estimatedTotal: number
  }
}

type ReportsResponse = {
  total: number
  completed: number
  ignored: number
  cancelled: number
  estimated_total: number
  actual_total: number
  byUrgency: Record<string, number>
  topMissing: Array<{ name: string; count: number; estimated: number }>
}

const URGENCY_BADGE: Record<PurchaseUrgency, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-amber-600 text-white",
  MEDIUM: "bg-sky-600 text-white",
  LOW: "bg-slate-500 text-white",
}

const STATUS_BADGE: Record<PurchaseStatus, string> = {
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  validated: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  assigned: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  ordered: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  received: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  ignored: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
}

function formatCost(n: number | null | undefined): string {
  const v = Number(n ?? 0)
  return `${v.toFixed(2)} €`
}

function formatQty(qty: number | null | undefined, unit?: string | null): string {
  const v = Number(qty ?? 0)
  return `${v}${unit ? ` ${unit}` : ""}`
}

export default function AdminPurchasesPage() {
  const { t } = useI18n()
  const [list, setList] = useState<ListResponse | null>(null)
  const [reports, setReports] = useState<ReportsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState("")
  const [urgency, setUrgency] = useState<PurchaseUrgency | "ALL">("ALL")
  const [status, setStatus] = useState<PurchaseStatus | "ALL_OPEN" | "ALL">("ALL_OPEN")
  const [reason, setReason] = useState<PurchaseReasonCode | "ALL">("ALL")
  const [tab, setTab] = useState<"open" | "done" | "reports">("open")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [ignoreDialog, setIgnoreDialog] = useState<{ id: string; reason: string } | null>(null)
  const [buyDialog, setBuyDialog] = useState<
    | {
        id: string
        actual_cost: string
        receipt_url: string
        payment_method: "cash" | "card" | "bank_transfer" | "online"
        create_expense: boolean
      }
    | null
  >(null)
  const [manualOpen, setManualOpen] = useState(false)

  const fetchList = useCallback(async () => {
    const params = new URLSearchParams()
    if (status === "ALL_OPEN") params.set("only_open", "1")
    else if (status !== "ALL") params.set("status", status)
    if (urgency !== "ALL") params.set("urgency", urgency)
    if (reason !== "ALL") params.set("reason", reason)
    if (search.trim()) params.set("search", search.trim())
    try {
      const res = await fetch(`/api/admin/purchases/recommendations?${params.toString()}`)
      const data = (await res.json()) as ListResponse
      setList(data)
    } catch {
      setList({ recommendations: [] })
    }
  }, [search, status, urgency, reason])

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/purchases/reports")
      setReports((await res.json()) as ReportsResponse)
    } catch {
      setReports(null)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchList(), fetchReports()]).finally(() => setLoading(false))
  }, [fetchList, fetchReports])

  const filtered = useMemo(() => {
    const items = list?.recommendations ?? []
    if (tab === "open") return items.filter((r) => r.is_open)
    if (tab === "done")
      return items.filter((r) => !r.is_open).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    return items
  }, [list, tab])

  const stats = list?.stats
  const openCounts = stats?.byUrgency ?? { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }

  const onGenerate = useCallback(async () => {
    setGenerating(true)
    try {
      await fetch("/api/admin/purchases/recommendations/generate", { method: "POST" })
      await fetchList()
    } finally {
      setGenerating(false)
    }
  }, [fetchList])

  const callAction = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      setActionLoading(id)
      try {
        await fetch(`/api/admin/purchases/recommendations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        await fetchList()
        await fetchReports()
      } finally {
        setActionLoading(null)
      }
    },
    [fetchList, fetchReports],
  )

  const onCancel = useCallback(
    async (id: string) => {
      setActionLoading(id)
      try {
        await fetch(`/api/admin/purchases/recommendations/${id}`, { method: "DELETE" })
        await fetchList()
      } finally {
        setActionLoading(null)
      }
    },
    [fetchList],
  )

  return (
    <AdminPageFrame
      title={t("purchases.title", "Achats à prévoir")}
      subtitle={t(
        "purchases.subtitle",
        "Détection automatique des produits & ingrédients à racheter",
      )}
      trailing={
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setManualOpen(true)} variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t("purchases.action.addManual", "Ajouter manuellement")}
          </Button>
          <Button onClick={onGenerate} disabled={generating} size="sm" className="gap-1.5">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
            {generating
              ? t("purchases.generateRunning", "Analyse en cours…")
              : t("purchases.generate", "Détecter automatiquement")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShoppingBag}
          label={t("purchases.section.open", "À traiter")}
          value={String(stats?.open ?? 0)}
          tone="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200"
        />
        <StatCard
          icon={AlertTriangle}
          label={t("purchases.urgency.critical", "Critique")}
          value={String(openCounts.CRITICAL ?? 0)}
          tone="bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-200"
        />
        <StatCard
          icon={TrendingUp}
          label={t("purchases.urgency.high", "Élevée")}
          value={String(openCounts.HIGH ?? 0)}
          tone="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
        />
        <StatCard
          icon={Package}
          label={t("purchases.reports.estimatedTotal", "Coût estimé cumulé")}
          value={formatCost(stats?.estimatedTotal ?? 0)}
          tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
        />
      </div>

      <Card className="mt-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            {t("purchases.filter.search", "Rechercher un produit / fournisseur…")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("purchases.filter.search", "Rechercher…")}
              className="pl-8"
            />
          </div>
          <NativeSelect
            value={urgency}
            onChange={(v) => setUrgency(v as PurchaseUrgency | "ALL")}
            options={[
              { value: "ALL", label: t("purchases.filter.allUrgencies", "Toutes urgences") },
              ...PURCHASE_URGENCIES.map((u) => ({ value: u, label: t(URGENCY_META[u].i18nKey, u) })),
            ]}
          />
          <NativeSelect
            value={status}
            onChange={(v) => setStatus(v as PurchaseStatus | "ALL_OPEN" | "ALL")}
            options={[
              { value: "ALL_OPEN", label: t("purchases.filter.onlyOpen", "Seulement ouvertes") },
              { value: "ALL", label: t("purchases.filter.allStatuses", "Tous statuts") },
              ...PURCHASE_STATUSES.map((s) => ({
                value: s,
                label: t(STATUS_META[s].i18nKey, s),
              })),
            ]}
          />
          <NativeSelect
            value={reason}
            onChange={(v) => setReason(v as PurchaseReasonCode | "ALL")}
            options={[
              { value: "ALL", label: t("purchases.filter.allReasons", "Toutes raisons") },
              ...PURCHASE_REASON_CODES.map((r) => ({
                value: r,
                label: t(REASON_META[r].i18nKey, r),
              })),
            ]}
          />
          <Button onClick={() => fetchList()} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            {t("purchases.refresh", "Rafraîchir")}
          </Button>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-5">
        <TabsList>
          <TabsTrigger value="open" className="gap-1">
            <ClipboardList className="h-3.5 w-3.5" />
            {t("purchases.section.open", "À traiter")}
          </TabsTrigger>
          <TabsTrigger value="done" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("purchases.section.done", "Historique")}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            {t("purchases.section.reports", "Rapports")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading", "Chargement…")}
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <ShoppingBag className="h-5 w-5" />
                {t("purchases.empty", "Aucun achat à prévoir pour le moment.")}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {[...filtered]
                .sort((a, b) => URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency])
                .map((r) => (
                  <PurchaseCard
                    key={r.id}
                    reco={r}
                    t={t}
                    actionLoading={actionLoading === r.id}
                    onValidate={() => callAction(r.id, { action: "validate" })}
                    onAssign={() =>
                      callAction(r.id, {
                        action: "assign",
                        assigned_to: r.assigned_to ?? "self",
                      })
                    }
                    onIgnore={() => setIgnoreDialog({ id: r.id, reason: "" })}
                    onBuy={() =>
                      setBuyDialog({
                        id: r.id,
                        actual_cost: String(r.estimated_cost ?? 0),
                        receipt_url: "",
                        payment_method: "cash",
                        create_expense: true,
                      })
                    }
                    onMarkOrdered={() => callAction(r.id, { action: "ordered" })}
                    onCancel={() => onCancel(r.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="done" className="mt-4">
          <div className="grid gap-3">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  {t("purchases.empty", "Aucun achat à prévoir pour le moment.")}
                </CardContent>
              </Card>
            ) : (
              filtered.map((r) => (
                <PurchaseCard key={r.id} reco={r} t={t} readOnly />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <ReportsView reports={reports} t={t} />
        </TabsContent>
      </Tabs>

      {/* Ignore dialog */}
      <Dialog open={!!ignoreDialog} onOpenChange={(o) => !o && setIgnoreDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("purchases.dialog.ignoreTitle", "Ignorer cette recommandation ?")}</DialogTitle>
            <DialogDescription>
              {t(
                "purchases.dialog.ignoreDescription",
                "Indiquez la raison (optionnel). La reco sera retirée de la liste active.",
              )}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={ignoreDialog?.reason ?? ""}
            onChange={(e) =>
              setIgnoreDialog((prev) => (prev ? { ...prev, reason: e.target.value } : prev))
            }
            placeholder={t("purchases.field.reason", "Raison")}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIgnoreDialog(null)}>
              {t("common.cancel", "Annuler")}
            </Button>
            <Button
              onClick={async () => {
                if (!ignoreDialog) return
                const target = ignoreDialog
                setIgnoreDialog(null)
                await callAction(target.id, {
                  action: "ignore",
                  ignore_reason: target.reason || undefined,
                })
              }}
            >
              {t("purchases.action.ignore", "Ignorer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buy dialog */}
      <Dialog open={!!buyDialog} onOpenChange={(o) => !o && setBuyDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("purchases.dialog.buyTitle", "Marquer comme acheté")}</DialogTitle>
            <DialogDescription>
              {t(
                "purchases.dialog.buyDescription",
                "Renseigne le coût réel et le justificatif. Le stock sera mis à jour et une dépense sera créée si la case est cochée.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">{t("purchases.field.actualCost", "Coût réel")} (€)</Label>
              <Input
                inputMode="decimal"
                value={buyDialog?.actual_cost ?? ""}
                onChange={(e) =>
                  setBuyDialog((prev) => (prev ? { ...prev, actual_cost: e.target.value } : prev))
                }
              />
            </div>
            <div>
              <Label className="text-xs">{t("purchases.field.receipt", "Justificatif")} (URL)</Label>
              <Input
                value={buyDialog?.receipt_url ?? ""}
                onChange={(e) =>
                  setBuyDialog((prev) => (prev ? { ...prev, receipt_url: e.target.value } : prev))
                }
                placeholder="https://…"
              />
            </div>
            <div>
              <Label className="text-xs">{t("purchases.field.paymentMethod", "Mode de paiement")}</Label>
              <NativeSelect
                value={buyDialog?.payment_method ?? "cash"}
                onChange={(v) =>
                  setBuyDialog((prev) =>
                    prev ? { ...prev, payment_method: v as "cash" | "card" | "bank_transfer" | "online" } : prev,
                  )
                }
                options={[
                  { value: "cash", label: "Cash" },
                  { value: "card", label: "Carte" },
                  { value: "bank_transfer", label: "Virement" },
                  { value: "online", label: "En ligne" },
                ]}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={buyDialog?.create_expense ?? true}
                onChange={(e) =>
                  setBuyDialog((prev) =>
                    prev ? { ...prev, create_expense: e.target.checked } : prev,
                  )
                }
              />
              {t("purchases.field.createExpense", "Créer une dépense finance")}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialog(null)}>
              {t("common.cancel", "Annuler")}
            </Button>
            <Button
              onClick={async () => {
                if (!buyDialog) return
                const target = buyDialog
                const cost = Number(target.actual_cost.replace(",", "."))
                setBuyDialog(null)
                await callAction(target.id, {
                  action: "buy",
                  actual_cost: Number.isFinite(cost) ? cost : undefined,
                  receipt_url: target.receipt_url || undefined,
                  payment_method: target.payment_method,
                  create_expense: target.create_expense,
                })
              }}
            >
              {t("purchases.action.buy", "Marquer acheté")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManualPurchaseDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onCreated={() => {
          setManualOpen(false)
          void fetchList()
        }}
        t={t}
      />
    </AdminPageFrame>
  )
}

// -----------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className={cn("rounded-md p-2", tone)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full items-center rounded-md border border-input bg-background px-2 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function PurchaseCard({
  reco,
  t,
  readOnly,
  actionLoading,
  onValidate,
  onAssign,
  onIgnore,
  onBuy,
  onMarkOrdered,
  onCancel,
}: {
  reco: PurchaseRecommendation
  t: (key: string, def?: string) => string
  readOnly?: boolean
  actionLoading?: boolean
  onValidate?: () => void
  onAssign?: () => void
  onIgnore?: () => void
  onBuy?: () => void
  onMarkOrdered?: () => void
  onCancel?: () => void
}) {
  const name = reco.ingredient_name ?? reco.product_name ?? "—"
  const qty = formatQty(reco.suggested_qty, reco.effective_unit ?? reco.unit)
  const stock = reco.effective_current_stock ?? reco.current_stock ?? 0
  const threshold = reco.effective_threshold_low ?? reco.threshold_low ?? 0

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-3 p-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={URGENCY_BADGE[reco.urgency]}>
              {t(URGENCY_META[reco.urgency].i18nKey, reco.urgency)}
            </Badge>
            <Badge className={cn("border-0", STATUS_BADGE[reco.status])}>
              {t(STATUS_META[reco.status].i18nKey, reco.status)}
            </Badge>
            {reco.event_id ? (
              <Badge variant="outline" className="gap-1">
                <CalendarClock className="h-3 w-3" />
                {reco.event_label ?? "Event"}
                {reco.event_date ? ` · ${reco.event_date}` : ""}
              </Badge>
            ) : null}
            <span className="text-[11px] text-muted-foreground">
              {t(`purchases.reason.${camelize(reco.reason_code)}`, reco.reason_code)}
            </span>
          </div>
          <p className="text-base font-semibold">{name}</p>
          {reco.reason_detail ? (
            <p className="text-xs text-muted-foreground">{reco.reason_detail}</p>
          ) : null}
          {reco.notes ? (
            <p className="text-xs italic text-muted-foreground">{reco.notes}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5 text-xs">
          <Row label={t("purchases.field.currentStock", "Stock actuel")}>
            <span className={stock <= threshold ? "text-red-600 font-medium" : ""}>
              {stock} {reco.effective_unit ?? reco.unit ?? ""}
            </span>
          </Row>
          <Row label={t("purchases.field.threshold", "Seuil min.")}>
            {threshold} {reco.effective_unit ?? reco.unit ?? ""}
          </Row>
          <Row label={t("purchases.field.qty", "Quantité recommandée")}>
            <span className="font-medium">{qty}</span>
          </Row>
          <Row label={t("purchases.field.estimatedCost", "Coût estimé")}>
            <span className="font-medium">{formatCost(reco.estimated_cost)}</span>
          </Row>
          {reco.effective_supplier ? (
            <Row label={t("purchases.field.supplier", "Fournisseur")}>
              <span className="inline-flex items-center gap-1">
                <Store className="h-3 w-3" />
                {reco.effective_supplier}
              </span>
            </Row>
          ) : null}
          {reco.actual_cost ? (
            <Row label={t("purchases.field.actualCost", "Coût réel")}>
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                {formatCost(reco.actual_cost)}
              </span>
            </Row>
          ) : null}
        </div>

        {!readOnly ? (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {reco.status === "pending" ? (
              <Button size="sm" variant="outline" onClick={onValidate} disabled={actionLoading}>
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                {t("purchases.action.validate", "Valider le besoin")}
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={onAssign} disabled={actionLoading}>
              <UserCheck className="mr-1 h-3.5 w-3.5" />
              {t("purchases.action.assign", "Assigner")}
            </Button>
            {reco.status !== "ordered" ? (
              <Button size="sm" variant="outline" onClick={onMarkOrdered} disabled={actionLoading}>
                <ClipboardList className="mr-1 h-3.5 w-3.5" />
                {t("purchases.action.ordered", "Marquer commandé")}
              </Button>
            ) : null}
            <Button size="sm" onClick={onBuy} disabled={actionLoading} className="gap-1">
              <ShoppingBag className="h-3.5 w-3.5" />
              {t("purchases.action.buy", "Marquer acheté")}
            </Button>
            <Button size="sm" variant="ghost" onClick={onIgnore} disabled={actionLoading}>
              <XCircle className="mr-1 h-3.5 w-3.5" />
              {t("purchases.action.ignore", "Ignorer")}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground"
              onClick={onCancel}
              disabled={actionLoading}
              aria-label={t("purchases.action.cancel", "Annuler")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-end text-xs text-muted-foreground">
            {reco.bought_at
              ? new Date(reco.bought_at).toLocaleDateString()
              : reco.ignored_at
                ? new Date(reco.ignored_at).toLocaleDateString()
                : ""}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  )
}

function camelize(snake: string) {
  return snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function ReportsView({
  reports,
  t,
}: {
  reports: ReportsResponse | null
  t: (key: string, def?: string) => string
}) {
  if (!reports) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          {t("common.loading", "Chargement…")}
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReportTile label={t("purchases.reports.total", "Total recos")} value={reports.total} />
        <ReportTile
          label={t("purchases.reports.completed", "Achats effectués")}
          value={reports.completed}
        />
        <ReportTile label={t("purchases.reports.ignored", "Ignorées")} value={reports.ignored} />
        <ReportTile
          label={t("purchases.reports.cancelled", "Annulées")}
          value={reports.cancelled}
        />
        <ReportTile
          label={t("purchases.reports.estimatedTotal", "Coût estimé cumulé")}
          value={formatCost(reports.estimated_total)}
        />
        <ReportTile
          label={t("purchases.reports.actualTotal", "Coût réel cumulé")}
          value={formatCost(reports.actual_total)}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("purchases.reports.topMissing", "Produits les plus fréquemment manquants")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.topMissing.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.noData", "Aucune donnée")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {reports.topMissing.map((row) => (
                <li key={row.name} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate font-medium">{row.name}</span>
                  <span className="text-muted-foreground">
                    {row.count}× · {formatCost(row.estimated)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ReportTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function ManualPurchaseDialog({
  open,
  onOpenChange,
  onCreated,
  t,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
  t: (key: string, def?: string) => string
}) {
  const [ingredients, setIngredients] = useState<Array<{ id: string; name: string; unit?: string }>>([])
  const [ingredient_id, setIngredientId] = useState("")
  const [qty, setQty] = useState("")
  const [urgency, setUrgency] = useState<PurchaseUrgency>("MEDIUM")
  const [supplier, setSupplier] = useState("")
  const [deadline, setDeadline] = useState("")
  const [notes, setNotes] = useState("")
  const [estimatedCost, setEstimatedCost] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    void fetch("/api/admin/ingredients")
      .then((r) => r.json())
      .then((j) => setIngredients(Array.isArray(j.ingredients) ? j.ingredients : []))
      .catch(() => setIngredients([]))
  }, [open])

  const submit = useCallback(async () => {
    if (!ingredient_id) return
    const q = Number(qty.replace(",", "."))
    if (!Number.isFinite(q) || q <= 0) return
    setSubmitting(true)
    try {
      await fetch("/api/admin/purchases/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredient_id,
          suggested_qty: q,
          urgency,
          reason_code: "manual",
          supplier_name: supplier || undefined,
          deadline: deadline || undefined,
          notes: notes || undefined,
          estimated_cost: Number(estimatedCost.replace(",", ".")) || 0,
        }),
      })
      onCreated()
    } finally {
      setSubmitting(false)
    }
  }, [ingredient_id, qty, urgency, supplier, deadline, notes, estimatedCost, onCreated])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("purchases.dialog.manualTitle", "Ajouter un achat à prévoir")}</DialogTitle>
          <DialogDescription>
            {t(
              "purchases.dialog.manualDescription",
              "Ajoute manuellement un produit/ingrédient à acheter (utile pour un événement).",
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Ingrédient</Label>
            <select
              value={ingredient_id}
              onChange={(e) => setIngredientId(e.target.value)}
              className="flex h-9 w-full items-center rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">—</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.unit ? ` (${i.unit})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-xs">{t("purchases.field.qty", "Quantité")}</Label>
              <Input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">{t("purchases.field.estimatedCost", "Coût estimé")}</Label>
              <Input
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Urgence</Label>
              <NativeSelect
                value={urgency}
                onChange={(v) => setUrgency(v as PurchaseUrgency)}
                options={PURCHASE_URGENCIES.map((u) => ({
                  value: u,
                  label: t(URGENCY_META[u].i18nKey, u),
                }))}
              />
            </div>
            <div>
              <Label className="text-xs">{t("purchases.field.deadline", "Date butoir")}</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t("purchases.field.supplier", "Fournisseur")}</Label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">{t("purchases.field.notes", "Notes")}</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Annuler")}
          </Button>
          <Button onClick={() => void submit()} disabled={!ingredient_id || submitting}>
            {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            {t("common.save", "Enregistrer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
