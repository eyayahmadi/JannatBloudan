"use client"

import { useState } from "react"
import { PartyPopper, Sparkles } from "lucide-react"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Proposal = {
  label: string
  menu: { style: string; items: string[]; estimatedPricePerHead: number }
  decor: string[]
  estimatedCost: number
  resolvedBudget: number
  budgetBucket: "low" | "mid" | "high"
  fitScore: number
  marketingCopy: string
  timeline: Array<{ t: string; action: string }>
  aiNote: string | null
}

const TYPES = [
  { id: "birthday", label: "Anniversaire" },
  { id: "wedding", label: "Mariage" },
  { id: "corporate", label: "Entreprise" },
  { id: "karaoke", label: "Karaoke" },
  { id: "buffet", label: "Buffet" },
  { id: "private", label: "Prive" },
]

export default function EventPlannerAdminPage() {
  const [type, setType] = useState("birthday")
  const [guests, setGuests] = useState(30)
  const [budget, setBudget] = useState(800)
  const [date, setDate] = useState("")
  const [preferences, setPreferences] = useState("")
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/event-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, guests, budget, date, preferences }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || "Erreur")
        return
      }
      setProposal(body.proposal)
    } catch {
      setError("Erreur reseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/admin/ai" backLabel="Centre AI" hideMainNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
              <PartyPopper className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Agent Event Planner</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Propose menu, decoration, budget et timeline pour tout evenement.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base text-slate-900 dark:text-white">Brief</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Type d'evenement</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className={`rounded-md border px-3 py-2 text-xs font-medium transition ${
                          type === t.id
                            ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Invites</Label>
                    <Input
                      type="number"
                      min={1}
                      value={guests}
                      onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget (€)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={budget}
                      onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date (optionnelle)</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Preferences / contraintes</Label>
                  <Textarea
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="Regime halal strict, enfants, musique live..."
                  />
                </div>

                <Button onClick={generate} disabled={loading} className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {loading ? "Generation..." : "Generer la proposition"}
                </Button>
                {error ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base text-slate-900 dark:text-white">Proposition</CardTitle>
              </CardHeader>
              <CardContent>
                {!proposal ? (
                  <p className="py-12 text-center text-sm text-slate-500">
                    Renseignez un brief puis generez pour voir la proposition.
                  </p>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-800">{proposal.label}</Badge>
                      <Badge variant="outline">Budget {proposal.resolvedBudget} €</Badge>
                      <Badge variant="outline">Cout estime {proposal.estimatedCost} €</Badge>
                      <Badge className="bg-slate-900 text-white">Fit {proposal.fitScore}/100</Badge>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Menu</p>
                      <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">{proposal.menu.style}</p>
                      <ul className="list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">
                        {proposal.menu.items.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                      <p className="mt-1 text-xs text-slate-500">
                        ~{proposal.menu.estimatedPricePerHead} €/personne
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Decoration</p>
                      <div className="flex flex-wrap gap-2">
                        {proposal.decor.map((d) => (
                          <span
                            key={d}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Timeline</p>
                      <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                        {proposal.timeline.map((step) => (
                          <li key={step.t} className="flex gap-3">
                            <span className="font-mono text-xs text-amber-700 dark:text-amber-400">{step.t}</span>
                            <span>{step.action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Campagne marketing</p>
                      <p className="rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 p-3 text-sm italic text-amber-900 dark:from-amber-950/30 dark:to-orange-950/30 dark:text-amber-100">
                        {proposal.marketingCopy}
                      </p>
                    </div>

                    {proposal.aiNote ? (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Conseil LLM</p>
                        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                          {proposal.aiNote}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
