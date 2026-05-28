"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Banknote, CreditCard, Globe, Wallet, AlertTriangle, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CREDIT_REASONS,
  CREDIT_REASON_LABEL,
  CREDIT_PAYMENT_METHODS,
  round2,
  type CreditPaymentMethod,
  type CreditReason,
} from "@/lib/credit/types"

const METHOD_ICONS: Record<CreditPaymentMethod, React.ComponentType<{ className?: string }>> = {
  cash: Banknote,
  card: CreditCard,
  online: Globe,
  bank_transfer: Wallet,
  wallet: Wallet,
  other: Wallet,
}

type Partial = { method: CreditPaymentMethod; amount: string }

export type CreditDialogProps = {
  invoice: {
    id: string
    total?: number | null
    customer_id?: string | null
    customer_name?: string | null
    customer_email?: string | null
    customer_phone?: string | null
  } | null
  open: boolean
  onClose: () => void
  /** Appelé après marquage crédit réussi avec la facture mise à jour. */
  onSuccess?: (result: { invoice: Record<string, unknown>; payment_state: string; remaining: number }) => void
}

export function CreditInvoiceDialog({ invoice, open, onClose, onSuccess }: CreditDialogProps) {
  const [partials, setPartials] = useState<Partial[]>([])
  const [reason, setReason] = useState<CreditReason>("trusted_regular")
  const [note, setNote] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setPartials([])
    setReason("trusted_regular")
    setNote("")
    const due = new Date()
    due.setDate(due.getDate() + 14)
    setDueAt(due.toISOString().slice(0, 10))
    setCustomerName(invoice?.customer_name ?? "")
    setCustomerEmail(invoice?.customer_email ?? "")
    setCustomerPhone(invoice?.customer_phone ?? "")
  }, [open, invoice])

  const total = Number(invoice?.total ?? 0)
  const sumPartial = useMemo(
    () => round2(partials.reduce((s, p) => s + Number(String(p.amount).replace(",", ".") || 0), 0)),
    [partials],
  )
  const remaining = round2(Math.max(0, total - sumPartial))
  const exceeds = sumPartial > total + 0.02

  const submit = async () => {
    if (!invoice) return
    if (exceeds) {
      toast.error(`Acompte (${sumPartial}) supérieur au total (${total})`)
      return
    }
    if (!reason) {
      toast.error("Indiquez une raison")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/caisse/credit/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: invoice.id,
          reason,
          note: note.trim() || null,
          due_at: dueAt || null,
          customer_id: invoice.customer_id ?? null,
          customer_name: customerName.trim() || null,
          customer_email: customerEmail.trim() || null,
          customer_phone: customerPhone.trim() || null,
          partial_payments: partials
            .map((p) => ({ method: p.method, amount: Number(String(p.amount).replace(",", ".") || 0) }))
            .filter((p) => Number.isFinite(p.amount) && p.amount > 0),
        }),
      })
      const j = await res.json()
      if (!res.ok) {
        toast.error(j.error ?? "Échec marquage crédit")
        return
      }
      toast.success(
        j.payment_state === "PAID"
          ? "Facture soldée"
          : `Crédit enregistré · reste ${Number(j.remaining ?? remaining).toFixed(2)} €`,
      )
      onSuccess?.({
        invoice: j.invoice,
        payment_state: String(j.payment_state ?? "CREDIT"),
        remaining: Number(j.remaining ?? remaining),
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Marquer en crédit (kridi)</DialogTitle>
          <DialogDescription>
            La facture restera ouverte avec un montant restant dû. Un rappel est envoyé à l’admin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
            <div className="font-medium">Facture {invoice?.id ?? "—"}</div>
            <div className="mt-1 text-xs">
              Total : <strong>{total.toFixed(2)} €</strong> · Restant après acompte :{" "}
              <strong>{remaining.toFixed(2)} €</strong>
            </div>
            {exceeds ? (
              <div className="mt-2 flex items-center gap-1 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5" /> Acompte supérieur au total
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Nom client</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Téléphone</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">E-mail (rappel)</Label>
              <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Raison</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as CreditReason)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREDIT_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {CREDIT_REASON_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Échéance (date)</Label>
              <Input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Acomptes encaissés maintenant</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1"
                onClick={() =>
                  setPartials((arr) => [...arr, { method: "cash", amount: "" }])
                }
              >
                <Plus className="h-3 w-3" /> Ajouter
              </Button>
            </div>
            {partials.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun acompte — facture intégralement en crédit.
              </p>
            ) : null}
            {partials.map((p, idx) => {
              const Icon = METHOD_ICONS[p.method]
              return (
                <div key={idx} className="flex items-center gap-2">
                  <Select
                    value={p.method}
                    onValueChange={(v) =>
                      setPartials((arr) => {
                        const next = [...arr]
                        next[idx] = { ...next[idx], method: v as CreditPaymentMethod }
                        return next
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDIT_PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <Input
                    inputMode="decimal"
                    placeholder="0,00"
                    value={p.amount}
                    onChange={(e) =>
                      setPartials((arr) => {
                        const next = [...arr]
                        next[idx] = { ...next[idx], amount: e.target.value }
                        return next
                      })
                    }
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setPartials((arr) => arr.filter((_, i) => i !== idx))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>

          <div>
            <Label className="text-xs">Note (optionnel)</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contexte, accord verbal, etc."
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={busy || exceeds}>
            {busy ? "Enregistrement…" : "Marquer en crédit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
