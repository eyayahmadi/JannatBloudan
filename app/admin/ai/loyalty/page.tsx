"use client"

import { useEffect, useState } from "react"
import {
  Star,
  Trophy,
  Grid,
  Moon,
  Crown,
  Heart,
  Target,
  Flame,
  Award,
  TrendingUp,
  Users,
  Zap,
  Lock,
  CheckCircle,
  Brain,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Tier = {
  name: string
  color: string
  minPoints: number
  maxPoints: number
  perks: string[]
}

type Challenge = {
  id: string
  title: string
  reward: number
  progress: number
  target: number
  active: boolean
}

type Achievement = {
  id: string
  title: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
}

type LeaderboardEntry = {
  rank: number
  name: string
  points: number
  tier: string
}

type LoyaltyData = {
  currentPoints: number
  tier: Tier
  challenges: Challenge[]
  achievements: Achievement[]
  leaderboard: LeaderboardEntry[]
  stats: {
    totalPointsDistributed: number
    activeChallenges: number
    unlockRate: number
  }
  algorithm: {
    name: string
    description: string
    factors: string[]
  }
}

const ICON_MAP: Record<string, React.ElementType> = {
  Star,
  Trophy,
  Grid,
  Moon,
  Crown,
  Heart,
}

const TIER_COLORS: Record<string, string> = {
  Bronze: "from-orange-700 to-orange-500",
  Silver: "from-gray-500 to-gray-300",
  Gold: "from-yellow-600 to-yellow-400",
  Platinum: "from-cyan-600 to-cyan-400",
  Diamond: "from-violet-600 to-violet-400",
}

const TIER_BG: Record<string, string> = {
  Bronze: "bg-orange-100 text-orange-800",
  Silver: "bg-gray-100 text-gray-700",
  Gold: "bg-yellow-100 text-yellow-800",
  Platinum: "bg-cyan-100 text-cyan-800",
  Diamond: "bg-violet-100 text-violet-800",
}

const FALLBACK: LoyaltyData = {
  currentPoints: 450,
  tier: {
    name: "Silver",
    color: "#9CA3AF",
    minPoints: 200,
    maxPoints: 600,
    perks: ["5% de reduction", "Livraison prioritaire", "Dessert offert le jour d'anniversaire"],
  },
  challenges: [
    { id: "c1", title: "Commander 5 fois cette semaine", reward: 50, progress: 3, target: 5, active: true },
    { id: "c2", title: "Essayer 3 nouveaux plats", reward: 75, progress: 1, target: 3, active: true },
    { id: "c3", title: "Depenser 100 EUR en une commande", reward: 100, progress: 0, target: 1, active: true },
  ],
  achievements: [
    { id: "a1", title: "Premiere commande", icon: "Star", unlocked: true, unlockedAt: "2024-10-15" },
    { id: "a2", title: "10 commandes", icon: "Trophy", unlocked: true, unlockedAt: "2024-11-02" },
    { id: "a3", title: "Toutes categories", icon: "Grid", unlocked: false },
    { id: "a4", title: "Commande nocturne", icon: "Moon", unlocked: true, unlockedAt: "2024-11-20" },
    { id: "a5", title: "Top 10 mensuel", icon: "Crown", unlocked: false },
    { id: "a6", title: "Parrain fidele", icon: "Heart", unlocked: false },
  ],
  leaderboard: [
    { rank: 1, name: "Yasmine K.", points: 1240, tier: "Platinum" },
    { rank: 2, name: "Omar T.", points: 980, tier: "Gold" },
    { rank: 3, name: "Leila M.", points: 870, tier: "Gold" },
    { rank: 4, name: "Karim S.", points: 610, tier: "Silver" },
    { rank: 5, name: "Nour A.", points: 450, tier: "Silver" },
  ],
  stats: { totalPointsDistributed: 23500, activeChallenges: 12, unlockRate: 47 },
  algorithm: {
    name: "Scoring Dynamique Adaptatif",
    description:
      "L'IA ajuste les recompenses en temps reel selon la frequence d'achat, la valeur du panier moyen et l'engagement dans les defis.",
    factors: [
      "Frequence de commande (poids 35%)",
      "Valeur panier moyen (poids 25%)",
      "Participation aux defis (poids 20%)",
      "Anciennete du compte (poids 10%)",
      "Parrainages actifs (poids 10%)",
    ],
  },
}

function normalizeLoyaltyPayload(raw: unknown): LoyaltyData {
  if (!raw || typeof raw !== "object") return FALLBACK
  const r = raw as Record<string, unknown>

  const pts =
    typeof r.currentPoints === "number" && Number.isFinite(r.currentPoints)
      ? r.currentPoints
      : typeof r.points === "number" && Number.isFinite(r.points)
        ? r.points
        : FALLBACK.currentPoints

  const nextTierRaw = r.nextTier
  const nextMin =
    nextTierRaw && typeof nextTierRaw === "object" && typeof (nextTierRaw as { min?: unknown }).min === "number"
      ? (nextTierRaw as { min: number }).min
      : null

  let tier = FALLBACK.tier
  const tr = r.tier
  if (tr && typeof tr === "object") {
    const o = tr as Record<string, unknown>
    const name = typeof o.name === "string" ? o.name : FALLBACK.tier.name
    const color = typeof o.color === "string" ? o.color : FALLBACK.tier.color
    const minPoints = typeof o.minPoints === "number" ? o.minPoints : typeof o.min === "number" ? o.min : FALLBACK.tier.minPoints
    const maxPointsRaw =
      typeof o.maxPoints === "number" ? o.maxPoints : typeof o.max === "number" ? o.max : FALLBACK.tier.maxPoints
    /** Fin de barre = seuil palier suivant si connu */
    const maxPointsGoal =
      typeof nextMin === "number" && nextMin > minPoints ? nextMin : Math.max(minPoints + 1, maxPointsRaw)
    const perks = Array.isArray(o.perks)
      ? o.perks.filter((x): x is string => typeof x === "string")
      : FALLBACK.tier.perks
    tier = { name, color, minPoints, maxPoints: maxPointsGoal, perks }
  }

  let challenges = FALLBACK.challenges
  if (Array.isArray(r.challenges)) {
    challenges = r.challenges
      .map((item): Challenge | null => {
        if (!item || typeof item !== "object") return null
        const c = item as Record<string, unknown>
        if (typeof c.id !== "string" || typeof c.title !== "string") return null
        const reward = typeof c.reward === "number" ? c.reward : 0
        const progress = typeof c.progress === "number" ? c.progress : 0
        const target = typeof c.target === "number" && c.target > 0 ? c.target : 1
        const active = typeof c.active === "boolean" ? c.active : true
        return { id: c.id, title: c.title, reward, progress, target, active }
      })
      .filter((x): x is Challenge => x !== null)
    if (!challenges.length) challenges = FALLBACK.challenges
  }

  function iconFromApi(ic: unknown): string {
    if (typeof ic !== "string" || !ic.trim()) return "Star"
    const lower = ic.trim().toLowerCase()
    const key = lower.charAt(0).toUpperCase() + lower.slice(1)
    return key in ICON_MAP ? key : "Star"
  }

  let achievements = FALLBACK.achievements
  if (Array.isArray(r.achievements)) {
    achievements = r.achievements
      .map((item): Achievement | null => {
        if (!item || typeof item !== "object") return null
        const a = item as Record<string, unknown>
        if (typeof a.id !== "string" || typeof a.title !== "string") return null
        const unlocked = typeof a.unlocked === "boolean" ? a.unlocked : !!a.date
        const unlockedAt =
          typeof a.unlockedAt === "string" ? a.unlockedAt : typeof a.date === "string" ? a.date : undefined
        return {
          id: a.id,
          title: a.title,
          icon: iconFromApi(a.icon),
          unlocked,
          unlockedAt,
        }
      })
      .filter((x): x is Achievement => x !== null)
    if (!achievements.length) achievements = FALLBACK.achievements
  }

  let leaderboard = FALLBACK.leaderboard
  if (Array.isArray(r.leaderboard)) {
    leaderboard = r.leaderboard
      .map((item): LeaderboardEntry | null => {
        if (!item || typeof item !== "object") return null
        const e = item as Record<string, unknown>
        if (typeof e.rank !== "number" || typeof e.name !== "string") return null
        const points = typeof e.points === "number" ? e.points : 0
        const tierName = typeof e.tier === "string" ? e.tier : "Bronze"
        return { rank: e.rank, name: e.name, points, tier: tierName }
      })
      .filter((x): x is LeaderboardEntry => x !== null)
    if (!leaderboard.length) leaderboard = FALLBACK.leaderboard
  }

  let stats = FALLBACK.stats
  if (r.stats && typeof r.stats === "object") {
    const s = r.stats as Record<string, unknown>
    stats = {
      totalPointsDistributed:
        typeof s.totalPointsDistributed === "number"
          ? s.totalPointsDistributed
          : FALLBACK.stats.totalPointsDistributed,
      activeChallenges: typeof s.activeChallenges === "number" ? s.activeChallenges : FALLBACK.stats.activeChallenges,
      unlockRate: typeof s.unlockRate === "number" ? s.unlockRate : FALLBACK.stats.unlockRate,
    }
  } else {
    const activeChallengesCount = challenges.filter((c) => c.active).length
    const unlocked = achievements.filter((a) => a.unlocked).length
    stats = {
      totalPointsDistributed:
        leaderboard.length > 0
          ? Math.round(leaderboard.reduce((sum, row) => sum + Math.max(0, row.points), 0) * 18)
          : FALLBACK.stats.totalPointsDistributed,
      activeChallenges: activeChallengesCount || FALLBACK.stats.activeChallenges,
      unlockRate:
        achievements.length > 0 ? Math.round((unlocked / achievements.length) * 100) : FALLBACK.stats.unlockRate,
    }
  }

  let algorithm = FALLBACK.algorithm
  const alg = r.algorithm
  if (typeof alg === "string") {
    algorithm = { ...FALLBACK.algorithm, name: alg }
  } else if (alg && typeof alg === "object") {
    const o = alg as Record<string, unknown>
    const name = typeof o.name === "string" ? o.name : FALLBACK.algorithm.name
    const description =
      typeof o.description === "string" ? o.description : FALLBACK.algorithm.description
    const factors =
      Array.isArray(o.factors) && o.factors.every((f): f is string => typeof f === "string")
        ? (o.factors as string[])
        : FALLBACK.algorithm.factors
    algorithm = { name, description, factors }
  }

  return {
    currentPoints: pts,
    tier,
    challenges,
    achievements,
    leaderboard,
    stats,
    algorithm,
  }
}

export default function LoyaltyPage() {
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/ai/loyalty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points: 450 }),
        })
        if (!res.ok) throw new Error("fetch failed")
        setData(normalizeLoyaltyPayload(await res.json()))
      } catch {
        setData(FALLBACK)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const d = data ?? FALLBACK
  const denom = Math.max(1e-6, d.tier.maxPoints - d.tier.minPoints)
  const pts = typeof d.currentPoints === "number" && Number.isFinite(d.currentPoints) ? d.currentPoints : 0
  const tierProgress = ((pts - d.tier.minPoints) / denom) * 100

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin/ai" />

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-amber-950 sm:text-3xl">
              Fidelite &amp; Gamification
            </h1>
            <p className="mt-1 text-sm text-amber-800/70">
              Agent IA de gestion du programme de fidelite et des recompenses
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-amber-700">Chargement...</div>
          ) : (
            <>
              {/* ── Tier Display ── */}
              <Card className="overflow-hidden border-0 shadow-xl">
                <div
                  className={`bg-gradient-to-r ${TIER_COLORS[d.tier.name] ?? "from-amber-700 to-orange-600"} p-6 text-white sm:p-8`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-widest opacity-80">
                        Tier actuel
                      </p>
                      <h2 className="mt-1 text-3xl font-extrabold sm:text-4xl">{d.tier.name}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-black tabular-nums sm:text-5xl">
                        {pts.toLocaleString("fr-FR")}
                      </p>
                      <p className="text-sm opacity-80">points</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between text-xs opacity-80">
                      <span>{d.tier.minPoints} pts</span>
                      <span>{d.tier.maxPoints} pts — prochain palier</span>
                    </div>
                    <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/25">
                      <div
                        className="h-full rounded-full bg-white transition-all duration-700"
                        style={{ width: `${Math.min(tierProgress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {d.tier.perks.map((perk) => (
                      <span
                        key={perk}
                        className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm"
                      >
                        {perk}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>

              {/* ── Challenges ── */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-950">
                  <Target className="h-5 w-5 text-orange-600" />
                  Defis en cours
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {d.challenges.map((ch) => {
                    const pct = Math.round((ch.progress / ch.target) * 100)
                    return (
                      <Card key={ch.id} className="relative overflow-hidden">
                        {ch.active && (
                          <Badge className="absolute right-3 top-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Actif
                          </Badge>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold leading-snug pr-14">
                            {ch.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-xs text-amber-700">
                            <Flame className="h-3.5 w-3.5 text-orange-500" />
                            +{ch.reward} points
                          </div>
                          <div>
                            <div className="flex justify-between text-[11px] text-amber-700/80">
                              <span>
                                {ch.progress}/{ch.target}
                              </span>
                              <span>{pct}%</span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-amber-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>

              {/* ── Achievements ── */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-950">
                  <Award className="h-5 w-5 text-orange-600" />
                  Badges &amp; Succes
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {d.achievements.map((ach) => {
                    const IconComp = ICON_MAP[ach.icon] ?? Star
                    return (
                      <div
                        key={ach.id}
                        className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${
                          ach.unlocked
                            ? "border-amber-200 bg-white shadow-sm"
                            : "border-gray-200 bg-gray-50 opacity-50 grayscale"
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${
                            ach.unlocked
                              ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {ach.unlocked ? (
                            <IconComp className="h-6 w-6" />
                          ) : (
                            <Lock className="h-5 w-5" />
                          )}
                        </div>
                        <p className="text-xs font-semibold leading-tight text-amber-950">
                          {ach.title}
                        </p>
                        {ach.unlocked && ach.unlockedAt ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                            <CheckCircle className="h-3 w-3" />
                            {new Date(ach.unlockedAt).toLocaleDateString("fr-FR")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Verrouille</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* ── Leaderboard ── */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-950">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Classement
                </h2>
                <Card>
                  <CardContent className="divide-y p-0">
                    {d.leaderboard.map((entry) => (
                      <div
                        key={entry.rank}
                        className="flex items-center gap-4 px-5 py-3"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            entry.rank <= 3
                              ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {entry.rank}
                        </span>
                        <span className="flex-1 font-medium text-amber-950">
                          {entry.name}
                        </span>
                        <span className="tabular-nums text-sm font-semibold text-amber-800">
                          {entry.points.toLocaleString("fr-FR")} pts
                        </span>
                        <Badge
                          className={`${TIER_BG[entry.tier] ?? "bg-amber-100 text-amber-800"} hover:${TIER_BG[entry.tier] ?? "bg-amber-100"}`}
                        >
                          {entry.tier}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>

              {/* ── Stats ── */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-950">
                  <Zap className="h-5 w-5 text-orange-600" />
                  Statistiques
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="flex flex-col items-center gap-1 py-6">
                      <Users className="h-6 w-6 text-orange-600" />
                      <p className="text-2xl font-bold tabular-nums text-amber-950">
                        {d.stats.totalPointsDistributed.toLocaleString("fr-FR")}
                      </p>
                      <p className="text-xs text-amber-700">Points distribues</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex flex-col items-center gap-1 py-6">
                      <Target className="h-6 w-6 text-orange-600" />
                      <p className="text-2xl font-bold tabular-nums text-amber-950">
                        {d.stats.activeChallenges}
                      </p>
                      <p className="text-xs text-amber-700">Defis actifs</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex flex-col items-center gap-1 py-6">
                      <Award className="h-6 w-6 text-orange-600" />
                      <p className="text-2xl font-bold tabular-nums text-amber-950">
                        {d.stats.unlockRate}%
                      </p>
                      <p className="text-xs text-amber-700">Taux de deblocage</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ── Algorithm Info ── */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-950">
                  <Brain className="h-5 w-5 text-orange-600" />
                  Algorithme IA
                </h2>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{d.algorithm.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-amber-800/80">{d.algorithm.description}</p>
                    <ul className="space-y-1">
                      {d.algorithm.factors.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-sm text-amber-900"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            </>
          )}
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
