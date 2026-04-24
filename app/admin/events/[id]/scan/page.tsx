"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, QrCode, XCircle } from "lucide-react"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ScanResult =
  | { ok: true; message: string; ticket: { code: string; guestName: string; adults: number; children: number; status: string } }
  | { ok: false; message: string }

export default function EventScanPage() {
  const params = useParams<{ id: string | string[] }>()
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""
  const [input, setInput] = useState("")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)

  function normalize(raw: string): string {
    const trimmed = raw.trim()
    if (trimmed.startsWith("bloudan-ticket:")) return trimmed.slice("bloudan-ticket:".length)
    return trimmed
  }

  async function validate() {
    const code = normalize(input)
    if (!code) return
    setLoading(true)
    try {
      const res = await fetch(`/api/events/tickets/${encodeURIComponent(code)}`)
      const body = await res.json()
      if (!res.ok) {
        setResult({ ok: false, message: body.error || "Ticket introuvable" })
        return
      }
      const ticket = body.ticket
      if (ticket.eventId !== id) {
        setResult({ ok: false, message: "Ticket d'un autre evenement" })
        return
      }
      if (ticket.status === "cancelled") {
        setResult({ ok: false, message: "Ticket annule" })
        return
      }
      if (ticket.status === "checked_in") {
        setResult({ ok: false, message: "Deja utilise" })
        return
      }
      const postRes = await fetch(`/api/events/tickets/${encodeURIComponent(code)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_in" }),
      })
      const after = await postRes.json()
      if (!postRes.ok) {
        setResult({ ok: false, message: after.error || "Erreur validation" })
        return
      }
      setResult({
        ok: true,
        message: "Entree validee",
        ticket: after.ticket,
      })
      setInput("")
    } catch {
      setResult({ ok: false, message: "Erreur reseau" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref={`/admin/events/${id}/participants`} backLabel="Participants" hideMainNav />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Scan entree</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Entrez ou collez le code ticket (QR contient la meme chaine).
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
                <QrCode className="h-4 w-4" /> Valider un ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Code ticket</Label>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="BLD-XXXX-YYYYYY ou bloudan-ticket:..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") validate()
                  }}
                />
              </div>
              <Button onClick={validate} disabled={loading || !input.trim()} className="w-full">
                {loading ? "Validation..." : "Valider"}
              </Button>

              {result ? (
                <div
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                    result.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {result.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5" /> : <XCircle className="mt-0.5 h-5 w-5" />}
                  <div>
                    <p className="font-semibold">{result.message}</p>
                    {result.ok ? (
                      <p className="text-xs">
                        {result.ticket.guestName} — {result.ticket.adults} adulte(s),{" "}
                        {result.ticket.children} enfant(s)
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
