"use client"

import Link from "next/link"
import {
  Brain,
  MessageCircle,
  Package,
  DollarSign,
  AlertTriangle,
  ChefHat,
  Megaphone,
  Gift,
  Heart,
  TrendingUp,
  Bot,
  Activity,
  Bell,
  Sparkles,
  BarChart3,
  Database,
  ShoppingBag,
  Zap,
  Route,
  PieChart,
  Gavel,
  GraduationCap,
  Rocket,
  PartyPopper,
  type LucideIcon,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Agent = {
  number: number
  name: string
  slug: string | null
  icon: LucideIcon
  status: "active" | "inactive"
  metric: string
  description: string
  gradient: string
  iconBg: string
}

const AGENTS: Agent[] = [
  {
    number: 1,
    name: "Agent Recommandation",
    slug: "recommendations",
    icon: Brain,
    status: "active",
    metric: "847 recommandations",
    description: "Suggestions personnalisees basees sur les preferences et le contexte",
    gradient: "from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 dark:from-violet-500/20 dark:via-purple-500/10 dark:to-fuchsia-500/20",
    iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300",
  },
  {
    number: 2,
    name: "Agent Chatbot",
    slug: null,
    icon: MessageCircle,
    status: "active",
    metric: "1 204 conversations",
    description: "Actif — widget integre dans toutes les pages client",
    gradient: "from-blue-500/10 via-sky-500/5 to-cyan-500/10 dark:from-blue-500/20 dark:via-sky-500/10 dark:to-cyan-500/20",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
  },
  {
    number: 3,
    name: "Agent Stock Predictif",
    slug: "stock",
    icon: Package,
    status: "active",
    metric: "3 alertes critiques",
    description: "Predictions de rupture et commandes fournisseur automatisees",
    gradient: "from-emerald-500/10 via-green-500/5 to-teal-500/10 dark:from-emerald-500/20 dark:via-green-500/10 dark:to-teal-500/20",
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  {
    number: 4,
    name: "Agent Pricing Dynamique",
    slug: "pricing",
    icon: DollarSign,
    status: "active",
    metric: "+12% revenus",
    description: "Ajustement des prix en temps reel selon la demande et la concurrence",
    gradient: "from-amber-500/10 via-yellow-500/5 to-orange-500/10 dark:from-amber-500/20 dark:via-yellow-500/10 dark:to-orange-500/20",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300",
  },
  {
    number: 5,
    name: "Agent Detection Anomalies",
    slug: "anomalies",
    icon: AlertTriangle,
    status: "active",
    metric: "12 alertes",
    description: "Surveillance continue des metriques avec detection en temps reel",
    gradient: "from-red-500/10 via-rose-500/5 to-pink-500/10 dark:from-red-500/20 dark:via-rose-500/10 dark:to-pink-500/20",
    iconBg: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300",
  },
  {
    number: 6,
    name: "Agent Optimisation Cuisine",
    slug: "kitchen",
    icon: ChefHat,
    status: "active",
    metric: "18% plus rapide",
    description: "Optimisation de la file de preparation et des temps de cuisson",
    gradient: "from-orange-500/10 via-amber-500/5 to-yellow-500/10 dark:from-orange-500/20 dark:via-amber-500/10 dark:to-yellow-500/20",
    iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300",
  },
  {
    number: 7,
    name: "Agent Analytics & BI",
    slug: "analytics",
    icon: BarChart3,
    status: "active",
    metric: "12 insights / jour",
    description: "KPIs, rapports automatiques et resumes en langage naturel pour la direction",
    gradient: "from-sky-500/10 via-indigo-500/5 to-blue-500/10 dark:from-sky-500/20 dark:via-indigo-500/10 dark:to-blue-500/20",
    iconBg: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  },
  {
    number: 8,
    name: "Agent Marketing Intelligent",
    slug: "marketing",
    icon: Megaphone,
    status: "active",
    metric: "5 campagnes actives",
    description: "Campagnes ciblees et segmentation automatique de la clientele",
    gradient: "from-pink-500/10 via-rose-500/5 to-fuchsia-500/10 dark:from-pink-500/20 dark:via-rose-500/10 dark:to-fuchsia-500/20",
    iconBg: "bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300",
  },
  {
    number: 9,
    name: "Agent Fidelite",
    slug: "loyalty",
    icon: Gift,
    status: "active",
    metric: "2 340 membres",
    description: "Gestion des paliers, defis et recompenses de fidelite",
    gradient: "from-indigo-500/10 via-blue-500/5 to-violet-500/10 dark:from-indigo-500/20 dark:via-blue-500/10 dark:to-violet-500/20",
    iconBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300",
  },
  {
    number: 10,
    name: "Agent Analyse Sentiment",
    slug: "sentiment",
    icon: Heart,
    status: "active",
    metric: "94% positifs",
    description: "Analyse en temps reel du sentiment des avis et retours clients",
    gradient: "from-rose-500/10 via-pink-500/5 to-red-500/10 dark:from-rose-500/20 dark:via-pink-500/10 dark:to-red-500/20",
    iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300",
  },
  {
    number: 11,
    name: "Agent Prevision Business",
    slug: "forecast",
    icon: TrendingUp,
    status: "active",
    metric: "Prevision 30j",
    description: "Previsions de revenus, frequentation et tendances saisonnieres",
    gradient: "from-cyan-500/10 via-teal-500/5 to-emerald-500/10 dark:from-cyan-500/20 dark:via-teal-500/10 dark:to-emerald-500/20",
    iconBg: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-300",
  },
  {
    number: 12,
    name: "Agent Vision Culinaire",
    slug: "vision",
    icon: Sparkles,
    status: "active",
    metric: "156 analyses",
    description: "Analyse visuelle des plats par IA pour garantir la presentation et la qualite",
    gradient: "from-fuchsia-500/10 via-pink-500/5 to-purple-500/10 dark:from-fuchsia-500/20 dark:via-pink-500/10 dark:to-purple-500/20",
    iconBg: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/50 dark:text-fuchsia-300",
  },
  {
    number: 13,
    name: "Agent Qualite",
    slug: "quality",
    icon: Activity,
    status: "active",
    metric: "99.2% conformite",
    description: "Controle qualite automatise et suivi de la conformite des processus",
    gradient: "from-lime-500/10 via-green-500/5 to-emerald-500/10 dark:from-lime-500/20 dark:via-green-500/10 dark:to-emerald-500/20",
    iconBg: "bg-lime-100 text-lime-600 dark:bg-lime-900/50 dark:text-lime-300",
  },
  {
    number: 14,
    name: "Agent Reservation",
    slug: "reservation",
    icon: Bell,
    status: "active",
    metric: "34 reservations",
    description: "Gestion intelligente des reservations et optimisation des tables",
    gradient: "from-teal-500/10 via-cyan-500/5 to-sky-500/10 dark:from-teal-500/20 dark:via-cyan-500/10 dark:to-sky-500/20",
    iconBg: "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300",
  },
  {
    number: 15,
    name: "Agent Coordinator",
    slug: "coordinator",
    icon: Brain,
    status: "active",
    metric: "23 agents pilotes",
    description: "Cerveau central orchestrant tous les agents et leurs communications",
    gradient: "from-violet-500/10 via-purple-500/5 to-indigo-500/10 dark:from-violet-500/20 dark:via-purple-500/10 dark:to-indigo-500/20",
    iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300",
  },
  {
    number: 16,
    name: "Agent Memoire & RAG",
    slug: "memory",
    icon: Database,
    status: "active",
    metric: "Preferences + historique",
    description: "Memoire long terme, retrieval lexical, pret pour vector DB (Pinecone / Weaviate)",
    gradient: "from-slate-500/10 via-zinc-500/5 to-neutral-500/10 dark:from-slate-500/20 dark:via-zinc-500/10 dark:to-neutral-500/20",
    iconBg: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  },
  {
    number: 17,
    name: "Agent Upselling Intelligent",
    slug: "upsell",
    icon: ShoppingBag,
    status: "active",
    metric: "Desserts & extras",
    description: "Suggestions contextuelles rush / calme, remises ciblees",
    gradient: "from-amber-500/10 via-orange-500/5 to-yellow-500/10 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-yellow-500/20",
    iconBg: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  },
  {
    number: 18,
    name: "Agent Optimisation Temps Reel",
    slug: "realtime-ops",
    icon: Zap,
    status: "active",
    metric: "Latence & flux",
    description: "Surveillance charge, routage cuisine, actions automatiques",
    gradient: "from-yellow-500/10 via-amber-500/5 to-orange-500/10 dark:from-yellow-500/20 dark:via-amber-500/10 dark:to-orange-500/20",
    iconBg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  },
  {
    number: 19,
    name: "Agent Customer Journey",
    slug: "customer-journey",
    icon: Route,
    status: "active",
    metric: "Funnel complet",
    description: "Analyse parcours entree → paiement, fuites et gains",
    gradient: "from-cyan-500/10 via-sky-500/5 to-blue-500/10 dark:from-cyan-500/20 dark:via-sky-500/10 dark:to-blue-500/20",
    iconBg: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200",
  },
  {
    number: 20,
    name: "Agent Menu Engineering",
    slug: "menu-engineering",
    icon: PieChart,
    status: "active",
    metric: "Stars & cash cows",
    description: "Matrice popularite / marge, actions sur low performers",
    gradient: "from-indigo-500/10 via-violet-500/5 to-purple-500/10 dark:from-indigo-500/20 dark:via-violet-500/10 dark:to-purple-500/20",
    iconBg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200",
  },
  {
    number: 21,
    name: "Agent Decision Automatique",
    slug: "auto-decisions",
    icon: Gavel,
    status: "active",
    metric: "Promo & stock",
    description: "Decisions autonomes sous seuils — governance et audit",
    gradient: "from-red-500/10 via-orange-500/5 to-amber-500/10 dark:from-red-500/20 dark:via-orange-500/10 dark:to-amber-500/20",
    iconBg: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  },
  {
    number: 22,
    name: "Registry Auto-Learning",
    slug: "learning",
    icon: GraduationCap,
    status: "active",
    metric: "Drift & policies",
    description: "Online learning, bandits, versions de modeles (demo)",
    gradient: "from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/10 dark:to-cyan-500/20",
    iconBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  },
  {
    number: 23,
    name: "Innovations NEXT GEN",
    slug: "next-gen",
    icon: Rocket,
    status: "active",
    metric: "Roadmap 2026+",
    description: "Emotion AI, geo-fence, predictive ordering, split bill, cuisine live…",
    gradient: "from-fuchsia-500/10 via-pink-500/5 to-rose-500/10 dark:from-fuchsia-500/20 dark:via-pink-500/10 dark:to-rose-500/20",
    iconBg: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-200",
  },
  {
    number: 24,
    name: "Agent Event Planner",
    slug: "event-planner",
    icon: PartyPopper,
    status: "active",
    metric: "Menus, decor, budget",
    description: "Propose menu, decoration, timeline et campagne marketing pour chaque evenement",
    gradient: "from-rose-500/10 via-pink-500/5 to-amber-500/10 dark:from-rose-500/20 dark:via-pink-500/10 dark:to-amber-500/20",
    iconBg: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200",
  },
]

const SUMMARY = [
  { label: "Total Agents", value: "24", icon: Bot, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/50" },
  { label: "Agents Actifs", value: "24", icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/50" },
  { label: "Alertes Generees", value: "12", icon: Bell, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/50" },
  { label: "Recommandations", value: "847", icon: Sparkles, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/50" },
]

export default function AIAgentHubPage() {
  const healthScore = 85

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-slate-50 dark:bg-slate-950">
        <SiteHeader backHref="/admin" backLabel="Dashboard" hideMainNav />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Centre AI Agents
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Supervision et pilotage de tous les agents intelligents
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {SUMMARY.map((s) => (
              <Card key={s.label} className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <CardContent className="flex items-center gap-4 py-0">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Agent Grid */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTS.map((agent) => {
              const Icon = agent.icon
              return (
                <Card
                  key={agent.number}
                  className={`group relative overflow-hidden border-white/60 bg-gradient-to-br ${agent.gradient} backdrop-blur transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border-slate-800`}
                >
                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${agent.iconBg} shadow-sm`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                            {agent.name}
                          </CardTitle>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Agent #{agent.number}</p>
                        </div>
                      </div>
                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Actif
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {agent.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-white/60 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                        {agent.metric}
                      </span>
                      {agent.slug ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/ai/${agent.slug}`} className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200">
                            Voir details →
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs italic text-slate-400 dark:text-slate-500">Widget integre</span>
                      )}
                    </div>
                  </CardContent>

                  {/* Decorative gradient line */}
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </Card>
              )
            })}
          </div>

          {/* System Health */}
          <Card className="border-white/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-900 dark:text-white">Systeme de sante</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Etat global de la plateforme AI</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Score de sante global</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{healthScore}/100</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 transition-all duration-700"
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  23/23 agents operationnels
                </span>
                <span>Derniere execution: il y a 2 minutes</span>
                <span>Latence moyenne: 45ms</span>
              </div>
            </CardContent>
          </Card>
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
