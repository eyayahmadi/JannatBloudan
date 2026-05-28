"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertTriangle,
  BellRing,
  Banknote,
  CreditCard,
  Globe,
  Lock,
  PiggyBank,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CREDIT_PAYMENT_METHODS,
  CREDIT_STATE_LABEL,
  CREDIT_STATE_TONE,
  normalizeCreditState,
  type CreditPaymentMethod,
  type CreditPaymentState,
} from "@/lib/credit/types"
import { cn } from "@/lib/utils"

type ClientRow = {
  client_id: string
  client_name?: string | null
  client_email?: string | null
  open_invoices: number
  overdue_invoices: number
  total_debt_origin: number
  total_paid: number
  total_remaining: number
  last_payment_at?: string | null
  next_due_at?: string | null
  earliest_overdue_at?: string | null
  credit_limit?: number | null
  blocked?: boolean | null
}

type Aggregate = {
  total_remaining: number
  open_invoices: number
  overdue_invoices: number
  clients_count: number
}

type ClientDetail = {
  client?: { id?: string; email?: string; full_name?: string; phone?: string } | null
  summary?: ClientRow | null
  limit?: { credit_limit?: number; blocked?: boolean; reason?: string | null } | null
  invoices: Array<{
    id: string
    total: number
    credit_paid: number
    credit_remaining: number
    credit_due_at?: string | null
    credit_reason?: string | null
    credit_note?: string | null
    payment_state?: string | null
    status?: string | null
    created_at?: string | null
  }>
  payments: Array<{
    id: string
    invoice_id: string
    amount: number
    method: string
    note?: string | null
    recorded_at: string
  }>
  reminders: Array<{
    id: string
    invoice_id?: string | null
    channel: string
    message?: string | null
    sent_at: string
    success?: boolean
  }>
}

const TONE_BADGE: Record<CreditPaymentState, string> = {
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100",
  UNPAID: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100",
  PARTIALLY_PAID: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-100",
  CREDIT: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100",
  OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-100",
}

function eur(n: number | null | undefined) {
  return Number(n ?? 0).toFixed(2).replace(".", ",")
}

function dateLabel(s: string | null | undefined): string {
  if (!s) return "—"
  try {
    return new Date(s).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return s
  }
}

