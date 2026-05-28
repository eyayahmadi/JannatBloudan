"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/context/AuthContext"

type MovementRow = {
  id: string
  kind?: string
  amount?: number | string
  description?: string | null
  movement_at?: string | null
  beneficiary_display_name?: string | null
  beneficiary_role_label?: string | null
  attachment_url?: string | null
  performed_by_profile?: { full_name?: string | null; email?: string | null } | null
  validated_by_profile?: { full_name?: string | null; email?: string | null } | null
  beneficiary_user_profile?: { full_name?: string | null; email?: string | null } | null
  reverses_movement_id?: string | null
}

type Props = {
  date: string
  refreshKey?: number
}

function fmt(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return "—"
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

/** Détail des sorties / annulations pour la journée sélectionnée (rapport caisse). */
export function SortiesJourTable({ date, refreshKey = 0 }: Props) {
  const { user } = useAuth()
  const [rows, setRows] = useState<MovementRow[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/staff/cash-register-movements?date=${encodeURIComponent(date)}&expand=users&limit=200&kinds=sortie_caisse,annulation_sortie`,
      )
      const j = await res.json().catch(() => ({}))
      const list = Array.isArray(j.movements) ? (j.movements as MovementRow[]) : []
      setRows(list)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Sorties de caisse (jour {date})</CardTitle>
          {user?.role === "ADMIN" ? (
            <Link
              href="/admin/cash-sorties"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Vue admin complète <ExternalLink className="h-3 w-3" />
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="text-sm">
        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">Aucune sortie ou annulation enregistrée pour cette date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Heure</th>
                  <th className="py-2 pr-2 font-medium">Type</th>
                  <th className="py-2 pr-2 font-medium text-right">Montant</th>
                  <th className="py-2 pr-2 font-medium">Bénéficiaire</th>
                  <th className="py-2 pr-2 font-medium">Rôle</th>
                  <th className="py-2 pr-2 font-medium">Motif</th>
                  <th className="py-2 pr-2 font-medium">Validé par</th>
                  <th className="py-2 font-medium">PJ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isAnnul = r.kind === "annulation_sortie"
                  const val = r.validated_by_profile ?? r.performed_by_profile
                  const valStr = [val?.full_name, val?.email].filter(Boolean).join(" · ")
                  return (
                    <tr key={r.id} className="border-b border-muted/60">
                      <td className="py-2 pr-2 whitespace-nowrap font-mono text-[11px]">
                        {r.movement_at ? new Date(r.movement_at).toLocaleString() : "—"}
                      </td>
                      <td className={cn("py-2 pr-2 font-medium", isAnnul ? "text-emerald-700" : "text-rose-700")}>
                        {isAnnul ? "Annulation" : "Sortie"}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">{fmt(r.amount)} €</td>
                      <td className="py-2 pr-2">
                        {r.beneficiary_display_name ||
                          r.beneficiary_user_profile?.full_name ||
                          r.beneficiary_user_profile?.email ||
                          "—"}
                      </td>
                      <td className="py-2 pr-2">{r.beneficiary_role_label ?? "—"}</td>
                      <td className="py-2 pr-2 max-w-[200px] truncate" title={r.description ?? ""}>
                        {r.description ?? "—"}
                      </td>
                      <td className="py-2 pr-2 max-w-[160px] truncate" title={valStr}>
                        {valStr || "—"}
                      </td>
                      <td className="py-2">
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
