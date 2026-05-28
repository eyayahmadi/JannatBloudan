"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function NewEventPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [allowOnlinePay, setAllowOnlinePay] = useState(true)
  const [allowPayAtVenue, setAllowPayAtVenue] = useState(true)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const title = String(fd.get("title") ?? "").trim()
    const event_date = String(fd.get("event_date") ?? "").trim()
    const start_time = String(fd.get("start_time") ?? "").trim()
    if (!title || !event_date || !start_time) {
      toast.error("Titre, date et heure de debut sont requis.")
      return
    }

    const payload = {
      title,
      description: String(fd.get("description") ?? "").trim() || undefined,
      event_date,
      start_time,
      end_time: String(fd.get("end_time") ?? "").trim() || undefined,
      location: String(fd.get("location") ?? "").trim() || undefined,
      max_attendees: (() => {
        const raw = String(fd.get("max_attendees") ?? "").trim()
        if (!raw) return undefined
        const n = Number(raw)
        return Number.isFinite(n) ? Math.floor(n) : undefined
      })(),
      price_adult: (() => {
        const raw = String(fd.get("price_adult") ?? "").trim()
        if (!raw) return undefined
        const n = Number(raw.replace(",", "."))
        return Number.isFinite(n) ? n : undefined
      })(),
      price_child: (() => {
        const raw = String(fd.get("price_child") ?? "").trim()
        if (!raw) return undefined
        const n = Number(raw.replace(",", "."))
        return Number.isFinite(n) ? n : undefined
      })(),
      price_vip: (() => {
        const raw = String(fd.get("price_vip") ?? "").trim()
        if (!raw) return undefined
        const n = Number(raw.replace(",", "."))
        return Number.isFinite(n) ? n : undefined
      })(),
      price_group: (() => {
        const raw = String(fd.get("price_group") ?? "").trim()
        if (!raw) return undefined
        const n = Number(raw.replace(",", "."))
        return Number.isFinite(n) ? n : undefined
      })(),
      group_party_size: (() => {
        const raw = String(fd.get("group_party_size") ?? "").trim()
        if (!raw) return undefined
        const n = Math.floor(Number(raw))
        return Number.isFinite(n) && n >= 2 ? n : undefined
      })(),
      payment_hold_minutes: (() => {
        const raw = String(fd.get("payment_hold_minutes") ?? "").trim()
        if (!raw) return undefined
        const n = Math.floor(Number(raw))
        return Number.isFinite(n) && n > 0 ? n : undefined
      })(),
      waitlist_offer_minutes: (() => {
        const raw = String(fd.get("waitlist_offer_minutes") ?? "").trim()
        if (!raw) return undefined
        const n = Math.floor(Number(raw))
        return Number.isFinite(n) && n > 0 ? n : undefined
      })(),
      allow_online_pay: allowOnlinePay,
      allow_pay_at_venue: allowPayAtVenue,
    }

    setSaving(true)
    try {
      const r = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) {
        const msg =
          typeof body.error === "string"
            ? body.error
            : "Impossible de creer l'evenement (verifiez la migration SQL / colonnes Supabase)."
        toast.error(msg)
        return
      }
      const id = typeof body.event?.id === "string" ? body.event.id : null
      toast.success("Evenement cree")
      router.push(id ? `/admin/events/${id}/participants` : "/admin/events")
      router.refresh()
    } catch {
      toast.error("Erreur reseau")
    } finally {
      setSaving(false)
    }
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/admin/events" backLabel="Evenements" hideMainNav />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-slate-600 dark:text-slate-300">
            <Link href="/admin/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour a la liste
            </Link>
          </Button>

          <Card className="border-white/60 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Creer un evenement</CardTitle>
              <CardDescription>
                Publie un evenement public (tickets, participants, scan d&apos;entree, liste d&apos;attente).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input id="title" name="title" required maxLength={200} placeholder="Ex. Concert Jazz" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={4} placeholder="Details visibles sur la fiche..." />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Date *</Label>
                    <Input id="event_date" name="event_date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Lieu</Label>
                    <Input id="location" name="location" placeholder="Salle principale..." />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Heure debut *</Label>
                    <Input id="start_time" name="start_time" type="time" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Heure fin</Label>
                    <Input id="end_time" name="end_time" type="time" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_attendees">Capacite max (places)</Label>
                  <Input id="max_attendees" name="max_attendees" type="number" min={0} step={1} placeholder="Optionnel (illimite si vide)" />
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                  <p className="mb-3 text-sm font-medium text-slate-800 dark:text-slate-200">Tarification (EUR)</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="price_adult">Prix adulte</Label>
                      <Input id="price_adult" name="price_adult" type="number" min={0} step="0.01" placeholder="0 = gratuit" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price_child">Prix enfant (optionnel)</Label>
                      <Input id="price_child" name="price_child" type="number" min={0} step="0.01" placeholder="Defaut: ~60% adulte" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price_vip">Prix VIP (optionnel)</Label>
                      <Input id="price_vip" name="price_vip" type="number" min={0} step="0.01" placeholder="Defaut: 1,5x adulte" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price_group">Prix pack groupe (optionnel)</Label>
                      <Input id="price_group" name="price_group" type="number" min={0} step="0.01" placeholder="Pour N personnes" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="group_party_size">Taille du pack groupe (personnes)</Label>
                      <Input id="group_party_size" name="group_party_size" type="number" min={2} step={1} placeholder="Par defaut 6" />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/40">
                  <p className="mb-3 text-sm font-medium text-slate-800 dark:text-slate-200">Paiement propose au client</p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox id="allow_online_pay" checked={allowOnlinePay} onCheckedChange={(c) => setAllowOnlinePay(c === true)} />
                      <Label htmlFor="allow_online_pay" className="cursor-pointer font-normal leading-snug">
                        Paiement en ligne (Stripe)
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="allow_pay_at_venue" checked={allowPayAtVenue} onCheckedChange={(c) => setAllowPayAtVenue(c === true)} />
                      <Label htmlFor="allow_pay_at_venue" className="cursor-pointer font-normal leading-snug">
                        Paiement sur place (especes / TPE)
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="payment_hold_minutes">Blocage place apres reservation (minutes)</Label>
                    <Input
                      id="payment_hold_minutes"
                      name="payment_hold_minutes"
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Defaut 20"
                    />
                    <p className="text-xs text-slate-500">Expire la place si le paiement en ligne n&apos;est pas termine.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waitlist_offer_minutes">Delai reponse liste d&apos;attente (minutes)</Label>
                    <Input
                      id="waitlist_offer_minutes"
                      name="waitlist_offer_minutes"
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Defaut 120"
                    />
                    <p className="text-xs text-slate-500">Fenetre pour confirmer quand une place se libere.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> En cours...
                      </>
                    ) : (
                      "Enregistrer"
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild disabled={saving}>
                    <Link href="/admin/events">Annuler</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