export function ClientCreditsPanel() {
  const [list, setList] = useState<ClientRow[]>([])
  const [aggregate, setAggregate] = useState<Aggregate>({
    total_remaining: 0,
    open_invoices: 0,
    overdue_invoices: 0,
    clients_count: 0,
  })
  const [filter, setFilter] = useState<"all" | "overdue">("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [openClient, setOpenClient] = useState<string | null>(null)
  const [detail, setDetail] = useState<ClientDetail | null>(null)
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState<CreditPaymentMethod>("cash")
  const [payNote, setPayNote] = useState("")
  const [reminderOpen, setReminderOpen] = useState<{
    invoiceId?: string
    clientId?: string
  } | null>(null)
  const [reminderMessage, setReminderMessage] = useState("")
  const [reminderChannel, setReminderChannel] = useState<
    "manual" | "email" | "sms" | "whatsapp" | "phone"
  >("manual")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === "overdue") params.set("overdue", "1")
      const res = await fetch(`/api/caisse/credit/clients?${params.toString()}`)
      const j = await res.json()
      if (!res.ok) {
        toast.error(j.error ?? "Erreur clients crédit")
        return
      }
      setList((j.clients ?? []) as ClientRow[])
      setAggregate((j.aggregate ?? aggregate) as Aggregate)
    } finally {
      setLoading(false)
    }
  }, [filter, aggregate])

  useEffect(() => {
    void load()
  }, [load])

  const loadDetail = useCallback(async (clientId: string) => {
    setDetail(null)
    const res = await fetch(`/api/caisse/credit/clients/${encodeURIComponent(clientId)}`)
    const j = await res.json()
    if (!res.ok) {
      toast.error(j.error ?? "Détail indisponible")
      return
    }
    setDetail(j as ClientDetail)
  }, [])

  useEffect(() => {
    if (openClient) void loadDetail(openClient)
  }, [openClient, loadDetail])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((r) => {
      return (
        (r.client_name ?? "").toLowerCase().includes(q) ||
        (r.client_email ?? "").toLowerCase().includes(q) ||
        r.client_id.toLowerCase().includes(q)
      )
    })
  }, [list, search])

  const submitPayment = async () => {
    if (!payInvoiceId) return
    const amount = Number(String(payAmount).replace(",", "."))
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Montant invalide")
      return
    }
    const res = await fetch("/api/caisse/credit/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_id: payInvoiceId,
        amount,
        method: payMethod,
        note: payNote.trim() || null,
      }),
    })
    const j = await res.json()
    if (!res.ok) {
      toast.error(j.error ?? "Encaissement refusé")
      return
    }
    toast.success(
      j.payment_state === "PAID"
        ? "Facture soldée"
        : `Paiement enregistré · reste ${Number(j.remaining ?? 0).toFixed(2)} €`,
    )
    setPayInvoiceId(null)
    setPayAmount("")
    setPayNote("")
    if (openClient) void loadDetail(openClient)
    void load()
  }

  const submitReminder = async () => {
    if (!reminderOpen) return
    const res = await fetch("/api/caisse/credit/remind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_id: reminderOpen.invoiceId ?? null,
        client_id: reminderOpen.clientId ?? null,
        channel: reminderChannel,
        message: reminderMessage.trim() || null,
      }),
    })
    const j = await res.json()
    if (!res.ok) {
      toast.error(j.error ?? "Rappel non enregistré")
      return
    }
    toast.success("Rappel enregistré")
    setReminderOpen(null)
    setReminderMessage("")
    if (openClient) void loadDetail(openClient)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total dette
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-violet-600" />
            <div className="text-xl font-semibold">{eur(aggregate.total_remaining)} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clients endettés
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <div className="text-xl font-semibold">{aggregate.clients_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Factures ouvertes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-600" />
            <div className="text-xl font-semibold">{aggregate.open_invoices}</div>
          </CardContent>
        </Card>
        <Card className={aggregate.overdue_invoices > 0 ? "border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/30" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              En retard
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            <div className="text-xl font-semibold">{aggregate.overdue_invoices}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Clients avec dette</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-44"
              />
              <Select value={filter} onValueChange={(v) => setFilter(v as "all" | "overdue")}>
                <SelectTrigger className="h-9 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="overdue">En retard uniquement</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {loading ? "Chargement…" : "Aucun client avec dette."}
            </p>
          ) : (
            <ScrollArea className="max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left">Client</th>
                    <th className="px-2 py-2 text-right">Factures</th>
                    <th className="px-2 py-2 text-right">Total dû</th>
                    <th className="px-2 py-2 text-right">Reste</th>
                    <th className="px-2 py-2 text-left">Échéance</th>
                    <th className="px-2 py-2 text-right">Plafond</th>
                    <th className="px-2 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const limitExceeded =
                      (row.credit_limit ?? 0) > 0 &&
                      Number(row.total_remaining) > Number(row.credit_limit)
                    return (
                      <tr key={row.client_id} className="border-t">
                        <td className="px-2 py-2">
                          <div className="font-medium">
                            {row.client_name ?? row.client_email ?? row.client_id.slice(0, 8)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.client_email ?? "—"}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right">
                          {row.open_invoices}
                          {row.overdue_invoices > 0 ? (
                            <Badge variant="destructive" className="ml-1">
                              {row.overdue_invoices} retard
                            </Badge>
                          ) : null}
                        </td>
                        <td className="px-2 py-2 text-right">{eur(row.total_debt_origin)} €</td>
                        <td className="px-2 py-2 text-right font-semibold">
                          {eur(row.total_remaining)} €
                        </td>
                        <td className="px-2 py-2 text-left text-xs text-muted-foreground">
                          {row.earliest_overdue_at ? (
                            <span className="font-medium text-rose-600">
                              Échue · {dateLabel(row.earliest_overdue_at)}
                            </span>
                          ) : (
                            dateLabel(row.next_due_at)
                          )}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {(row.credit_limit ?? 0) > 0 ? `${eur(row.credit_limit)} €` : "—"}
                          {limitExceeded ? (
                            <Badge variant="destructive" className="ml-1">
                              dépassé
                            </Badge>
                          ) : null}
                          {row.blocked ? (
                            <Badge variant="destructive" className="ml-1 gap-1">
                              <Lock className="h-3 w-3" /> bloqué
                            </Badge>
                          ) : null}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setOpenClient(row.client_id)}
                            >
                              Voir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setReminderOpen({ clientId: row.client_id })
                              }
                            >
                              <BellRing className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog
        open={openClient !== null}
        onOpenChange={(o) => {
          if (!o) {
            setOpenClient(null)
            setDetail(null)
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {detail?.client?.full_name ?? detail?.client?.email ?? "Client"}
            </DialogTitle>
          </DialogHeader>
          {!detail ? (
            <p className="py-4 text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <Tabs defaultValue="invoices">
              <TabsList>
                <TabsTrigger value="invoices">Factures ({detail.invoices.length})</TabsTrigger>
                <TabsTrigger value="payments">
                  Historique paiements ({detail.payments.length})
                </TabsTrigger>
                <TabsTrigger value="reminders">
                  Rappels ({detail.reminders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invoices" className="mt-3 space-y-2">
                {detail.invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune facture ouverte.</p>
                ) : (
                  <ScrollArea className="max-h-[360px]">
                    {detail.invoices.map((inv) => {
                      const st = normalizeCreditState(inv.payment_state)
                      return (
                        <div
                          key={inv.id}
                          className="mb-2 rounded-md border bg-card p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <Link
                                href={`/admin/finance?invoice=${inv.id}`}
                                className="font-mono text-xs underline"
                              >
                                {inv.id}
                              </Link>
                              <Badge
                                className={cn(
                                  "ml-2",
                                  TONE_BADGE[st],
                                )}
                              >
                                {CREDIT_STATE_LABEL[st]}
                              </Badge>
                            </div>
                            <div className="text-sm">
                              Total : <strong>{eur(inv.total)} €</strong> · Payé :{" "}
                              <strong>{eur(inv.credit_paid)} €</strong> · Reste :{" "}
                              <strong>{eur(inv.credit_remaining)} €</strong>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Échéance : {dateLabel(inv.credit_due_at)}
                            {inv.credit_reason ? ` · Raison : ${inv.credit_reason}` : ""}
                            {inv.credit_note ? ` · Note : ${inv.credit_note}` : ""}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setPayInvoiceId(inv.id)
                                setPayAmount(eur(inv.credit_remaining).replace(",", "."))
                              }}
                            >
                              <Banknote className="mr-1 h-3 w-3" /> Encaisser
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReminderOpen({ invoiceId: inv.id })}
                            >
                              <BellRing className="mr-1 h-3 w-3" /> Rappel
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="payments" className="mt-3 space-y-2">
                {detail.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
                ) : (
                  <ScrollArea className="max-h-[360px]">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-2 py-2 text-left">Date</th>
                          <th className="px-2 py-2 text-left">Facture</th>
                          <th className="px-2 py-2 text-left">Méthode</th>
                          <th className="px-2 py-2 text-right">Montant</th>
                          <th className="px-2 py-2 text-left">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.payments.map((p) => (
                          <tr key={p.id} className="border-t">
                            <td className="px-2 py-2 text-xs">{dateLabel(p.recorded_at)}</td>
                            <td className="px-2 py-2 font-mono text-xs">{p.invoice_id}</td>
                            <td className="px-2 py-2">
                              <Badge variant="outline">{p.method}</Badge>
                            </td>
                            <td className="px-2 py-2 text-right">{eur(p.amount)} €</td>
                            <td className="px-2 py-2 text-xs text-muted-foreground">
                              {p.note ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="reminders" className="mt-3 space-y-2">
                {detail.reminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun rappel envoyé.</p>
                ) : (
                  detail.reminders.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-md border bg-card p-3 text-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{dateLabel(r.sent_at)}</span>
                        <Badge variant="outline">{r.channel}</Badge>
                      </div>
                      {r.message ? <div className="mt-1">{r.message}</div> : null}
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={payInvoiceId !== null} onOpenChange={(o) => (o ? null : setPayInvoiceId(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encaisser paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-xs">Facture</Label>
              <Input value={payInvoiceId ?? ""} readOnly className="font-mono" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Montant (€)</Label>
                <Input
                  inputMode="decimal"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Méthode</Label>
                <Select value={payMethod} onValueChange={(v) => setPayMethod(v as CreditPaymentMethod)}>
                  <SelectTrigger className="h-9">
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
              </div>
            </div>
            <div>
              <Label className="text-xs">Note</Label>
              <Textarea rows={2} value={payNote} onChange={(e) => setPayNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayInvoiceId(null)}>
              Annuler
            </Button>
            <Button onClick={() => void submitPayment()}>Encaisser</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder dialog */}
      <Dialog open={reminderOpen !== null} onOpenChange={(o) => (o ? null : setReminderOpen(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un rappel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-xs">Canal</Label>
              <Select
                value={reminderChannel}
                onValueChange={(v) =>
                  setReminderChannel(v as "manual" | "email" | "sms" | "whatsapp" | "phone")
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuel (en personne)</SelectItem>
                  <SelectItem value="phone">Téléphone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Message envoyé</Label>
              <Textarea
                rows={3}
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Bonjour, vous avez une facture en attente…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReminderOpen(null)}>
              Annuler
            </Button>
            <Button onClick={() => void submitReminder()}>Enregistrer rappel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
