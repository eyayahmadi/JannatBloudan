"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { OrderProductName } from "@/components/orders/OrderProductName"
import { toast } from "sonner"
import { FileDown, PiggyBank, Printer, Receipt, Trash2 } from "lucide-react"
import { CreditInvoiceDialog } from "@/components/caisse/CreditInvoiceDialog"
import {
  CREDIT_STATE_LABEL,
  normalizeCreditState,
  type CreditPaymentState,
} from "@/lib/credit/types"
import { invoiceAmountPaid, invoiceRemaining as invoiceRemainingAmount } from "@/lib/caisse/invoice-remaining"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { isOnlinePaymentProviderConfiguredClient } from "@/lib/payments/online-provider"
import { cn } from "@/lib/utils"

type Item = {
  id?: string
  product_name?: string
  product_name_ar?: string | null
  quantity?: number
  unit_price?: number
  line_status?: string | null
  subtotal?: number
}

type Inv = {
  id: string
  customer_id?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  session_id?: string | null
  guest_session_id?: string | null
  billing_type?: string | null
  hospitality_reason?: string | null
  revenue_exclude?: boolean | null
  gross_before_discount?: number | null
  offer_snapshot?: Record<string, unknown> | null
  discount_amount?: number | null
  subtotal?: number
  tva_amount?: number
  total?: number
  status?: string
  payment_stage?: string | null
  payment_method?: string | null
  payment_split?: Array<{ method?: string; amount?: number }> | null
  paid_at?: string | null
  cancel_reason?: string | null
  payment_state?: string | null
  credit_remaining?: number | null
  credit_paid?: number | null
  credit_due_at?: string | null
  invoice_items?: Item[]
}

type SplitMode = "amount" | "person" | "item"

const CREDIT_STATE_BADGE_CLS: Record<CreditPaymentState, string> = {
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100",
  UNPAID: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100",
  PARTIALLY_PAID: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-100",
  CREDIT: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100",
  OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-100",
}

