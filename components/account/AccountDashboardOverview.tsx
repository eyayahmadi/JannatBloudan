"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Gift,
  Heart,
  Mail,
  Package,
  PartyPopper,
  Percent,
  Phone,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Ticket,
  TrendingUp,
  Crown,
  Sun,
  Moon,
  Coffee,
  UtensilsCrossed,
} from "lucide-react"
import { AccountAIConcierge } from "@/components/account/AccountAIConcierge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AccountDashboardNavigateId } from "@/lib/account/dashboard-nav"
import { isPortalDemoEnabled } from "@/lib/config/portal-demo"
import { cn } from "@/lib/utils"

type Favorite = { name: string; orders: number; image: string }

export type { AccountDashboardNavigateId }

type Props = {
  profile: { name: string; email: string; phone: string; loyaltyPoints: number }
  initials: string
  isLoggedIn: boolean
  favorites: Favorite[]
  onNavigate: (id: AccountDashboardNavigateId) => void
}

const PREVIOUS_ORDERS = [
  {
    id: "1",
    label: "Menu Mezzé & grillades",
    image: "/pizza-margherita.png",
    date: "2025-04-28",
    total: 48.5,
    items: 4,
  },
  {
    id: "2",
    label: "Livraison — Shawarma & fattoush",
    image: "/classic-burger.png",
    date: "2025-04-12",
    total: 32.2,
    items: 3,
  },
  {
    id: "3",
    label: "Sur place — Brunch oriental",
    image: "/pasta-carbonara.png",
    date: "2025-03-30",
    total: 56.0,
    items: 5,
  },
]

const PROMOS = [
  {
    id: "p1",
    title: "-15% fidélité",
    subtitle: "Sur toute la carte ce week-end",
    code: "JBLOVE15",
    tone: "from-[color:var(--lux-bordeaux)] to-amber-900",
  },
  {
    id: "p2",
    title: "Happy hour",
    subtitle: "Boissons -50% · 17h–19h",
    code: null,
    tone: "from-amber-600 to-orange-700",
  },
  {
    id: "p3",
    title: "1 dessert acheté = 1 offert",
    subtitle: "Pour les membres Gold & VIP",
    code: "DOUX2",
    tone: "from-rose-600 to-[color:var(--lux-bordeaux)]",
  },
]

const UPCOMING_RES = {
  date: "2025-05-14",
  time: "20:00",
  guests: 4,
  zone: "Terrasse",
  label: "Table n°5",
}

const UPCOMING_EVENT = {
  title: "Soirée Orientale Live",
  date: "2025-05-20",
  time: "21:00",
  ticketCode: "EVT-DEMO-ORIENT-01",
}

const DEMO_ACTIVITY_FEED = [
  { id: "a1", icon: UtensilsCrossed, text: "Nouveau plat : kebab Alep aux herbes fraîches", time: "Il y a 2 j", tone: "bg-emerald-50 text-emerald-800" },
  { id: "a2", icon: PartyPopper, text: "Soirée Orientale — places limitées le 20 mai", time: "Il y a 3 j", tone: "bg-violet-50 text-violet-800" },
  { id: "a3", icon: Percent, text: "Code JBLOVE15 : -15% ce week-end", time: "Il y a 5 j", tone: "bg-amber-50 text-amber-900" },
  { id: "a4", icon: CalendarCheck, text: "Rappel : votre table terrasse le 14 mai à 20h", time: "Bientôt", tone: "bg-[color:var(--lux-cream)] text-[color:var(--lux-bordeaux)]" },
]

