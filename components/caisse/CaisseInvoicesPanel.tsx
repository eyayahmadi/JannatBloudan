"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { FileDown, Printer, Receipt, Trash2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

type Item = {
  id?: string
  product_name?: string
  quantity?: number
  unit_price?: number
}

type Inv = {
  id: string
  customer_name?: string | null
  session_id?: string | null
  subtotal?: number
  tva_amount?: number
  total?: number
  status?: string
  payment_stage?: string | null
  payment_method?: string | null
  paid_at?: string | null
  cancel_reason?: string | null
  invoice_items?: Item[]
}

export function CaisseInvoicesPanel(props: { date: string }) {
  const { date } = props
  const [list, setList] = useState<Inv[]>([])
  const [loading, setLoading] = useState(false)

  const [payOpen, setPayOpen] = useState<string | null>(null)
  const [payMode, setPayMode] = useState<"single" | "split">("single")
  const [m1, setM1] = useState({ method: "cash", amount: "" })
  const [m2, setM2] = useState({ method: "card", amount: "" })

  const [cancelOpen, setCancelOpen] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [detail, setDetail] = useState<Inv | null>(null)

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

  const validatePay = async (invoiceId: string, totalNeeded: number) => {
    const body =
      payMode === "single"
        ? {
            invoice_id: invoiceId,
            method: m1.method,
            amount: Number(String(m1.amount).replace(",", ".")),
          }
        : {
            invoice_id: invoiceId,
            payments: [
              { method: m1.method, amount: Number(String(m1.amount).replace(",", ".")) },
              { method: m2.method, amount: Number(String(m2.amount).replace(",", ".")) },
            ],
          }

    const sum =
      payMode === "single"
        ? (body as { amount: number }).amount
        : (body as { payments: Array<{ amount: number }> }).payments.reduce((s, p) => s + p.amount, 0)

    if (!Number.isFinite(sum) || Math.abs(sum - totalNeeded) > 0.05) {
      toast.error("La somme des paiements doit égaler le total TTC.")
      return
    }

    const res = await fetch("/api/caisse/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(typeof j?.error === "string" ? j.error : "Paiement refusé")
      return
    }
    toast.success("Paiement enregistré.")
    setPayOpen(null)
    await load()
  }

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Factures du <strong>{date}</strong>. Encaissements via API sécurisée (paiement fractionné inclus).
        </p>
        <div className="flex gap-2">
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

      <ScrollArea className="h-[min(70vh,520px)] rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-950/60">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="p-2 font-medium">N° facture</th>
              <th className="p-2 font-medium hidden sm:table-cell">Client</th>
              <th className="p-2 font-medium">HT</th>
              <th className="p-2 font-medium hidden md:table-cell">TVA</th>
              <th className="p-2 font-medium">TTC</th>
              <th className="p-2 font-medium">Statut</th>
              <th className="p-2 font-medium">Paiement</th>
              <th className="p-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((inv) => {
              const { ht, tv, t } = totalFormat(inv)
              const st = String(inv.status ?? "").toLowerCase()
              return (
                <tr key={inv.id} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="p-2 font-mono">{inv.id}</td>
                  <td className="p-2 hidden sm:table-cell max-w-[140px] truncate">{inv.customer_name ?? "—"}</td>
                  <td className="p-2">{ht.toFixed(2)} €</td>
                  <td className="p-2 hidden md:table-cell">{tv.toFixed(2)} €</td>
                  <td className="p-2 font-semibold">{t.toFixed(2)} €</td>
                  <td className="p-2 capitalize">{st}</td>
                  <td className="p-2 text-xs">{inv.payment_stage ?? inv.payment_method ?? "—"}</td>
                  <td className="p-2 text-right whitespace-nowrap">
                    <InvoiceRowActions
                      inv={inv}
                      onPay={() => {
                        setPayMode("single")
                        setM1({ method: "cash", amount: t.toFixed(2).replace(".", ",") })
                        setM2({ method: "card", amount: "" })
                        setPayOpen(inv.id)
                      }}
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
          <ul className="space-y-1 text-sm">
            {(detail?.invoice_items ?? []).map((li) => (
              <li key={String(li.id ?? li.product_name)}>
                {li.product_name ?? "—"} × {li.quantity ?? 0} · {Number(li.unit_price ?? 0).toFixed(2)} € / u
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" className="gap-1" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Encaisser {payOpen}
            </DialogTitle>
          </DialogHeader>
          {payOpen
            ? (() => {
                const inv = list.find((i) => i.id === payOpen)
                const tot = Number(inv?.total ?? 0)
                return (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={payMode === "single" ? "default" : "outline"}
                        onClick={() => setPayMode("single")}
                      >
                        Une méthode
                      </Button>
                      <Button
                        size="sm"
                        variant={payMode === "split" ? "default" : "outline"}
                        onClick={() => setPayMode("split")}
                      >
                        Split
                      </Button>
                    </div>
                    {payMode === "single" ? (
                      <div className="grid gap-2 sm:grid-cols-2">
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
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Montant TTC</Label>
                          <Input value={m1.amount} onChange={(e) => setM1((m) => ({ ...m, amount: e.target.value }))} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={m1.method} onValueChange={(v) => setM1((m) => ({ ...m, method: v }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Espèces</SelectItem>
                              <SelectItem value="card">Carte</SelectItem>
                              <SelectItem value="online">En ligne</SelectItem>
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
                      <Button type="button" onClick={() => payOpen && validatePay(payOpen, tot)}>
                        Valider paiement
                      </Button>
                    </DialogFooter>
                  </div>
                )
              })()
            : null}
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
    </div>
  )
}

function InvoiceRowActions({
  inv,
  onPay,
  onRequest,
  onCancel,
  onDetail,
}: {
  inv: Inv
  onPay: () => void
  onRequest: () => void
  onCancel: () => void
  onDetail: () => void
}) {
  const st = String(inv.status ?? "").toLowerCase()
  const canPay = st === "draft" || st === "validated"
  const canReq = canPay
  const canCancel = st !== "cancelled" && st !== "refunded"

  return (
    <div className="inline-flex flex-wrap gap-1 justify-end">
      <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[10px] sm:text-xs" onClick={onDetail}>
        Détail
      </Button>
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
      {canCancel ? (
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-[10px] sm:text-xs text-rose-600" onClick={onCancel}>
          Annuler
        </Button>
      ) : null}
    </div>
  )
}

