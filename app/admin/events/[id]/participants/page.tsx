"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, QrCode, RefreshCw, Users } from "lucide-react"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Ticket = {
  code: string
  guestName: string
  guestEmail: string
  adults: number
  children: number
  totalAmount: number
  paid: boolean
  paymentMethod?: string
  paymentStatus?: string
  status: "pending" | "paid" | "checked_in" | "cancelled"
  createdAt: string
}

type Summary = {
  count: number
  revenue: number
  checkedIn: number
  pendingPay?: number
  paidOnline?: number
  payAtVenue?: number
}

type WaitlistRow = {
  id: string
  guest_name: string
  guest_email: string
  party_size: number
  status: string
  created_at: string
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  checked_in: "bg-blue-100 text-blue-800",
  cancelled: "bg-rose-100 text-rose-800",
}

export default function EventParticipantsPage() {
  const params = useParams<{ id: string | string[] }>()
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [summary, setSummary] = useState<Summary>({
    count: 0,
    revenue: 0,
    checkedIn: 0,
    pendingPay: 0,
    paidOnline: 0,
    payAtVenue: 0,
  })
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const res = await fetch(`/api/events/tickets?eventId=${encodeURIComponent(id)}`)
    const body = await res.json()
    setTickets(body.tickets ?? [])
    const s = body.summary ?? {}
    setSummary({
      count: Number(s.count) || 0,
      revenue: Number(s.revenue) || 0,
      checkedIn: Number(s.checkedIn) || 0,
      pendingPay: Number(s.pendingPay) || 0,
      paidOnline: Number(s.paidOnline) || 0,
      payAtVenue: Number(s.payAtVenue) || 0,
    })

    const wl = await fetch(`/api/events/${encodeURIComponent(id)}/waiting-list`)
    if (wl.ok) {
      const wlb = await wl.json()
      setWaitlist(Array.isArray(wlb.waitlist) ? wlb.waitlist : [])
    } else {
      setWaitlist([])
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function act(code: string, action: "check_in" | "pay" | "cancel") {
    await fetch(`/api/events/tickets/${encodeURIComponent(code)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    load()
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/admin/events" backLabel="Evenements" hideMainNav />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Participants</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Liste, paiement et check-in</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Rafraichir
              </Button>
              <Button asChild size="pillSm" variant="gold" className="text-[color:var(--lux-ink)]">
                <a href={`/admin/events/${id}/scan`}>
                  <QrCode className="mr-2 h-4 w-4" /> Scan entree
                </a>
              </Button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Tickets actifs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Revenus encaisse</p>
                <p className="text-2xl font-bold text-emerald-600">{summary.revenue.toFixed(2)} €</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Check-in</p>
                <p className="text-2xl font-bold text-blue-600">{summary.checkedIn}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Paiement en attente</p>
                <p className="text-2xl font-bold text-amber-600">{summary.pendingPay ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Stripe (marque pays)</p>
                <p className="text-2xl font-bold text-violet-600">{summary.paidOnline ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Au restaurant</p>
                <p className="text-2xl font-bold text-orange-600">{summary.payAtVenue ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6 border-dashed border-amber-300/70 dark:border-amber-700/40">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-white">Liste d&apos;attente</CardTitle>
            </CardHeader>
            <CardContent>
              {waitlist.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune demande ou table absente.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {waitlist.slice(0, 40).map((w) => (
                    <li
                      key={w.id}
                      className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-200/70 px-3 py-2 dark:border-slate-700"
                    >
                      <span className="font-medium text-slate-900 dark:text-white">{w.guest_name}</span>
                      <span className="text-slate-500">{w.guest_email}</span>
                      <Badge variant="outline">
                        {w.party_size} pers. · {w.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
                <Users className="h-4 w-4" /> Liste des tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Aucune reservation.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-slate-500">
                        <th className="py-2">Code</th>
                        <th>Invite</th>
                        <th>Adultes</th>
                        <th>Enfants</th>
                        <th>Montant</th>
                        <th>Paiement</th>
                        <th>Statut</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => (
                        <tr key={t.code} className="border-b last:border-0">
                          <td className="py-2 font-mono text-xs">{t.code}</td>
                          <td>
                            <div className="font-medium text-slate-900 dark:text-white">{t.guestName}</div>
                            <div className="text-xs text-slate-500">{t.guestEmail}</div>
                          </td>
                          <td>{t.adults}</td>
                          <td>{t.children}</td>
                          <td>{t.totalAmount.toFixed(2)} €</td>
                          <td className="text-xs">
                            {(t.paymentMethod ?? "stripe") === "stripe"
                              ? "En ligne"
                              : t.paymentMethod === "cash_at_venue"
                                ? "Espèces salle"
                                : "TPE salle"}{" "}
                            {!t.paid ? "(impaye)" : ""}
                          </td>
                          <td>
                            <Badge className={STATUS_STYLE[t.status]}>{t.status}</Badge>
                          </td>
                          <td className="space-x-1 text-right">
                            {t.status !== "paid" && t.status !== "checked_in" ? (
                              <Button size="sm" variant="outline" onClick={() => act(t.code, "pay")}>
                                Marquer paye
                              </Button>
                            ) : null}
                            {t.status !== "checked_in" && t.status !== "cancelled" ? (
                              <Button size="sm" onClick={() => act(t.code, "check_in")}>
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Entree
                              </Button>
                            ) : null}
                            {t.status !== "cancelled" ? (
                              <Button size="sm" variant="ghost" onClick={() => act(t.code, "cancel")}>
                                Annuler
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