function ticketQrSrc(code: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(`bloudan-ticket:${code}`)}`
}

function loyaltyTier(points: number): {
  label: string
  short: string
  nextAt: number
  accent: string
  Icon: typeof Star
} {
  if (points >= 700)
    return { label: "VIP Jannat", short: "VIP", nextAt: 1000, accent: "from-violet-500 to-purple-900", Icon: Crown }
  if (points >= 350)
    return { label: "Gold", short: "Gold", nextAt: 700, accent: "from-amber-400 to-yellow-700", Icon: Star }
  if (points >= 150)
    return { label: "Silver", short: "Silver", nextAt: 350, accent: "from-slate-300 to-slate-500", Icon: Star }
  return { label: "Membre", short: "Membre", nextAt: 150, accent: "from-amber-700 to-[color:var(--lux-bordeaux)]", Icon: Gift }
}

function useGreeting() {
  const [hour, setHour] = useState<number | null>(null)
  useEffect(() => {
    setHour(new Date().getHours())
    const t = window.setInterval(() => setHour(new Date().getHours()), 60000)
    return () => window.clearInterval(t)
  }, [])
  return useMemo(() => {
    if (hour == null) return { text: "Bonjour", Icon: Sun, sub: "Ravi de vous revoir chez Jannat Bloudan." }
    if (hour < 12) return { text: "Bonjour", Icon: Coffee, sub: "Une belle matinée pour découvrir nos saveurs." }
    if (hour < 18) return { text: "Bon après-midi", Icon: Sun, sub: "Le menu vous attend, chaud ou à emporter." }
    return { text: "Bonsoir", Icon: Moon, sub: "Soirée mezze ou grillades ? Nous vous accompagnons." }
  }, [hour])
}

function useCountdown(targetIso: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const t = new Date(targetIso).getTime() - now
  if (t <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true }
  const s = Math.floor(t / 1000)
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    sec: s % 60,
    done: false,
  }
}

export function AccountDashboardOverview({
  profile,
  initials,
  isLoggedIn,
  favorites,
  onNavigate,
}: Props) {
  const firstName = profile.name.split(/\s+/).filter(Boolean)[0] ?? "vous"
  const greet = useGreeting()
  const dashDemo = isPortalDemoEnabled()
  const previousOrders = dashDemo ? PREVIOUS_ORDERS : []
  const promos = dashDemo ? PROMOS : []
  const activityFeed = dashDemo ? DEMO_ACTIVITY_FEED : []
  const points = profile.loyaltyPoints
  const tier = loyaltyTier(points)
  const progressPct = Math.min(100, (points / tier.nextAt) * 100)
  const pointsToNext = Math.max(0, tier.nextAt - points)
  const eventCountdown = useCountdown(
    dashDemo ? `${UPCOMING_EVENT.date}T${UPCOMING_EVENT.time}:00` : "1970-01-01T00:00:00",
  )

  const topFavorite = favorites[0]?.name ?? "nos grillades syriennes"

  const smartPicks = useMemo(() => {
    const h = new Date().getHours()
    const picks = [
      {
        icon: Flame,
        title: `Vous aimez les ${topFavorite.toLowerCase().includes("pizza") ? "saveurs méditerranéennes" : "grillades syriennes"}`,
        desc: "Découvrez le mix grill chef et les mezzés du jour.",
        action: "Voir le menu" as const,
        nav: "menu" as const,
      },
      {
        icon: Sparkles,
        title: "Nouveau : baklava pistache maison",
        desc: "Dessert signature — disponible toute la semaine.",
        action: "Commander",
        nav: "order" as const,
      },
      {
        icon: Clock,
        title: h >= 17 && h < 19 ? "Happy hour en cours" : "Pensez au happy hour",
        desc: "Boissons à -50% entre 17h et 19h.",
        action: "Réserver une table",
        nav: "reserve-table" as const,
      },
    ]
    return picks
  }, [topFavorite])

  const quickActions: {
    label: string
    desc: string
    icon: typeof ShoppingCart
    nav?: AccountDashboardNavigateId
    href?: string
    highlight?: boolean
  }[] = [
    { label: "Commander", desc: "Menu & panier", icon: ShoppingCart, nav: "order", highlight: true },
    { label: "Réserver", desc: "Table", icon: CalendarDays, nav: "reserve-table" },
    { label: "Événements", desc: "Soirées", icon: PartyPopper, nav: "reserve-event" },
    { label: "Carte", desc: "Voir le menu", icon: BookOpen, nav: "menu" },
    { label: "Commandes", desc: "Historique", icon: Package, nav: "orders" },
    {
      label: "Recommander",
      desc: "Dernière commande",
      icon: RefreshCw,
      href: "#dashboard-reorder",
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-up pb-4">
      {/* 1. Welcome header */}
      <Card className="relative overflow-hidden border border-[color:var(--lux-bordeaux)]/12 p-0 shadow-[var(--lux-shadow-gold)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(1200px 400px at 10% -20%, color-mix(in srgb, var(--lux-gold) 35%, transparent), transparent 55%), radial-gradient(800px 300px at 90% 0%, color-mix(in srgb, var(--lux-bordeaux) 22%, transparent), transparent 50%)",
          }}
        />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl font-display text-2xl font-semibold text-amber-50 shadow-[0_20px_50px_-20px_rgba(110,29,43,0.55)] ring-4 ring-white/90 sm:h-24 sm:w-24 sm:text-3xl"
                  style={{ background: "var(--lux-gradient-ink)" }}
                >
                  {initials}
                </div>
                <span
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md"
                  style={{ background: "var(--lux-gradient-gold)" }}
                >
                  <tier.Icon className="h-4 w-4 text-[color:var(--lux-ink)]" strokeWidth={2} />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <greet.Icon className="h-5 w-5 text-[color:var(--lux-bordeaux)]" strokeWidth={1.75} />
                  <p className="font-display text-2xl font-semibold tracking-tight text-amber-950 sm:text-3xl">
                    {greet.text}, {firstName}
                  </p>
                </div>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-amber-900/70">{greet.sub}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white shadow-sm",
                      tier.accent,
                    )}
                  >
                    <tier.Icon className="h-3.5 w-3.5" />
                    {tier.label}
                  </span>
                  <span className="rounded-full border border-[color:var(--lux-gold)]/40 bg-white/80 px-3 py-1 text-xs font-medium text-amber-950">
                    {points.toLocaleString("fr-FR")} pts fidélité
                  </span>
                  {!isLoggedIn ? (
                    <Button asChild size="sm" variant="gold" className="rounded-full">
                      <Link href="/login">Se connecter</Link>
                    </Button>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-amber-900/60">
                  {profile.email ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {profile.email}
                    </span>
                  ) : null}
                  {profile.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {profile.phone}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="w-full shrink-0 rounded-2xl border border-white/50 bg-white/75 p-5 shadow-inner backdrop-blur-sm sm:max-w-sm lg:w-80">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-900/45">Résumé</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-900/75">
                Votre espace regroupe commandes, réservations, billets et avantages. Tout est à portée de clic.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[color:var(--lux-cream)]/80 px-3 py-2 text-xs text-amber-900/80">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                Compte actif — profitez des offres membres.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Quick actions */}
      <section aria-labelledby="dash-quick-title">
        <div className="mb-4 flex items-end justify-between gap-2">
          <h2 id="dash-quick-title" className="font-display text-lg font-semibold text-amber-950 sm:text-xl">
            Actions rapides
          </h2>
          <span className="text-xs text-amber-900/50">Accès immédiat</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((a) => {
            const Icon = a.icon
            const inner = (
              <>
                <span
                  className={cn(
                    "mb-3 flex h-11 w-11 items-center justify-center rounded-xl shadow-sm transition duration-300 group-hover:scale-105",
                    a.highlight
                      ? "bg-gradient-to-br from-[color:var(--lux-gold)]/90 to-amber-700 text-[color:var(--lux-ink)]"
                      : "bg-[color:var(--lux-bordeaux)]/10 text-[color:var(--lux-bordeaux)]",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.65} />
                </span>
                <span className="font-display text-sm font-semibold text-amber-950">{a.label}</span>
                <span className="mt-0.5 block text-[11px] text-amber-900/55">{a.desc}</span>
              </>
            )
            if (a.href) {
              return (
                <a
                  key={a.label}
                  href={a.href}
                  className={cn(
                    "group flex min-h-[8.5rem] flex-col rounded-2xl border border-amber-900/10 bg-gradient-to-br from-white via-[color:var(--lux-cream)]/30 to-[color:var(--lux-sand)]/25 p-4 shadow-[var(--lux-shadow-soft)] transition duration-300 hover:-translate-y-0.5 hover:border-[color:var(--lux-gold)]/35 hover:shadow-[var(--lux-shadow-gold)]",
                  )}
                >
                  {inner}
                  <ChevronRight className="mt-auto ml-auto h-4 w-4 text-amber-900/25 transition group-hover:translate-x-0.5 group-hover:text-amber-900/50" />
                </a>
              )
            }
            return (
              <button
                key={a.label}
                type="button"
                onClick={() => a.nav && onNavigate(a.nav)}
                className={cn(
                  "group flex min-h-[8.5rem] flex-col rounded-2xl border border-amber-900/10 bg-gradient-to-br from-white via-[color:var(--lux-cream)]/30 to-[color:var(--lux-sand)]/25 p-4 text-left shadow-[var(--lux-shadow-soft)] transition duration-300 hover:-translate-y-0.5 hover:border-[color:var(--lux-gold)]/35 hover:shadow-[var(--lux-shadow-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/45",
                )}
              >
                {inner}
                <ChevronRight className="mt-auto ml-auto h-4 w-4 text-amber-900/25 transition group-hover:translate-x-0.5 group-hover:text-amber-900/50" />
              </button>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left column: reorder + suggestions */}
        <div className="space-y-6 xl:col-span-2">
          <section id="dashboard-reorder" aria-labelledby="dash-reorder-title">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 id="dash-reorder-title" className="font-display text-lg font-semibold text-amber-950 sm:text-xl">
                Commander encore
              </h2>
              <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={() => onNavigate("orders")}>
                Tout voir
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {previousOrders.length === 0 ? (
                <Card className="col-span-full border border-dashed border-amber-900/20 bg-amber-50/20 p-8 text-center sm:col-span-2 lg:col-span-3">
                  <Package className="mx-auto h-8 w-8 text-amber-900/35" />
                  <p className="mt-2 text-sm font-medium text-amber-950">Aucun historique de commande à afficher</p>
                  <p className="mt-1 text-xs text-amber-900/60">Passez votre première commande pour la retrouver ici.</p>
                  <Button variant="gold" className="mt-4 rounded-full" onClick={() => onNavigate("order")}>
                    Commander
                  </Button>
                </Card>
              ) : (
                previousOrders.map((o) => (
                  <Card
                    key={o.id}
                    className="group overflow-hidden border border-amber-900/10 p-0 shadow-[var(--lux-shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--lux-shadow-gold)]"
                  >
                    <div className="relative h-28 overflow-hidden">
                      <img
                        src={o.image}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                      <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-amber-950">
                        {o.items} articles · {o.total.toFixed(2)} €
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-display text-sm font-semibold leading-snug text-amber-950">{o.label}</p>
                      <p className="mt-1 text-xs text-amber-900/60">
                        {new Date(o.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <Button
                        type="button"
                        variant="gold"
                        size="sm"
                        className="mt-3 w-full rounded-full"
                        onClick={() => onNavigate("order")}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Recommander
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>

          <section aria-labelledby="dash-smart-title">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[color:var(--lux-gold)]" />
              <h2 id="dash-smart-title" className="font-display text-lg font-semibold text-amber-950 sm:text-xl">
                Pour vous
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {smartPicks.map((p) => {
                const Icon = p.icon
                return (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => onNavigate(p.nav)}
                    className="flex flex-col rounded-2xl border border-[color:var(--lux-bordeaux)]/10 bg-gradient-to-br from-white to-[color:var(--lux-cream)]/40 p-4 text-left shadow-sm transition hover:border-[color:var(--lux-gold)]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40"
                  >
                    <Icon className="h-6 w-6 text-[color:var(--lux-bordeaux)]" strokeWidth={1.5} />
                    <p className="mt-2 font-display text-sm font-semibold text-amber-950">{p.title}</p>
                    <p className="mt-1 flex-1 text-xs leading-relaxed text-amber-900/65">{p.desc}</p>
                    <span className="mt-3 inline-flex items-center text-xs font-semibold text-[color:var(--lux-bordeaux)]">
                      {p.action}
                      <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="dash-promo-title">
            <div className="mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-[color:var(--lux-bordeaux)]" />
              <h2 id="dash-promo-title" className="font-display text-lg font-semibold text-amber-950 sm:text-xl">
                Promotions & réductions
              </h2>
            </div>
            {promos.length === 0 ? (
              <Card className="border border-dashed border-amber-900/15 bg-white/60 p-6 text-center">
                <Tag className="mx-auto h-8 w-8 text-amber-900/30" />
                <p className="mt-2 text-sm text-amber-900/70">Les offres en cours s&apos;affichent ici lorsqu&apos;elles sont publiées.</p>
                <Button variant="outline" className="mt-4 rounded-full" onClick={() => onNavigate("menu")}>
                  Voir la carte
                </Button>
              </Card>
            ) : (
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {promos.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "min-w-[260px] snap-start rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg sm:min-w-[280px]",
                      p.tone,
                    )}
                  >
                    <p className="font-display text-lg font-semibold">{p.title}</p>
                    <p className="mt-1 text-sm text-white/85">{p.subtitle}</p>
                    {p.code ? (
                      <p className="mt-3 inline-block rounded-lg bg-white/20 px-2 py-1 font-mono text-xs font-bold tracking-wide">
                        {p.code}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      className="mt-4 rounded-full bg-white text-amber-950 hover:bg-white/90"
                      onClick={() => onNavigate("order")}
                    >
                      En profiter
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column: loyalty + upcoming + feed */}
        <div className="space-y-6">
          <Card className="overflow-hidden border border-[color:var(--lux-gold)]/30 p-0 shadow-[var(--lux-shadow-soft)]">
            <div
              className="px-5 py-4 text-white"
              style={{
                background: "linear-gradient(135deg, var(--lux-bordeaux) 0%, var(--lux-bordeaux-dark) 100%)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/80">Fidélité</p>
                <Gift className="h-5 w-5 text-[color:var(--lux-gold-bright)]" />
              </div>
              <p className="mt-1 font-display text-3xl font-semibold">{points.toLocaleString("fr-FR")}</p>
              <p className="text-xs text-amber-100/80">points disponibles</p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <div className="mb-1 flex justify-between text-xs font-medium text-amber-900/80">
                  <span>Progression {tier.short}</span>
                  <span>{pointsToNext} pts → palier suivant</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-amber-100">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progressPct}%`,
                      background: "var(--lux-gradient-gold)",
                    }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-amber-900/10 bg-amber-50/50 p-3 text-xs text-amber-900/75">
                <p className="font-semibold text-amber-950">Récompense suivante</p>
                <p className="mt-1">Dessert offert à 500 pts · ou café offert dès 50 pts dans l&apos;onglet fidélité.</p>
              </div>
              <Button variant="outline" className="w-full rounded-full border-[color:var(--lux-gold)]/50" onClick={() => onNavigate("loyalty")}>
                Programme complet
                <TrendingUp className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="border border-amber-900/10 p-5 shadow-[var(--lux-shadow-soft)]">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-amber-950">
              <CalendarCheck className="h-5 w-5 text-[color:var(--lux-bordeaux)]" />
              À venir
            </h3>
            <div className="mt-4 space-y-4">
              {dashDemo ? (
                <>
                  <div className="rounded-xl border border-[color:var(--lux-gold)]/35 bg-[color:var(--lux-cream)]/50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/50">Réservation</p>
                    <p className="mt-1 font-medium text-amber-950">
                      {new Date(UPCOMING_RES.date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      · {UPCOMING_RES.time}
                    </p>
                    <p className="text-xs text-amber-900/65">
                      {UPCOMING_RES.guests} pers. · {UPCOMING_RES.zone} · {UPCOMING_RES.label}
                    </p>
                    <Button variant="ghost" size="sm" className="mt-2 h-8 rounded-full px-2 text-xs" onClick={() => onNavigate("reservations")}>
                      Détails
                    </Button>
                  </div>
                  <div className="rounded-xl border border-amber-900/10 bg-white/80 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/50">Événement</p>
                    <p className="mt-1 font-medium text-amber-950">{UPCOMING_EVENT.title}</p>
                    <p className="text-xs text-amber-900/65">
                      {new Date(UPCOMING_EVENT.date).toLocaleDateString("fr-FR")} · {UPCOMING_EVENT.time}
                    </p>
                    {!eventCountdown.done ? (
                      <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-[color:var(--lux-bordeaux)]">
                        {eventCountdown.d}j {eventCountdown.h}h {eventCountdown.m}m {eventCountdown.sec}s
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-amber-700">C&apos;est aujourd&apos;hui !</p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ticketQrSrc(UPCOMING_EVENT.ticketCode)}
                        alt=""
                        width={96}
                        height={96}
                        className="rounded-lg border border-amber-900/10 bg-white p-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-amber-900/55">QR billet</p>
                        <Button size="sm" variant="gold" className="mt-1 rounded-full" onClick={() => onNavigate("tickets")}>
                          Mes tickets
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-amber-900/15 bg-amber-50/25 p-5 text-center">
                  <CalendarCheck className="mx-auto h-8 w-8 text-amber-900/35" />
                  <p className="mt-2 text-sm font-medium text-amber-950">Rien à venir pour le moment</p>
                  <p className="mt-1 text-xs text-amber-900/65">Réservez une table ou un événement pour voir le détail ici.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => onNavigate("reserve-table")}>
                      Réserver
                    </Button>
                    <Button size="sm" variant="gold" className="rounded-full" onClick={() => onNavigate("reserve-event")}>
                      Événements
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="border border-amber-900/10 p-5 shadow-[var(--lux-shadow-soft)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold text-amber-950">
                <Bell className="h-5 w-5 text-[color:var(--lux-bordeaux)]" />
                Actualités
              </h3>
              <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs" onClick={() => onNavigate("notifications")}>
                Tout
              </Button>
            </div>
            {activityFeed.length === 0 ? (
              <p className="text-sm text-amber-900/60">Les actualités et rappels personnalisés apparaîtront ici.</p>
            ) : (
              <ul className="space-y-2">
                {activityFeed.map((item) => {
                  const I = item.icon
                  return (
                    <li
                      key={item.id}
                      className={cn("flex gap-3 rounded-xl border border-amber-900/8 p-3", item.tone)}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70">
                        <I className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{item.text}</p>
                        <p className="mt-0.5 text-[10px] opacity-80">{item.time}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Favorites */}
      <section aria-labelledby="dash-fav-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="dash-fav-title" className="flex items-center gap-2 font-display text-lg font-semibold text-amber-950 sm:text-xl">
            <Heart className="h-5 w-5 fill-rose-400/30 text-rose-600" />
            Vos coups de cœur
          </h2>
          <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={() => onNavigate("favorites")}>
            Gérer
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {favorites.length === 0 ? (
            <Card className="col-span-full border border-dashed border-[color:var(--lux-gold)]/40 p-8 text-center">
              <Heart className="mx-auto h-8 w-8 text-amber-900/30" />
              <p className="mt-2 text-sm text-amber-900/65">Ajoutez des favoris en commandant depuis le menu.</p>
              <Button variant="gold" className="mt-4 rounded-full" onClick={() => onNavigate("menu")}>
                Parcourir la carte
              </Button>
            </Card>
          ) : (
            favorites.map((fav, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigate("order")}
                className="group overflow-hidden rounded-2xl border border-amber-900/10 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--lux-shadow-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/45"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={fav.image}
                    alt={fav.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-2 left-2 right-2 font-display text-xs font-semibold text-white drop-shadow">
                    {fav.name}
                  </span>
                </div>
                <div className="flex items-center justify-between px-2 py-2">
                  <span className="text-[10px] text-amber-900/55">{fav.orders}× commandé</span>
                  <ShoppingCart className="h-3.5 w-3.5 text-[color:var(--lux-bordeaux)]" />
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <AccountAIConcierge
        firstName={firstName}
        isLoggedIn={isLoggedIn}
        userEmail={profile.email}
        loyaltyPoints={points}
        favorites={favorites}
        onNavigate={onNavigate}
        promos={promos.map((p) => ({ title: p.title, subtitle: p.subtitle, code: p.code }))}
        fallbackOrderLabels={previousOrders.map((o) => o.label)}
        fallbackReservationDate={dashDemo ? UPCOMING_RES.date : null}
        fallbackEventTitle={dashDemo ? UPCOMING_EVENT.title : null}
      />
    </div>
  )
}
