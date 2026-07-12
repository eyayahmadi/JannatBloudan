"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type SessionFinGuest = {
  guest_session_id: string | null
  label: string
  totalDue?: number
  total_due?: number
  paid: number
  remaining: number
  discount: number
  hospitalityValue?: number
  hospitality_value?: number
  payment_methods?: string[]
  flags: string[]
}

type SessionFinResponse = {
  ok: true
  table: {
    total_due_ttc: number
    paid_ttc: number
    unpaid_ttc: number
    discount_sum: number
    gross_before_discount_sum?: number
    hospitality_value_estimate: number
    cancelled_sum: number
  }
  guests: SessionFinGuest[]
}

export function CaisseTableSessionPanel(props: {
  sessionId: string
  tableNumber: number | string
  onRefreshParents: () => void
}) {
  const { sessionId, tableNumber, onRefreshParents } = props
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SessionFinResponse | null>(null)
  const [destTableId, setDestTableId] = useState("")
  const [xferReason, setXferReason] = useState("")
  const [guestLabel, setGuestLabel] = useState("")
  const [closeReason, setCloseReason] = useState("")
  const [closeResolution, setCloseResolution] = useState<"none" | "hospitality" | "cancelled" | "loss">("none")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/caisse/session-financials?session_id=${encodeURIComponent(sessionId)}`)
      const j = (await res.json()) as SessionFinResponse | { error?: string }
      if (!res.ok) {
        toast.error(typeof (j as { error?: string }).error === "string" ? (j as { error: string }).error : "Syn. impossible")
        setData(null)
        return
      }
      setData(j as SessionFinResponse)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    void load()
  }, [load])

  const transfer = async () => {
    const tid = Number(String(destTableId).replace(",", "."))
    if (!Number.isFinite(tid)) return
    const res = await fetch("/api/caisse/transfer-table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        to_table_id: tid,
        reason: xferReason.trim() || null,
      }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(typeof j?.error === "string" ? j.error : "Transfert refusé")
      return
    }
    toast.success(`Session déplacée vers table ${tid}.`)
    setDestTableId("")
    setXferReason("")
    onRefreshParents()
    void load()
  }

  const addGuest = async () => {
    const res = await fetch("/api/caisse/guest-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parent_session_id: sessionId,
        label: guestLabel.trim() || "Invité",
      }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(typeof j?.error === "string" ? j.error : "Création invité impossible")
      return
    }
    toast.success("Invité créé.")
    setGuestLabel("")
    void load()
  }

  const t = data?.table
  const canCloseWithoutResolution = Number(t?.unpaid_ttc ?? 0) <= 0.02

  const closeTable = async () => {
    const body = {
      session_id: sessionId,
      resolution_type: closeResolution,
      reason: closeResolution === "none" ? null : closeReason.trim(),
    }
    const res = await fetch("/api/caisse/close-table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(typeof j?.error === "string" ? j.error : "Clôture refusée")
      return
    }
    toast.success("Session clôturée — table en attente de nettoyage (À nettoyer).")
    onRefreshParents()
    void load()
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">
            Session table {tableNumber} — totals & split
          </CardTitle>
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {t ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Brut avant remise" value={`${fmt(Number(t.gross_before_discount_sum ?? 0))} €`} />
            <Metric label="Dû TTC" value={`${fmt(t.total_due_ttc)} €`} />
            <Metric label="Payé" value={`${fmt(t.paid_ttc)} €`} />
            <Metric label="Restant" accent value={`${fmt(t.unpaid_ttc)} €`} />
            <Metric label="Rabais cumulés" value={`${fmt(t.discount_sum)} €`} />
            <Metric label="Hospitalité / offert (est.)" value={`${fmt(t.hospitality_value_estimate)} €`} />
            <Metric label="Annulations" value={`${fmt(t.cancelled_sum)} €`} />
          </div>
        ) : (
          <p className="text-muted-foreground">{loading ? "Chargement…" : "—"}</p>
        )}

        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="font-medium text-neutral-900 dark:text-neutral-100">Par invité / sous-commande</div>
          {!data?.guests?.length ? (
            <p className="mt-2 text-muted-foreground">Pas encore de lignes de facture pour cette session.</p>
          ) : data.guests.length === 1 && data.guests[0].guest_session_id == null ? (
            <p className="mt-2 text-muted-foreground">
              Tout est encore regroupé sur la table. Ajoutez des invités ci-dessous pour split commande / paiement.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {data!.guests.map((g, i) => {
                const due = g.totalDue ?? g.total_due ?? 0
                const hosp = g.hospitalityValue ?? g.hospitality_value ?? 0
                return (
                  <li key={`${String(g.label)}-${String(i)}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-dashed pb-2 last:border-none last:pb-0">
                    <span className="font-medium">{g.label}</span>
                    <span className="text-muted-foreground">dû {fmt(due)} €</span>
                    <span>payé {fmt(g.paid)} €</span>
                    <span className={g.remaining > 0.02 ? "text-amber-700 dark:text-amber-300" : ""}>reste {fmt(g.remaining)} €</span>
                    {(g.payment_methods ?? []).length > 0 ? (
                      <span className="text-sky-700 dark:text-sky-300">
                        méthodes {(g.payment_methods ?? []).join(", ")}
                      </span>
                    ) : null}
                    {g.discount > 0.02 ? <span className="text-muted-foreground">remise {fmt(g.discount)} €</span> : null}
                    {hosp > 0.02 ? <span className="text-violet-600 dark:text-violet-300">offert {fmt(hosp)} €</span> : null}
                    {g.flags.includes("paid") ? <span className="text-green-700 dark:text-green-400">soldé</span> : null}
                    {g.flags.includes("hospitality") ? <span className="text-violet-700 dark:text-violet-300">hospitalité</span> : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg border p-3">
            <Label className="text-xs font-medium">Nouvel invité (split paiement)</Label>
            <Input placeholder="Nom / n° guest" value={guestLabel} onChange={(e) => setGuestLabel(e.target.value)} />
            <Button type="button" size="sm" variant="secondary" className="w-full" onClick={() => void addGuest()}>
              Ajouter une session invité
            </Button>
          </div>

          <div className="space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/60 p-3 dark:bg-amber-950/40">
            <Label className="text-xs font-medium">Transfert de table</Label>
            <Input
              placeholder="ID table destination (numérique)"
              value={destTableId}
              onChange={(e) => setDestTableId(e.target.value)}
              inputMode="numeric"
            />
            <Input placeholder="Raison (optionnel audit)" value={xferReason} onChange={(e) => setXferReason(e.target.value)} />
            <Button type="button" size="sm" className="w-full" variant="destructive" onClick={() => void transfer()}>
              Déplacer la session
            </Button>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-3 dark:border-emerald-800/60 dark:bg-emerald-950/30">
          <div className="font-medium text-neutral-900 dark:text-neutral-100">Clôturer table</div>
          <p className="text-xs text-muted-foreground">
            Autorisé si tout est payé, ou si le reliquat est marqué en hospitality / cancelled / loss avec raison.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Résolution reliquat</Label>
              <select
                className="mt-1 flex h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={closeResolution}
                onChange={(e) => setCloseResolution((e.target.value as typeof closeResolution) ?? "none")}
              >
                <option value="none">Aucune (tout est payé)</option>
                <option value="hospitality">Hospitality / offert</option>
                <option value="cancelled">Annulé</option>
                <option value="loss">Perte / loss</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Raison (si reliquat)</Label>
              <Input
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="Motif obligatoire si non payé"
              />
            </div>
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={!canCloseWithoutResolution && closeResolution === "none"}
            onClick={() => void closeTable()}
          >
            Clôturer table
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold ${accent ? "text-amber-700 dark:text-amber-300" : ""}`}>{value}</div>
    </div>
  )
}

function fmt(n: number) {
  if (!Number.isFinite(n)) return "—"
  return n.toFixed(2)
}
