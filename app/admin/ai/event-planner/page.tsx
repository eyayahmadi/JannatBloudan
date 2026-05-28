"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Brain,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Code2,
  Euro,
  Megaphone,
  Palette,
  PartyPopper,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/context/AuthContext"
import { cn } from "@/lib/utils"

type ProposalCapacity = {
  max: number | null
  guests: number
  status: "ok" | "over" | "unknown"
  remainingPlaces: number | null
  fillPercent: number | null
  note: string | null
}

type ProposalPricing = {
  currency: "EUR"
  budgetTotal: number
  budgetPerHead: number
  estimatedTotal: number
  estimatedPerHead: number
  surplusVsEstimate: number
  targetPricePerHead: number | null
  targetVsEstimateNote: string | null
}

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
  capacity: ProposalCapacity
  pricing: ProposalPricing
}

const TYPES = [
  { id: "birthday", label: "Anniversaire" },
  { id: "wedding", label: "Mariage" },
  { id: "corporate", label: "Entreprise" },
  { id: "karaoke", label: "Karaoké" },
  { id: "buffet", label: "Buffet" },
  { id: "private", label: "Privé" },
]

const BUCKET_LABEL: Record<string, string> = {
  low: "Budget serré",
  mid: "Budget équilibré",
  high: "Budget confortable",
}

