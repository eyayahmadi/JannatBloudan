"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Banknote,
  Building2,
  CreditCard,
  Globe,
  Loader2,
  Lock,
  PackageCheck,
  Plus,
  Receipt,
  RefreshCcw,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CaisseMovementAttachmentUploader } from "@/components/caisse/CaisseMovementAttachmentUploader"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole } from "@/lib/auth/roles"
import { cn } from "@/lib/utils"

type Source =
  | "lieferando"
  | "wolt"
  | "uber_eats"
  | "just_eat"
  | "glovo"
  | "deliveroo"
  | "bank_transfer"
  | "platform_payout"
  | "other"

type Method = "cash" | "card" | "online" | "bank_transfer" | "platform_payout"

type IncomeRow = {
  id: string
  source: Source
  source_label: string | null
  amount: number
  currency: string
  payment_method: Method
  business_date: string
  reference_number: string | null
  note: string | null
  attachment_url: string | null
  created_at: string
}

const SOURCE_META: Record<Source, { label: string; emoji: string; color: string }> = {
  lieferando: { label: "Lieferando", emoji: "🛵", color: "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100" },
  wolt: { label: "Wolt", emoji: "🟦", color: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/40 dark:text-cyan-100" },
  uber_eats: { label: "Uber Eats", emoji: "🟢", color: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100" },
  just_eat: { label: "Just Eat", emoji: "🟧", color: "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100" },
  glovo: { label: "Glovo", emoji: "🟡", color: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100" },
  deliveroo: { label: "Deliveroo", emoji: "🟢", color: "bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-100" },
  bank_transfer: { label: "Virement bancaire", emoji: "🏦", color: "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100" },
  platform_payout: { label: "Versement plateforme", emoji: "💼", color: "bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100" },
  other: { label: "Autre", emoji: "✨", color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200" },
}

const METHOD_META: Record<Method, { label: string; icon: typeof Banknote }> = {
  cash: { label: "Cash (tiroir)", icon: Banknote },
  card: { label: "Carte", icon: CreditCard },
  online: { label: "En ligne", icon: Globe },
  bank_transfer: { label: "Virement bancaire", icon: Building2 },
  platform_payout: { label: "Versement plateforme", icon: PackageCheck },
}

function nf(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return "—"
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export function ExternalIncomePanel({ businessDate }: { businessDate: string }) {
  const { user } = useAuth()
  const role = user ? normalizeRole(user.role) : "CLIENT"
  const allowed = role === "ADMIN" || role === "CASHIER"

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" />
          Réservé caisse / administration
        </div>
        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
          La saisie d'entrées caisse externes (Lieferando, Wolt, Uber Eats, virements…) est limitée
          aux rôles ADMIN et CASHIER.
        </p>
      </div>
    )
  }

  return <ExternalIncomePanelInner businessDate={businessDate} />
}

function ExternalIncomePanelInner({ businessDate }: { businessDate: string }) {
  const [source, setSource] = useState<Source>("lieferando")
  const [sourceLabel, setSourceLabel] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<Method>("platform_payout")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [list, setList] = useState<IncomeRow[]>([])
  const [totals, setTotals] = useState<{
    all: number
    by_source: Record<string, number>
    by_method: Record<string, number>
  }>({ all: 0, by_source: {}, by_method: {} })
  const [reloading, setReloading] = useState(false)

  const reload = useCallback(async () => {
    setReloading(true)
    try {
      const res = await fetch(`/api/caisse/external-income?date=${encodeURIComponent(businessDate)}`)
      const j = await res.json().catch(() => ({}))
      setList(Array.isArray(j.incomes) ? (j.incomes as IncomeRow[]) : [])
      setTotals({
        all: Number(j?.totals?.all ?? 0),
        by_source: (j?.totals?.by_source as Record<string, number>) ?? {},
        by_method: (j?.totals?.by_method as Record<string, number>) ?? {},
      })
    } finally {
      setReloading(false)
    }
  }, [businessDate])

  useEffect(() => {
    void reload()
  }, [reload])

  const submit = useCallback(async () => {
    setMessage(null)
    const n = Number(String(amount).replace(",", "."))
    if (!Number.isFinite(n) || n <= 0) {
      setMessage("Montant invalide.")
      return
    }
    if (source === "other" && !sourceLabel.trim()) {
      setMessage("Précise un libellé pour la source « Autre ».")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/caisse/external-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          source_label: sourceLabel.trim() || undefined,
          amount: n,
          payment_method: method,
          business_date: businessDate,
          reference_number: reference.trim() || undefined,
          note: note.trim() || undefined,
          attachment_url: attachmentUrl.trim() || undefined,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(typeof j?.error === "string" ? j.error : "Erreur enregistrement")
        return
      }
      setMessage("Entrée enregistrée.")
      setAmount("")
      setReference("")
      setNote("")
      setSourceLabel("")
      setAttachmentUrl("")
      await reload()
    } catch {
      setMessage("Réseau ou serveur.")
    } finally {
      setLoading(false)
    }
  }, [amount, attachmentUrl, businessDate, method, note, reference, reload, source, sourceLabel])

  const sourceTotals = useMemo(() => {
    const entries = Object.entries(totals.by_source).sort((a, b) => b[1] - a[1])
    return entries
  }, [totals])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base">Entrée caisse externe</CardTitle>
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Truck className="h-3 w-3" /> Plateformes / virements
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v as Source)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_META).map(([k, m]) => (
                    <SelectItem key={k} value={k}>
                      <span className="flex items-center gap-2">
                        <span aria-hidden>{m.emoji}</span>
                        {m.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Montant (€)</Label>
              <Input
                inputMode="decimal"
                placeholder="0,00"
                className="h-9 text-sm"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Mode de réception</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METHOD_META).map(([k, m]) => {
                    const Icon = m.icon
                    return (
                      <SelectItem key={k} value={k}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {m.label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Date métier</Label>
              <Input
                value={businessDate}
                readOnly
                disabled
                className="h-9 text-sm text-muted-foreground"
              />
            </div>

            {source === "other" ? (
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Libellé source (obligatoire pour « Autre »)</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="Ex. partenariat hôtel X"
                  value={sourceLabel}
                  onChange={(e) => setSourceLabel(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Libellé / précision (optionnel)</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder={`Ex. payout ${SOURCE_META[source].label}`}
                  value={sourceLabel}
                  onChange={(e) => setSourceLabel(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Numéro de référence (virement, ID payout…)</Label>
              <Input
                className="h-9 text-sm"
                placeholder="REF-2025-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <div className="space-y-1 sm:col-span-2 lg:col-span-4">
              <Label className="text-xs">Note interne</Label>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Détails (période, lots, etc.)"
              />
            </div>

            <div className="space-y-1 sm:col-span-2 lg:col-span-4">
              <Label className="text-xs">Justificatif (capture, PDF…)</Label>
              <CaisseMovementAttachmentUploader
                value={attachmentUrl}
                onChange={setAttachmentUrl}
                allowPdf
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <p className={cn("text-xs", message ? "text-neutral-700 dark:text-neutral-300" : "text-muted-foreground")}>
              {message ??
                (method === "cash"
                  ? "Sera enregistrée en tiroir caisse + journal entrée externe."
                  : "Comptable uniquement (n'augmente pas le tiroir cash).")}
            </p>
            <Button type="button" onClick={() => void submit()} disabled={loading} className="gap-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Enregistrer l'entrée
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Totaux par source */}
      {sourceTotals.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">Totaux du jour ({businessDate})</CardTitle>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
              Total : {nf(totals.all)} €
            </span>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {sourceTotals.map(([src, total]) => {
              const meta = SOURCE_META[(src as Source) ?? "other"] ?? SOURCE_META.other
              return (
                <div
                  key={src}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm dark:bg-neutral-900/60",
                    "border-neutral-200 dark:border-neutral-800",
                  )}
                >
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.color)}>
                    <span aria-hidden>{meta.emoji}</span>
                    {meta.label}
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-50">{nf(total)} €</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Journal du jour */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base">Journal entrées externes</CardTitle>
          <Button type="button" size="sm" variant="ghost" className="gap-1" onClick={() => void reload()} disabled={reloading}>
            {reloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground">
              Aucune entrée externe enregistrée pour cette date.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/60">
              {list.map((row) => {
                const meta = SOURCE_META[row.source] ?? SOURCE_META.other
                const methodMeta = METHOD_META[row.payment_method]
                const Icon = methodMeta?.icon ?? Receipt
                return (
                  <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 px-3 py-2.5 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.color)}>
                        <span aria-hidden>{meta.emoji}</span>
                        {row.source_label || meta.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Icon className="h-3 w-3" /> {methodMeta?.label ?? row.payment_method}
                      </span>
                      {row.reference_number ? (
                        <span className="font-mono text-[10px] text-muted-foreground">réf. {row.reference_number}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {nf(row.amount)} {row.currency || "€"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(row.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {row.note || row.attachment_url ? (
                      <div className="basis-full text-[11px] text-muted-foreground">
                        {row.note ? <span>{row.note}</span> : null}
                        {row.attachment_url ? (
                          <>
                            {row.note ? " · " : null}
                            <a
                              href={row.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:text-foreground"
                            >
                              Justificatif
                            </a>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
