"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Calendar, CheckCircle2, Clock, Download, Ticket, Users } from "lucide-react"

import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Ticket = {
  code: string
  eventId: string
  eventTitle?: string
  guestName: string
  guestEmail: string
  adults: number
  children: number
  totalAmount: number
  paid: boolean
  status: "pending" | "paid" | "checked_in" | "cancelled"
  createdAt: string
  checkedInAt?: string
  specialRequests?: string
}

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente paiement",
  paid: "Paye",
  checked_in: "Entree validee",
  cancelled: "Annule",
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  checked_in: "bg-blue-100 text-blue-800",
  cancelled: "bg-rose-100 text-rose-800",
}

export default function TicketPage() {
  const params = useParams<{ code: string | string[] }>()
  const code = typeof params?.code === "string" ? params.code : Array.isArray(params?.code) ? params.code[0] : ""
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    fetch(`/api/events/tickets/${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.ticket) setTicket(body.ticket)
        else setError(body.error || "Ticket introuvable")
      })
      .catch(() => setError("Erreur reseau"))
      .finally(() => setLoading(false))
  }, [code])

  const qrPayload = ticket ? `bloudan-ticket:${ticket.code}` : ""
  const qrUrl = ticket
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrPayload)}`
    : ""

  return (
    <PageShell>
      <SiteHeader backHref="/events" backLabel="Evenements" />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <Ticket className="mx-auto mb-3 h-10 w-10 text-[#d4a574]" />
          <h1 className="text-3xl font-bold text-[#2d2416] sm:text-4xl">Votre ticket</h1>
          <p className="mt-1 text-[#8b6f47]">Presentez ce QR code a l'entree.</p>
        </div>

        {loading ? (
          <p className="text-center text-[#8b6f47]">Chargement...</p>
        ) : error || !ticket ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {error || "Ticket introuvable"}
          </p>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-[#2d2416]">{ticket.eventTitle ?? "Evenement"}</CardTitle>
                <Badge className={STATUS_STYLE[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-[#faf8f3] p-6">
                <img src={qrUrl} alt="QR du ticket" className="h-56 w-56" />
                <p className="font-mono text-sm font-semibold text-[#2d2416]">{ticket.code}</p>
                {ticket.status === "checked_in" ? (
                  <div className="flex items-center gap-1 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Valide le{" "}
                    {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleString("fr-FR") : ""}
                  </div>
                ) : null}
              </div>
              <div className="space-y-3 text-sm text-[#5d4e37]">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#d4a574]" />
                  {ticket.adults} adulte(s), {ticket.children} enfant(s)
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#d4a574]" />
                  Reserve le {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#d4a574]" />
                  Ticket personnel — ne pas partager
                </div>
                <div className="rounded-lg bg-[#2d2416] px-4 py-3 text-white">
                  <div className="flex justify-between">
                    <span>Montant</span>
                    <span className="font-bold">{ticket.totalAmount.toFixed(2)} €</span>
                  </div>
                  <div className="mt-1 text-xs opacity-70">
                    {ticket.paid ? "Paye" : "A payer sur place"}
                  </div>
                </div>
                {ticket.specialRequests ? (
                  <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Note: {ticket.specialRequests}
                  </p>
                ) : null}
                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  <Download className="mr-2 h-4 w-4" /> Imprimer / PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <SiteFooter />
    </PageShell>
  )
}
