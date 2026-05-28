"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Banknote, Undo2 } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Row = {
  id: string
  kind?: string
  amount?: number | string
  description?: string | null
  movement_at?: string | null
  created_at?: string | null
  beneficiary_display_name?: string | null
  beneficiary_role_label?: string | null
  attachment_url?: string | null
  reverses_movement_id?: string | null
  performed_by_profile?: { full_name?: string | null; email?: string | null } | null
  validated_by_profile?: { full_name?: string | null; email?: string | null } | null
  beneficiary_user_profile?: { full_name?: string | null; email?: string | null } | null
}

function fmtEuro(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return "—"
  return `${n.toFixed(2)} €`
}

export default function AdminCashSortiesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [annulOpen, setAnnulOpen] = useState(false)
  const [annulRow, setAnnulRow] = useState<Row | null>(null)
  const [annulReason, setAnnulReason] = useState("")
  const [annulBusy, setAnnulBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        "/api/staff/cash-register-movements?expand=users&limit=500&kinds=sortie_caisse,annulation_sortie",
      )
      const j = await res.json().catch(() => ({}))
      setRows(Array.isArray(j.movements) ? j.movements : [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openAnnul = (r: Row) => {
    setAnnulRow(r)
    setAnnulReason("")
    setAnnulOpen(true)
  }

  const submitAnnul = async () => {
    if (!annulRow?.id) return
    const reason = annulReason.trim()
    if (reason.length < 4) return
    setAnnulBusy(true)
    try {
      const res = await fetch("/api/caisse/sortie/annuler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_movement_id: annulRow.id, reason }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(typeof j?.error === "string" ? j.error : "Échec annulation")
        return
      }
      setAnnulOpen(false)
      setAnnulRow(null)
      await load()
    } finally {
      setAnnulBusy(false)
    }
  }

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <SiteHeader
          backHref="/admin"
          backLabel="Admin"
          hideMainNav
          trailing={
            <Button asChild size="sm" variant="outline">
              <Link href="/caisse">Caisse</Link>
            </Button>
          }
        />

        <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
              <Banknote className="h-7 w-7 text-rose-600" />
              Sorties de caisse — audit
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Consultation des prélèvements et des annulations. Les lignes ne sont jamais supprimées : une erreur se
              corrige par une annulation documentée (traçabilité complète).
            </p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Historique récent (500 max.)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              ) : rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun mouvement.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="py-2 pr-2 font-medium">Mouvement</th>
                        <th className="py-2 pr-2 font-medium">Montant</th>
                        <th className="py-2 pr-2 font-medium">Bénéficiaire</th>
                        <th className="py-2 pr-2 font-medium">Rôle</th>
                        <th className="py-2 pr-2 font-medium">Détail</th>
                        <th className="py-2 pr-2 font-medium">Validé par</th>
                        <th className="py-2 pr-2 font-medium">PJ</th>
                        <th className="py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const isAnnul = r.kind === "annulation_sortie"
                        const val = r.validated_by_profile ?? r.performed_by_profile
                        const valStr = [val?.full_name, val?.email].filter(Boolean).join(" · ")
                        return (
                          <tr key={r.id} className="border-b border-muted/60">
                            <td className="py-2 pr-2 font-mono text-[11px]">
                              {r.movement_at ? new Date(r.movement_at).toLocaleString() : "—"}
                              <br />
                              <span className={isAnnul ? "text-emerald-700" : "text-rose-700"}>
                                {isAnnul ? "Annulation" : "Sortie"}
                              </span>
                            </td>
                            <td className="py-2 pr-2 tabular-nums">{fmtEuro(r.amount)}</td>
                            <td className="py-2 pr-2">
                              {r.beneficiary_display_name ||
                                r.beneficiary_user_profile?.full_name ||
                                r.beneficiary_user_profile?.email ||
                                "—"}
                            </td>
                            <td className="py-2 pr-2">{r.beneficiary_role_label ?? "—"}</td>
                            <td className="max-w-[240px] py-2 pr-2 truncate" title={r.description ?? ""}>
                              {r.description ?? "—"}
                            </td>
                            <td className="max-w-[160px] py-2 pr-2 truncate" title={valStr}>
                              {valStr || "—"}
                            </td>
                            <td className="py-2 pr-2">
                              {r.attachment_url ? (
                                <a
                                  href={r.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline"
                                >
                                  Voir
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-2">
                              {!isAnnul ? (
                                <Button type="button" variant="outline" size="sm" className="h-7 gap-1" onClick={() => openAnnul(r)}>
                                  <Undo2 className="h-3 w-3" /> Annuler
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={annulOpen} onOpenChange={setAnnulOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Annulation traçable</DialogTitle>
              <DialogDescription>
                Crée un mouvement « annulation » qui corrige les sorties nettes sans supprimer l’historique original.
              </DialogDescription>
            </DialogHeader>
            {annulRow ? (
              <div className="space-y-2 text-sm">
                <p>
                  Sortie #{annulRow.id.slice(0, 8)}… —{" "}
                  <strong>{fmtEuro(annulRow.amount)}</strong>
                </p>
                <div className="space-y-1">
                  <Label className="text-xs">Motif obligatoire</Label>
                  <Textarea
                    rows={4}
                    value={annulReason}
                    onChange={(e) => setAnnulReason(e.target.value)}
                    placeholder="Ex. erreur de montant saisi…"
                  />
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAnnulOpen(false)}>
                Fermer
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={annulBusy || annulReason.trim().length < 4}
                onClick={() => void submitAnnul()}
              >
                {annulBusy ? "…" : "Confirmer l’annulation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
