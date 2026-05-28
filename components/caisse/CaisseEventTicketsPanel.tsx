"use client"

import { useCallback, useEffect, useState } from "react"
import { Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Row = {
  event: { id: string; title: string; max_attendees?: number | null }
  ticketCount: number
  totals: { revenuePaidEUR: number; awaitingVenueEUR: number; stripeEUR: number }
  tickets: Array<{
    code: string
    guestName: string
    totalAmount: number
    paid: boolean
    paymentMethod: string
    paymentStatus: string
    status: string
  }>
}

export function CaisseEventTicketsPanel({ date }: { date: string }) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/caisse/event-tickets?date=${encodeURIComponent(date)}`)
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Chargement impossible")
        setRows([])
        return
      }
      setRows(Array.isArray(j.events) ? j.events : [])
    } catch {
      setErr("Erreur reseau")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && rows.length === 0) {
    return <p className="text-sm text-neutral-600 dark:text-neutral-400">Chargement des tickets evenements…</p>
  }
  if (err) {
    return <p className="text-sm text-rose-600">{err}</p>
  }
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-600 dark:text-neutral-400">Aucun evenement programme a cette date.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Paiements stripes (en ligne) vs dettes « a regler au restaurant » (especes ou TPE salle).
        </p>
        <button
          type="button"
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
          onClick={() => load()}
        >
          Rafraîchir
        </button>
      </div>

      {rows.map((r) => (
        <Card key={r.event.id} className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Ticket className="h-4 w-4" />
                {r.event.title}
              </CardTitle>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">{r.ticketCount} inscrits</Badge>
                <Badge className="bg-emerald-600">Encaisse {r.totals.revenuePaidEUR.toFixed(2)} €</Badge>
                <Badge variant="outline">Salle a encaisser {r.totals.awaitingVenueEUR.toFixed(2)} €</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-0">
            <table className="w-full text-left text-xs">
              <thead className="border-b text-neutral-500 dark:text-neutral-400">
                <tr>
                  <th className="pb-2 pr-3">Code</th>
                  <th className="pb-2 pr-3">Invite</th>
                  <th className="pb-2 pr-3">Montant</th>
                  <th className="pb-2 pr-3">Paiement</th>
                  <th className="pb-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {r.tickets
                  .filter((t) => t.status !== "cancelled")
                  .map((t) => (
                    <tr key={t.code} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-3 font-mono">{t.code}</td>
                      <td className="py-2 pr-3">{t.guestName}</td>
                      <td className="py-2 pr-3">{t.totalAmount.toFixed(2)} €</td>
                      <td className="py-2 pr-3">
                        {t.paymentMethod === "stripe"
                          ? "Stripe"
                          : t.paymentMethod === "cash_at_venue"
                            ? "Espèces au restaurant"
                            : "Carte au restaurant"}
                      </td>
                      <td className="py-2">
                        {t.paid ? (
                          <span className="text-emerald-600">Paye</span>
                        ) : t.paymentMethod === "stripe" ? (
                          <span className="text-amber-600">En ligne en attente</span>
                        ) : (
                          <span className="text-orange-600">A payer sur place</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