export default function EventPlannerAdminPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  const [type, setType] = useState("birthday")
  const [guests, setGuests] = useState(30)
  const [budget, setBudget] = useState(800)
  const [date, setDate] = useState("")
  const [preferences, setPreferences] = useState("")
  const [maxVenueCapacity, setMaxVenueCapacity] = useState("")
  const [targetPricePerHead, setTargetPricePerHead] = useState("")
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [rawPayload, setRawPayload] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [techOpen, setTechOpen] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    setRawPayload(null)
    try {
      const res = await fetch("/api/ai/event-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          guests,
          budget,
          date,
          preferences,
          maxVenueCapacity: (() => {
            const t = maxVenueCapacity.trim()
            if (!t) return undefined
            const n = Math.floor(Number(t))
            return Number.isFinite(n) && n > 0 ? n : undefined
          })(),
          targetPricePerHead: (() => {
            const t = targetPricePerHead.trim()
            if (!t) return undefined
            const n = Number(t.replace(",", "."))
            return Number.isFinite(n) && n >= 0 ? n : undefined
          })(),
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Erreur")
        setProposal(null)
        return
      }
      setProposal(body.proposal as Proposal)
      setRawPayload(body)
    } catch {
      setError("Erreur réseau")
      setProposal(null)
    } finally {
      setLoading(false)
    }
  }

  const budgetUsePercent =
    proposal && proposal.resolvedBudget > 0
      ? Math.min(100, Math.round((proposal.estimatedCost / proposal.resolvedBudget) * 100))
      : 0

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-gradient-to-b from-stone-50 via-amber-50/30 to-stone-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <SiteHeader backHref="/admin/ai" backLabel="Centre AI" hideMainNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                <PartyPopper className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Agent Event Planner</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Menus, décoration, budget et planning — présentation claire, sans payload technique par défaut.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="border-stone-200/80 bg-white/95 shadow-md backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-white">Brief</CardTitle>
                <CardDescription>Décrivez l&apos;événement ; la proposition apparaît à droite.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Type d&apos;événement</Label>
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        className={cn(
                          "rounded-full border px-3.5 py-2 text-xs font-medium transition-all",
                          type === t.id
                            ? "border-amber-500 bg-amber-50 text-amber-950 shadow-sm ring-2 ring-amber-400/30 dark:bg-amber-950/40 dark:text-amber-100"
                            : "border-stone-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-amber-900",
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Invités</Label>
                    <Input
                      type="number"
                      min={1}
                      className="border-stone-200 bg-white dark:border-slate-700"
                      value={guests}
                      onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Budget total (€)</Label>
                    <Input
                      type="number"
                      min={0}
                      className="border-stone-200 bg-white dark:border-slate-700"
                      value={budget}
                      onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Capacité max salle</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Places max (optionnel)"
                      className="border-stone-200 bg-white dark:border-slate-700"
                      value={maxVenueCapacity}
                      onChange={(e) => setMaxVenueCapacity(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">Nombre de places assises/debout acceptées dans l&apos;espace.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Prix cible / convive (€)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      placeholder="Menu ou ticket visé"
                      className="border-stone-200 bg-white dark:border-slate-700"
                      value={targetPricePerHead}
                      onChange={(e) => setTargetPricePerHead(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">Pour comparer à l&apos;estimation automatique du plan.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Date (optionnelle)</Label>
                  <Input
                    type="date"
                    className="border-stone-200 bg-white dark:border-slate-700"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Préférences / contraintes</Label>
                  <Textarea
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="Régime halal strict, enfants, musique live…"
                    className="min-h-[100px] border-stone-200 bg-white dark:border-slate-700"
                  />
                </div>

                <Button
                  onClick={() => void generate()}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-800 to-rose-900 text-white shadow-md hover:from-rose-900 hover:to-black"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {loading ? "Génération…" : "Générer la proposition"}
                </Button>
                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
                    {error}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-3">
              <Card className="border-stone-200/80 bg-white/95 shadow-md backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Proposition</CardTitle>
                    <CardDescription>Résumé opérationnel et supports client.</CardDescription>
                  </div>
                  {proposal ? (
                    <Badge className="shrink-0 bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
                      {proposal.label}
                    </Badge>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4 py-2">
                      <Skeleton className="h-24 w-full rounded-xl" />
                      <Skeleton className="h-32 w-full rounded-xl" />
                      <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                  ) : null}

                  {!loading && !proposal ? (
                    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-gradient-to-b from-white to-stone-50/80 px-6 py-14 text-center dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/50">
                        <Sparkles className="h-7 w-7 text-amber-700 dark:text-amber-400" />
                      </div>
                      <p className="max-w-sm text-base font-medium text-slate-800 dark:text-slate-200">
                        Renseignez un brief puis lancez la génération.
                      </p>
                      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Indiquez capacité max et prix cible pour un contrôle budget / places automatique à droite.
                      </p>
                    </div>
                  ) : null}

                  {!loading && proposal ? (
                    <div className="space-y-5">
                      {proposal.capacity.status === "over" ? (
                        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
                          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                          <div>
                            <p className="font-semibold">Capacité maximale dépassée</p>
                            <p className="mt-1 leading-relaxed opacity-95">{proposal.capacity.note}</p>
                          </div>
                        </div>
                      ) : null}

                      {proposal.capacity.status === "ok" && proposal.capacity.note ? (
                        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-500" />
                          <p className="leading-relaxed">{proposal.capacity.note}</p>
                        </div>
                      ) : null}

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                          <Users className="mt-0.5 h-5 w-5 text-amber-600" />
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Invités</p>
                            <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{guests}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                          <Euro className="mt-0.5 h-5 w-5 text-emerald-600" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Budget total</p>
                            <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                              {proposal.pricing.budgetTotal}&nbsp;€
                            </p>
                            <p className="text-xs text-slate-500">
                              Soit {proposal.pricing.budgetPerHead}&nbsp;€ / convive (réparti)
                            </p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "flex min-w-0 flex-1 flex-col gap-2 rounded-xl border p-4",
                            proposal.capacity.status === "over"
                              ? "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30"
                              : proposal.capacity.status === "ok"
                                ? "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                                : "border-stone-100 bg-stone-50/90 dark:border-slate-800 dark:bg-slate-950/60",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Building2
                              className={cn(
                                "mt-0.5 h-5 w-5 shrink-0",
                                proposal.capacity.status === "over"
                                  ? "text-red-600"
                                  : proposal.capacity.status === "ok"
                                    ? "text-emerald-600"
                                    : "text-slate-500",
                              )}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Capacité salle</p>
                              {proposal.capacity.max != null ? (
                                <>
                                  <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                                    {proposal.capacity.max}&nbsp;places max
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {proposal.capacity.status === "over"
                                      ? `Surcharge : ${guests} invités`
                                      : `${proposal.capacity.remainingPlaces} place(s) restante(s)`}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Non renseignée</p>
                                  {proposal.capacity.note ? (
                                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
                                      {proposal.capacity.note}
                                    </p>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </div>
                          {proposal.capacity.fillPercent != null && proposal.capacity.max != null ? (
                            <div className="pt-1">
                              <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>Taux de remplissage</span>
                                <span className="tabular-nums">{proposal.capacity.fillPercent}%</span>
                              </div>
                              <Progress
                                value={Math.min(100, proposal.capacity.fillPercent)}
                                className={cn(
                                  "h-2",
                                  proposal.capacity.status === "over"
                                    ? "bg-red-100 dark:bg-red-950/50"
                                    : "bg-emerald-100 dark:bg-emerald-950/40",
                                )}
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <Card className="border-emerald-100/90 bg-white shadow-sm dark:border-emerald-900/35 dark:bg-slate-900/95">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Euro className="h-5 w-5 text-emerald-600" />
                            <CardTitle className="text-base">Tarification (EUR)</CardTitle>
                          </div>
                          <CardDescription>Budget, estimation menu et écart — même logique que la billetterie événements.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2 dark:border-slate-800">
                            <span className="text-slate-600 dark:text-slate-400">Estimation totale (menu / service)</span>
                            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                              {proposal.pricing.estimatedTotal}&nbsp;€
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2 dark:border-slate-800">
                            <span className="text-slate-600 dark:text-slate-400">Estimation par convive</span>
                            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                              {proposal.pricing.estimatedPerHead}&nbsp;€
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2 dark:border-slate-800">
                            <span className="text-slate-600 dark:text-slate-400">Budget total alloué</span>
                            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                              {proposal.pricing.budgetTotal}&nbsp;€
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-slate-600 dark:text-slate-400">Écart budget − estimation</span>
                            <span
                              className={cn(
                                "font-semibold tabular-nums",
                                proposal.pricing.surplusVsEstimate >= 0
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-red-700 dark:text-red-400",
                              )}
                            >
                              {proposal.pricing.surplusVsEstimate >= 0 ? "+" : ""}
                              {proposal.pricing.surplusVsEstimate}&nbsp;€
                            </span>
                          </div>
                          {proposal.pricing.targetPricePerHead != null ? (
                            <Badge variant="secondary" className="font-normal">
                              Prix cible saisi&nbsp;: {proposal.pricing.targetPricePerHead}&nbsp;€ / convive
                            </Badge>
                          ) : null}
                          {proposal.pricing.targetVsEstimateNote ? (
                            <p className="rounded-lg bg-stone-50 px-3 py-2 text-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
                              {proposal.pricing.targetVsEstimateNote}
                            </p>
                          ) : null}
                        </CardContent>
                      </Card>

                      <div className="rounded-xl border border-stone-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Pertinence budget
                          </span>
                          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                            {proposal.fitScore}/100
                          </span>
                        </div>
                        <Progress value={proposal.fitScore} className="mb-3 h-2.5 bg-amber-100 dark:bg-amber-950/40" />
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>Utilisation estimée du budget</span>
                          <span className="tabular-nums">{budgetUsePercent}%</span>
                        </div>
                        <Progress value={budgetUsePercent} className="h-2 bg-slate-100 dark:bg-slate-800" />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline" className="font-normal">
                            {BUCKET_LABEL[proposal.budgetBucket] ?? proposal.budgetBucket}
                          </Badge>
                          <Badge variant="secondary" className="font-normal">
                            ~{proposal.menu.estimatedPricePerHead}&nbsp;€ / convive (formule)
                          </Badge>
                        </div>
                      </div>

                      <Card className="border-amber-100/80 bg-gradient-to-br from-amber-50/50 to-white shadow-sm dark:border-amber-900/30 dark:from-amber-950/20 dark:to-slate-900">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed className="h-5 w-5 text-amber-700 dark:text-amber-500" />
                            <CardTitle className="text-base">Menu proposé</CardTitle>
                          </div>
                          <CardDescription>{proposal.menu.style}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {proposal.menu.items.map((x) => (
                              <li
                                key={x}
                                className="flex gap-2 text-sm text-slate-800 dark:text-slate-200"
                              >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                <span>{x}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="border-violet-100/80 shadow-sm dark:border-violet-900/30">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-violet-600" />
                            <CardTitle className="text-base">Décoration &amp; ambiance</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {proposal.decor.map((d) => (
                              <span
                                key={d}
                                className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-900 dark:bg-violet-950/50 dark:text-violet-100"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-sky-100/80 shadow-sm dark:border-sky-900/30">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-sky-600" />
                            <CardTitle className="text-base">Planning</CardTitle>
                          </div>
                          <CardDescription>Repères jusqu&apos;au jour&nbsp;J</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ol className="relative space-y-0 border-l-2 border-sky-200 pl-6 dark:border-sky-900">
                            {proposal.timeline.map((step, i) => (
                              <li key={`${step.t}-${i}`} className="relative mb-6 last:mb-0">
                                <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-900" />
                                <p className="font-mono text-xs font-semibold uppercase text-sky-700 dark:text-sky-400">
                                  {step.t}
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{step.action}</p>
                              </li>
                            ))}
                          </ol>
                        </CardContent>
                      </Card>

                      <Card className="overflow-hidden border-amber-200/60 bg-gradient-to-r from-amber-50 via-orange-50/80 to-white shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-slate-900">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-orange-700 dark:text-orange-500" />
                            <CardTitle className="text-base">Accroche commerciale</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm italic leading-relaxed text-amber-950 dark:text-amber-100/90">
                            {proposal.marketingCopy}
                          </p>
                        </CardContent>
                      </Card>

                      {proposal.aiNote ? (
                        <Card className="border-emerald-200/80 bg-emerald-50/60 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/25">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                              <Brain className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                              <CardTitle className="text-base">Conseil expert (IA)</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm leading-relaxed text-emerald-950 dark:text-emerald-100/90">{proposal.aiNote}</p>
                          </CardContent>
                        </Card>
                      ) : null}

                      {isAdmin && rawPayload ? (
                        <Collapsible open={techOpen} onOpenChange={setTechOpen}>
                          <div className="flex justify-center pt-2">
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-dashed border-stone-300 text-slate-600 hover:bg-stone-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                <Code2 className="h-4 w-4" />
                                Voir détails techniques
                                <ChevronDown className={cn("h-4 w-4 transition-transform", techOpen && "rotate-180")} />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <Card className="mt-4 border-slate-600 bg-slate-950 dark:border-slate-700">
                              <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
                                  <Code2 className="h-4 w-4" />
                                  Réponse API brute (admin)
                                </CardTitle>
                                <CardDescription className="text-slate-500">
                                  Réservé au débogage — non visible pour le personnel sans rôle administrateur.
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <pre className="max-h-[380px] overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-emerald-300">
                                  {JSON.stringify(rawPayload, null, 2)}
                                </pre>
                              </CardContent>
                            </Card>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