export function CaisseInvoicesPanel(props: { date: string }) {
  const { date } = props
  const [list, setList] = useState<Inv[]>([])
  const [loading, setLoading] = useState(false)

  const [payTargets, setPayTargets] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [paySubmitting, setPaySubmitting] = useState(false)
  const onlineProviderReady = isOnlinePaymentProviderConfiguredClient()
  const [payMode, setPayMode] = useState<"single" | "split">("single")
  const [splitMode, setSplitMode] = useState<SplitMode>("amount")
  const [m1, setM1] = useState({ method: "cash", amount: "" })
  const [m2, setM2] = useState({ method: "card", amount: "" })

  const [cancelOpen, setCancelOpen] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [detail, setDetail] = useState<Inv | null>(null)
  const [hosOpen, setHosOpen] = useState<string | null>(null)
  const [hosReason, setHosReason] = useState("")
  const [offerOpen, setOfferOpen] = useState<string | null>(null)
  const [offerCode, setOfferCode] = useState("")
  const [offerNote, setOfferNote] = useState("")
  const [lineCancel, setLineCancel] = useState<{ itemId: string; invoiceId: string } | null>(null)
  const [lineCancelReason, setLineCancelReason] = useState("")
  const [lineOutcome, setLineOutcome] = useState<"cancel" | "waste">("cancel")
  const [creditOpen, setCreditOpen] = useState<Inv | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/caisse/invoices?date=${encodeURIComponent(date)}`)
      const j = (await res.json()) as { invoices?: Inv[]; error?: string }
      if (!res.ok) {
        toast.error(j.error ?? "Erreur factures")
        setList([])
        return
      }
      setList(j.invoices ?? [])
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    void load()
  }, [load])

  const totalFormat = useCallback((inv: Inv) => {
    const t = Number(inv.total ?? 0)
    const ht = Number(inv.subtotal ?? 0)
    const tv = Number(inv.tva_amount ?? 0)
    return { t, ht, tv }
  }, [])

  const invoiceRemaining = useCallback((inv: Inv) => invoiceRemainingAmount(inv), [])

  const isPayable = useCallback((inv: Inv) => {
    const st = String(inv.status ?? "").toLowerCase()
    return st === "draft" || st === "validated"
  }, [])

  const toggleSelected = useCallback((invoiceId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(invoiceId)
      else next.delete(invoiceId)
      return next
    })
  }, [])

  const buildPaymentParts = useCallback(
    (totalNeeded: number, inv?: Inv) => {
      const bill = String(inv?.billing_type ?? "normal").toLowerCase()
      const isHospitalityPay = bill === "hospitality" || bill === "complimentary"
      if (payMode === "single" && Math.abs(totalNeeded) < 0.05 && isHospitalityPay) {
        return [{ method: "hospitality", amount: 0 }]
      }
      if (payMode === "single") {
        return [
          {
            method: m1.method,
            amount: Number(String(m1.amount).replace(",", ".")),
          },
        ]
      }
      return [
        { method: m1.method, amount: Number(String(m1.amount).replace(",", ".")) },
        { method: m2.method, amount: Number(String(m2.amount).replace(",", ".")) },
      ]
    },
    [m1, m2, payMode],
  )

  const validatePay = async (invoiceId: string, totalNeeded: number) => {
    const inv = list.find((i) => i.id === invoiceId)
    const parts = buildPaymentParts(totalNeeded, inv)
    const sum = parts.reduce((s, p) => s + Number(p.amount ?? 0), 0)
    const bill = String(inv?.billing_type ?? "normal").toLowerCase()
    const isHospitalityPay = bill === "hospitality" || bill === "complimentary"
    const needMatch = !(isHospitalityPay && Math.abs(totalNeeded) < 0.05)

    if (needMatch && (!Number.isFinite(sum) || Math.abs(sum - totalNeeded) > 0.05)) {
      toast.error("La somme des paiements doit égaler le total TTC.")
      return
    }

    setPaySubmitting(true)
    try {
      const res = await fetch("/api/caisse/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId, payments: parts }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(typeof j?.error === "string" ? j.error : "Paiement refusé")
        return
      }
      toast.success("Paiement enregistré.")
      setPayTargets([])
      setSelectedIds(new Set())
      await load()
    } finally {
      setPaySubmitting(false)
    }
  }

  const buildBatchPaymentParts = useCallback((inv: Inv) => {
    const total = Number(inv.total ?? 0)
    const bill = String(inv.billing_type ?? "normal").toLowerCase()
    const isHospitalityPay = bill === "hospitality" || bill === "complimentary"
    if (isHospitalityPay && Math.abs(total) < 0.05) {
      return [{ method: "hospitality", amount: 0 }]
    }
    return [{ method: m1.method, amount: total }]
  }, [m1.method])

  const validateBatchPay = async (invoiceIds: string[]) => {
    const settlements = invoiceIds.map((id) => {
      const inv = list.find((i) => i.id === id)
      if (!inv) return null
      return { invoice_id: id, payments: buildBatchPaymentParts(inv) }
    }).filter((s): s is { invoice_id: string; payments: Array<{ method: string; amount: number }> } => s !== null)

    for (const s of settlements) {
      const inv = list.find((i) => i.id === s.invoice_id)
      const total = Number(inv?.total ?? 0)
      const sum = s.payments.reduce((acc, p) => acc + Number(p.amount ?? 0), 0)
      const bill = String(inv?.billing_type ?? "normal").toLowerCase()
      const isHospitalityPay = bill === "hospitality" || bill === "complimentary"
      const needMatch = !(isHospitalityPay && Math.abs(total) < 0.05)
      if (needMatch && (!Number.isFinite(sum) || Math.abs(sum - total) > 0.05)) {
        toast.error(`La somme des paiements doit égaler le total TTC pour ${s.invoice_id}.`)
        return
      }
    }

    setPaySubmitting(true)
    try {
      const res = await fetch("/api/caisse/batch-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlements }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(typeof j?.error === "string" ? j.error : "Paiement groupé refusé")
        return
      }
      toast.success(`${invoiceIds.length} factures encaissées.`)
      setPayTargets([])
      setSelectedIds(new Set())
      await load()
    } finally {
      setPaySubmitting(false)
    }
  }

  const verifyOnlinePayment = async (invoiceId: string) => {
    setPaySubmitting(true)
    try {
      const res = await fetch("/api/caisse/verify-online-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(typeof j?.error === "string" ? j.error : "Vérification impossible")
        return
      }
      toast.success(typeof j?.message === "string" ? j.message : "Vérification terminée.")
    } finally {
      setPaySubmitting(false)
    }
  }

  const openPayDialog = useCallback((ids: string[]) => {
    const first = list.find((i) => i.id === ids[0])
    if (!first) return
    setPayMode(ids.length > 1 ? "single" : "single")
    const bill = String(first.billing_type ?? "normal").toLowerCase()
    const t = Number(first.total ?? 0)
    const zeroHospitality = (bill === "hospitality" || bill === "complimentary") && Math.abs(t) < 0.05
    setM1({
      method: zeroHospitality ? "hospitality" : "cash",
      amount: t.toFixed(2).replace(".", ","),
    })
    setM2({ method: "card", amount: "" })
    setPayTargets(ids)
  }, [list])

  const requestPayment = async (invoiceId: string) => {
    const res = await fetch("/api/caisse/request-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_id: invoiceId }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(typeof j?.error === "string" ? j.error : "Erreur")
      return
    }
    toast.success("Statut mis à jour (paiement demandé).")
    await load()
  }

  const applyHospitality = async () => {
    const id = hosOpen
    if (!id || hosReason.trim().length < 3) return
    const res = await fetch("/api/caisse/invoice-hospitality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_id: id, reason: hosReason.trim(), billing_type: "hospitality" }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(typeof j?.error === "string" ? j.error : "Hospitalité impossible")
      return
    }
    toast.success("Offert maison — facture soldée (hospitality).")
    setHosOpen(null)
    setHosReason("")
    await load()
  }

  const applyOffer = async () => {
    const id = offerOpen
    if (!id || offerCode.trim().length < 1) return
    const res = await fetch("/api/caisse/invoice-apply-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_id: id,
        promo_code: offerCode.trim(),
        reason_note: offerNote.trim() || null,
      }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(typeof j?.error === "string" ? j.error : "Offre impossible")
      return
    }
    toast.success(`Offre appliquée — rabais ${Number(j.amount_saved ?? 0).toFixed(2)} €`)
    setOfferOpen(null)
    setOfferCode("")
    setOfferNote("")
    await load()
  }

  const cancelLine = async () => {
    if (!lineCancel || lineCancelReason.trim().length < 3) return
    const invIdCaptured = lineCancel.invoiceId
    const res = await fetch("/api/caisse/invoice-items/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_item_id: lineCancel.itemId,
        reason: lineCancelReason.trim(),
        outcome: lineOutcome === "waste" ? "waste" : "cancel",
      }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(typeof j?.error === "string" ? j.error : "Annulation ligne refusée")
      return
    }
    toast.success("Ligne annulée.")
    setLineCancel(null)
    setLineCancelReason("")
    await load()
    setDetail((d) =>
      d && d.id === invIdCaptured ? { ...d, ...(j.invoice as Inv), invoice_items: (j.invoice as Inv)?.invoice_items ?? d.invoice_items } : d,
    )
  }

  const cancelInv = async (invoiceId: string) => {
    if (cancelReason.trim().length < 3) return
    const res = await fetch("/api/caisse/cancel-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_id: invoiceId, reason: cancelReason }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(typeof j?.error === "string" ? j.error : "Annulation refusée")
      return
    }
    toast.success("Facture annulée.")
    setCancelOpen(null)
    setCancelReason("")
    await load()
  }

  const exportCsvHref = `/api/caisse/export?date=${encodeURIComponent(date)}`
  const paymentSummary = useMemo(() => {
    return list.reduce(
      (acc, inv) => {
        const paid = invoiceAmountPaid(inv)
        const total = Number(inv.total ?? 0)
        const stage = String(inv.payment_stage ?? "").toLowerCase()
        const method = String(inv.payment_method ?? "").toLowerCase()
        const discount = Number(inv.discount_amount ?? 0)
        const billType = String(inv.billing_type ?? "").toLowerCase()
        const cancelled = String(inv.status ?? "").toLowerCase() === "cancelled" ? total : 0
        acc.discounts += discount
        acc.cancelled += cancelled
        if (billType === "hospitality" || billType === "complimentary") acc.hospitality += total
        if (stage === "paid_cash" || method === "cash") acc.cash += paid
        else if (stage === "paid_card" || method === "card") acc.card += paid
        else if (stage === "paid_online" || method === "online") acc.online += paid
        acc.unpaid += invoiceRemaining(inv)
        return acc
      },
      { cash: 0, card: 0, online: 0, unpaid: 0, discounts: 0, hospitality: 0, cancelled: 0 },
    )
  }, [invoiceRemaining, list])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Factures du <strong>{date}</strong>. Encaissements via API sécurisée (paiement fractionné inclus).
        </p>
        <div className="flex gap-2">
          {selectedIds.size >= 2 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => openPayDialog(Array.from(selectedIds))}
            >
              Encaisser {selectedIds.size} factures
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" asChild className="gap-1">
            <a href={exportCsvHref}>
              <FileDown className="h-4 w-4" /> Excel (CSV)
            </a>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            Rafraîchir
          </Button>
          <Link
            href={`/api/caisse/reports?period=daily&date=${encodeURIComponent(date)}`}
            className="inline-flex items-center rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-muted"
            target="_blank"
          >
            Rapport JSON
          </Link>
        </div>
      </div>

      <div className="grid gap-2 rounded-lg border bg-muted/20 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div>Cash: <strong>{paymentSummary.cash.toFixed(2)} €</strong></div>
        <div>Carte: <strong>{paymentSummary.card.toFixed(2)} €</strong></div>
        <div>Online: <strong>{paymentSummary.online.toFixed(2)} €</strong></div>
        <div>Impayé: <strong>{paymentSummary.unpaid.toFixed(2)} €</strong></div>
        <div>Réductions: <strong>{paymentSummary.discounts.toFixed(2)} €</strong></div>
        <div>Offert/Hospitalité: <strong>{paymentSummary.hospitality.toFixed(2)} €</strong></div>
        <div>Annulé: <strong>{paymentSummary.cancelled.toFixed(2)} €</strong></div>
      </div>

      <ScrollArea className="h-[min(70vh,520px)] rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-950/60">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="p-2 w-8" />
              <th className="p-2 font-medium">N° facture</th>
              <th className="p-2 font-medium hidden sm:table-cell">Client</th>
              <th className="p-2 font-medium">HT</th>
              <th className="p-2 font-medium hidden md:table-cell">TVA</th>
              <th className="p-2 font-medium">TTC</th>
              <th className="p-2 font-medium">Statut</th>
              <th className="p-2 font-medium hidden lg:table-cell">Facturation</th>
              <th className="p-2 font-medium">Paiement</th>
              <th className="p-2 font-medium">Reste</th>
              <th className="p-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((inv) => {
              const { ht, tv, t } = totalFormat(inv)
              const st = String(inv.status ?? "").toLowerCase()
              const payable = isPayable(inv)
              return (
                <tr key={inv.id} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="p-2 align-middle">
                    {payable ? (
                      <Checkbox
                        checked={selectedIds.has(inv.id)}
                        onCheckedChange={(v) => toggleSelected(inv.id, v === true)}
                        aria-label={`Sélectionner ${inv.id}`}
                      />
                    ) : null}
                  </td>
                  <td className="p-2 font-mono">{inv.id}</td>
                  <td className="p-2 hidden sm:table-cell max-w-[140px] truncate">{inv.customer_name ?? "—"}</td>
                  <td className="p-2">{ht.toFixed(2)} €</td>
                  <td className="p-2 hidden md:table-cell">{tv.toFixed(2)} €</td>
                  <td className="p-2 font-semibold">{t.toFixed(2)} €</td>
                  <td className="p-2 capitalize">
                    {st}
                    {inv.payment_state && inv.payment_state !== "PAID" ? (
                      <span
                        className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          CREDIT_STATE_BADGE_CLS[normalizeCreditState(inv.payment_state)]
                        }`}
                      >
                        {CREDIT_STATE_LABEL[normalizeCreditState(inv.payment_state)]}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-2 text-xs hidden lg:table-cell">
                    <span className="rounded bg-muted px-1.5 py-0.5">
                      {billingLabel(inv.billing_type)} {inv.revenue_exclude ? "· hors CA" : ""}
                    </span>
                    {Number(inv.discount_amount ?? 0) > 0 ? (
                      <span className="ml-1 text-amber-700 dark:text-amber-300">
                        rabais −{Number(inv.discount_amount).toFixed(2)} €
                      </span>
                    ) : null}
                  </td>
                  <td className="p-2 text-xs">{inv.payment_stage ?? inv.payment_method ?? "—"}</td>
                  <td className="p-2 text-xs font-medium">{invoiceRemaining(inv).toFixed(2)} €</td>
                  <td className="p-2 text-right whitespace-nowrap">
                    <InvoiceRowActions
                      inv={inv}
                      onApplyOffer={() => setOfferOpen(inv.id)}
                      onHospitality={() => setHosOpen(inv.id)}
                      onCredit={() => setCreditOpen(inv)}
                      onPay={() => openPayDialog([inv.id])}
                      onRequest={() => void requestPayment(inv.id)}
                      onCancel={() => setCancelOpen(inv.id)}
                      onDetail={() => setDetail(inv)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollArea>

      {list.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground">
          Aucune facture sur cette date (vérifiez les commandes / POS qui génèrent la facture).
        </p>
      ) : null}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lignes — {detail?.id ?? ""}</DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="grid grid-cols-2 gap-2 rounded border bg-muted/20 p-2 text-xs">
              <div>Total original: <strong>{Number(detail.gross_before_discount ?? detail.total ?? 0).toFixed(2)} €</strong></div>
              <div>Total final: <strong>{Number(detail.total ?? 0).toFixed(2)} €</strong></div>
              <div>Déjà payé: <strong>{(Number(detail.total ?? 0) - invoiceRemaining(detail)).toFixed(2)} €</strong></div>
              <div>Reste: <strong>{invoiceRemaining(detail).toFixed(2)} €</strong></div>
              <div>Remise: <strong>{Number(detail.discount_amount ?? 0).toFixed(2)} €</strong></div>
              <div>Facturation: <strong>{billingLabel(detail.billing_type)}</strong></div>
            </div>
          ) : null}
          <ul className="space-y-1 text-sm">
            {(detail?.invoice_items ?? []).map((li) => {
              const ls = String(li.line_status ?? "").toLowerCase()
              return (
                <li key={String(li.id ?? li.product_name)} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 flex-1 items-start gap-2">
                    <OrderProductName
                      product_name={li.product_name}
                      product_name_ar={li.product_name_ar}
                      className="min-w-0"
                    />
                    <span className="shrink-0 text-muted-foreground">
                      × {li.quantity ?? 0} · {Number(li.unit_price ?? 0).toFixed(2)} € / u{" "}
                      <span className="text-muted-foreground">({ls || "ordered"})</span>
                    </span>
                  </span>
                  {li.id && ls !== "cancelled" && ls !== "waste" && ls !== "offered" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => li.id && setLineCancel({ itemId: String(li.id), invoiceId: detail?.id ?? "" })}
                    >
                      Annuler item
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" className="gap-1" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimer
            </Button>
            <Button type="button" variant="outline" className="gap-1" onClick={() => toast.info("Envoi facture PDF: connexion provider email à brancher.")}>
              <FileDown className="h-4 w-4" /> Envoyer facture PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payTargets.length > 0} onOpenChange={(o) => !o && !paySubmitting && setPayTargets([])}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {payTargets.length > 1
                ? `Encaisser ${payTargets.length} factures`
                : `Encaisser ${payTargets[0] ?? ""}`}
            </DialogTitle>
          </DialogHeader>
          {payTargets.length > 0
            ? (() => {
                const isBatch = payTargets.length > 1
                const inv = list.find((i) => i.id === payTargets[0])
                const tot = Number(inv?.total ?? 0)
                const batchTotal = payTargets.reduce((s, id) => {
                  const row = list.find((i) => i.id === id)
                  return s + Number(row?.total ?? 0)
                }, 0)
                return (
                  <div className="space-y-4">
                    {isBatch ? (
                      <p className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                        Paiement groupé — {payTargets.length} factures · total{" "}
                        <strong>{batchTotal.toFixed(2)} €</strong>
                        <span className="mt-1 block">{payTargets.join(", ")}</span>
                      </p>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={payMode === "single" ? "default" : "outline"}
                        onClick={() => setPayMode("single")}
                      >
                        Une méthode
                      </Button>
                      {!isBatch ? (
                        <Button
                          size="sm"
                          variant={payMode === "split" ? "default" : "outline"}
                          onClick={() => setPayMode("split")}
                        >
                          Split
                        </Button>
                      ) : null}
                    </div>
                    {payMode === "split" ? (
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Button size="sm" variant={splitMode === "person" ? "default" : "outline"} onClick={() => setSplitMode("person")}>
                          Split bill par personne
                        </Button>
                        <Button size="sm" variant={splitMode === "item" ? "default" : "outline"} onClick={() => setSplitMode("item")}>
                          Split bill par item
                        </Button>
                        <Button size="sm" variant={splitMode === "amount" ? "default" : "outline"} onClick={() => setSplitMode("amount")}>
                          Split bill par montant
                        </Button>
                      </div>
                    ) : null}
                    {payMode === "single" ? (
                      <div className={cn("grid gap-2", isBatch ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
                        <div>
                          <Label className="text-xs">Mode</Label>
                          <Select value={m1.method} onValueChange={(v) => setM1((m) => ({ ...m, method: v }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Espèces</SelectItem>
                              <SelectItem value="card">Carte</SelectItem>
                              <SelectItem value="online">En ligne</SelectItem>
                              <SelectItem value="hospitality">Hospitalité / offert (0 €)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {!isBatch ? (
                          <div>
                            <Label className="text-xs">Montant TTC</Label>
                            <Input value={m1.amount} onChange={(e) => setM1((m) => ({ ...m, amount: e.target.value }))} />
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Chaque facture sera encaissée pour son montant TTC avec ce mode de paiement.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        <p className="text-xs text-muted-foreground">
                          {splitMode === "person"
                            ? "Répartition par personne/session invité."
                            : splitMode === "item"
                              ? "Répartition par items (saisir les montants correspondants à chaque groupe d'items)."
                              : "Répartition libre par montant."}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={m1.method} onValueChange={(v) => setM1((m) => ({ ...m, method: v }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Espèces</SelectItem>
                              <SelectItem value="card">Carte</SelectItem>
                              <SelectItem value="online">En ligne</SelectItem>
                              <SelectItem value="hospitality">Hospitalité / offert (0 €)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Montant A"
                            value={m1.amount}
                            onChange={(e) => setM1((m) => ({ ...m, amount: e.target.value }))}
                          />
                          <Select value={m2.method} onValueChange={(v) => setM2((m) => ({ ...m, method: v }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Espèces</SelectItem>
                              <SelectItem value="card">Carte</SelectItem>
                              <SelectItem value="online">En ligne</SelectItem>
                              <SelectItem value="hospitality">Hospitalité / offert (0 €)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Montant B"
                            value={m2.amount}
                            onChange={(e) => setM2((m) => ({ ...m, amount: e.target.value }))}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Somme doit égaler total {tot.toFixed(2)} €</p>
                      </div>
                    )}
                    <DialogFooter>
                      {!isBatch && onlineProviderReady && m1.method === "online" ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={paySubmitting}
                          onClick={() => payTargets[0] && void verifyOnlinePayment(payTargets[0])}
                        >
                          Vérifier paiement online
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        disabled={paySubmitting}
                        onClick={() => {
                          if (isBatch) void validateBatchPay(payTargets)
                          else if (payTargets[0]) void validatePay(payTargets[0], tot)
                        }}
                      >
                        {paySubmitting
                          ? "Enregistrement…"
                          : isBatch
                            ? `Valider ${payTargets.length} paiements`
                            : m1.method === "cash"
                              ? "Valider paiement cash"
                              : m1.method === "card"
                                ? "Valider paiement carte"
                                : "Valider paiement"}
                      </Button>
                    </DialogFooter>
                  </div>
                )
              })()
            : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!hosOpen} onOpenChange={(o) => !o && setHosOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offert par la maison — {hosOpen}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Total remis à 0 €, lignes marquées « offert », encaissement hospitality. Raison audit obligatoire.
          </p>
          <Label className="text-xs">Raison</Label>
          <Textarea rows={3} value={hosReason} onChange={(e) => setHosReason(e.target.value)} />
          <DialogFooter>
            <Button type="button" onClick={() => void applyHospitality()}>
              Valider hospitalité
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!offerOpen} onOpenChange={(o) => !o && setOfferOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appliquer un code promo / offre — {offerOpen}</DialogTitle>
          </DialogHeader>
          <Label className="text-xs">Code promo (catalogue Admin)</Label>
          <Input value={offerCode} onChange={(e) => setOfferCode(e.target.value)} placeholder="WELCOME" />
          <Label className="text-xs">Note (optionnel)</Label>
          <Input value={offerNote} onChange={(e) => setOfferNote(e.target.value)} />
          <DialogFooter>
            <Button type="button" onClick={() => void applyOffer()}>
              Appliquer la remise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!lineCancel} onOpenChange={(o) => !o && setLineCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler une ligne article</DialogTitle>
          </DialogHeader>
          <Label className="text-xs">Raison audit</Label>
          <Input value={lineCancelReason} onChange={(e) => setLineCancelReason(e.target.value)} />
          <Label className="text-xs mt-2">Conséquence</Label>
          <Select
            value={lineOutcome}
            onValueChange={(v) => setLineOutcome(v === "waste" ? "waste" : "cancel")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cancel">Annulé avant préparation</SelectItem>
              <SelectItem value="waste">Gaspillage / perte (déjà préparé)</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button type="button" variant="destructive" onClick={() => void cancelLine()}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelOpen} onOpenChange={(o) => !o && setCancelOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-600" /> Annuler {cancelOpen}
            </DialogTitle>
          </DialogHeader>
          <Label className="text-xs">Raison obligatoire (audit)</Label>
          <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <DialogFooter>
            <Button type="button" variant="destructive" onClick={() => cancelOpen && cancelInv(cancelOpen)}>
              Confirmer annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreditInvoiceDialog
        open={creditOpen !== null}
        invoice={creditOpen}
        onClose={() => setCreditOpen(null)}
        onSuccess={() => {
          void load()
        }}
      />
    </div>
  )
}

function InvoiceRowActions({
  inv,
  onPay,
  onRequest,
  onCancel,
  onDetail,
  onHospitality,
  onApplyOffer,
  onCredit,
}: {
  inv: Inv
  onPay: () => void
  onRequest: () => void
  onCancel: () => void
  onDetail: () => void
  onHospitality: () => void
  onApplyOffer: () => void
  onCredit: () => void
}) {
  const st = String(inv.status ?? "").toLowerCase()
  const canPay = st === "draft" || st === "validated"
  const canCancel = st !== "cancelled" && st !== "refunded"
  const bill = String(inv.billing_type ?? "normal").toLowerCase()
  const showOffer = canPay && bill === "normal"
  const canCredit = canPay && bill === "normal"

  return (
    <div className="inline-flex flex-wrap gap-1 justify-end">
      <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs" onClick={onDetail}>
        Détail
      </Button>
      {showOffer ? (
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs" onClick={onApplyOffer}>
          Promo
        </Button>
      ) : null}
      {canPay && bill === "normal" ? (
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs text-violet-700" onClick={onHospitality}>
          Offrir
        </Button>
      ) : null}
      {canPay ? (
        <>
          <Button type="button" size="sm" variant="secondary" className="h-7 px-2 text-[10px] sm:text-xs" onClick={onPay}>
            Payer
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs" onClick={onRequest}>
            Demander paiement
          </Button>
        </>
      ) : null}
      {canCredit ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-[10px] text-violet-700 sm:text-xs"
          onClick={onCredit}
        >
          <PiggyBank className="mr-1 h-3 w-3" /> Crédit
        </Button>
      ) : null}
      {canCancel ? (
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-[10px] sm:text-xs text-rose-600" onClick={onCancel}>
          Annuler
        </Button>
      ) : null}
    </div>
  )
}

function billingLabel(b?: string | null) {
  const s = String(b ?? "normal").toLowerCase()
  if (s === "hospitality") return "Hospitalité"
  if (s === "complimentary") return "Complémentaire"
  return "Normale"
}

