"use client"

import { useState } from "react"
import {
  Gift,
  Trophy,
  Tag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Crown,
  Coffee,
  Cake,
  Pizza,
  CreditCard,
} from "lucide-react"
import { AccountSubLayout } from "@/components/site/AccountSubLayout"
import { SITE } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Reward = {
  id: number
  name: string
  description: string
  points: number
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  available: boolean
}

const REWARDS: Reward[] = [
  {
    id: 1,
    name: "Café offert",
    description: "Un espresso ou un thé maison",
    points: 50,
    icon: Coffee,
    iconBg: "from-amber-400 to-amber-700",
    available: true,
  },
  {
    id: 2,
    name: "Dessert offert",
    description: "Un dessert au choix",
    points: 100,
    icon: Cake,
    iconBg: "from-pink-400 to-rose-700",
    available: true,
  },
  {
    id: 3,
    name: "-10% sur la commande",
    description: "Valable une fois",
    points: 150,
    icon: CreditCard,
    iconBg: "from-emerald-400 to-emerald-700",
    available: true,
  },
  {
    id: 4,
    name: "Pizza offerte",
    description: "Au choix dans le menu",
    points: 300,
    icon: Pizza,
    iconBg: "from-orange-400 to-red-700",
    available: true,
  },
  {
    id: 5,
    name: "Menu complet offert",
    description: "Entrée + plat + dessert",
    points: 500,
    icon: Gift,
    iconBg: "from-[color:var(--lux-gold)] to-[color:var(--lux-gold-deep)]",
    available: true,
  },
  {
    id: 6,
    name: "Statut VIP 1 mois",
    description: "Accès prioritaire et offres exclusives",
    points: 1000,
    icon: Crown,
    iconBg: "from-violet-500 to-purple-800",
    available: true,
  },
]

export default function LoyaltyPage() {
  const [points, setPoints] = useState(450)
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const nextReward = 500
  const progress = Math.min(100, (points / nextReward) * 100)

  const coupons = [
    { code: "SHAWARMA10", discount: "10%", item: "Shawarma", expiry: "2024-02-28" },
    { code: "BIRTHDAY20", discount: "20%", item: "Toute commande", expiry: "2024-01-31" },
    { code: "HAPPYHOUR", discount: "15%", item: "Boissons", expiry: "2024-01-25" },
  ]

  const handleRedeem = (reward: Reward) => {
    if (points < reward.points) {
      setMessage({ kind: "error", text: "Points insuffisants pour cette récompense." })
      return
    }
    setPoints((p) => p - reward.points)
    setMessage({
      kind: "success",
      text: `Récompense « ${reward.name} » échangée avec succès !`,
    })
    setTimeout(() => setMessage(null), 4500)
  }

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2200)
    } catch {
      // ignore
    }
  }

  return (
    <AccountSubLayout
      title="Programme fidélité"
      subtitle="Cumulez des points à chaque visite et profitez de récompenses exclusives."
      heroImage={SITE.images.mezze}
    >
      {/* Points Balance Hero */}
      <Card
        className="relative mb-6 overflow-hidden border-0 p-6 text-white shadow-[0_30px_70px_-30px_rgba(110,29,43,0.6)] sm:p-8 animate-fade-up"
        style={{
          background:
            "linear-gradient(135deg, var(--lux-bordeaux) 0%, var(--lux-bordeaux-dark) 50%, #2b1d12 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 syrian-pattern opacity-15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[color:var(--lux-gold)]/30 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-60 w-60 rounded-full bg-amber-400/20 blur-[100px]"
        />

        <div className="relative grid gap-6 md:grid-cols-2 md:items-center">
          <div className="text-center md:text-left">
            <div className="mb-3 flex items-center justify-center gap-3 md:justify-start">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_12px_30px_-10px_rgba(201,162,76,0.55)]"
                style={{ background: "var(--lux-gradient-gold)" }}
              >
                <Trophy className="h-7 w-7 text-[color:var(--lux-ink)]" />
              </span>
              <span className="rounded-full border border-[color:var(--lux-gold)]/40 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--lux-gold-bright)] backdrop-blur">
                Membre fidèle
              </span>
            </div>
            <p className="numeric-display text-5xl font-semibold leading-none text-white sm:text-6xl">
              {points.toLocaleString("fr-FR")}
            </p>
            <p className="mt-2 text-sm font-medium uppercase tracking-[0.28em] text-amber-100/70">
              Points disponibles
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-amber-100/85">Prochain palier</span>
              <span className="font-display text-base font-semibold text-[color:var(--lux-gold-bright)]">
                Menu complet offert
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: "var(--lux-gradient-gold)",
                  boxShadow: "0 0 18px rgba(217, 183, 106, 0.6)",
                }}
              />
            </div>
            <p className="mt-3 text-center text-xs text-amber-100/70">
              Encore <span className="font-semibold text-[color:var(--lux-gold-bright)]">
                {Math.max(0, nextReward - points)}
              </span>{" "}
              points pour débloquer la prochaine récompense
            </p>
          </div>
        </div>
      </Card>

      {/* Rewards */}
      <Card className="premium-card mb-6 p-6 sm:p-7 animate-fade-up [animation-delay:80ms]">
        <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100/80 text-orange-700">
            <Gift className="h-5 w-5" />
          </span>
          Récompenses disponibles
        </h2>

        {message ? (
          <div
            role="alert"
            aria-live="polite"
            className={cn(
              "mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm animate-fade-up",
              message.kind === "success"
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                : "border-amber-200 bg-amber-50/80 text-amber-800",
            )}
          >
            {message.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REWARDS.map((reward) => {
            const Icon = reward.icon
            const canAfford = points >= reward.points
            return (
              <div
                key={reward.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-5 transition",
                  canAfford
                    ? "border-[color:var(--lux-gold)]/40 bg-gradient-to-br from-white to-[color:var(--lux-cream)] shadow-[0_10px_28px_-15px_rgba(201,162,76,0.4)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-15px_rgba(201,162,76,0.5)]"
                    : "border-amber-900/10 bg-white/60 opacity-75",
                )}
              >
                {canAfford ? (
                  <span
                    aria-hidden
                    className="absolute right-3 top-3 flex h-6 items-center gap-1 rounded-full px-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--lux-ink)]"
                    style={{ background: "var(--lux-gradient-gold)" }}
                  >
                    <Sparkles className="h-3 w-3" />
                    Disponible
                  </span>
                ) : null}

                <div
                  className={cn(
                    "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md transition group-hover:scale-110",
                    reward.iconBg,
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="font-display text-base font-semibold text-amber-950">
                  {reward.name}
                </h3>
                <p className="mt-1 text-xs text-amber-900/65">{reward.description}</p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100/70 px-2.5 py-1 text-xs font-semibold text-orange-800">
                    <Sparkles className="h-3 w-3" />
                    {reward.points} pts
                  </span>
                  <Button
                    size="sm"
                    variant={canAfford ? "gold" : "outline"}
                    disabled={!canAfford}
                    onClick={() => handleRedeem(reward)}
                    className="rounded-full"
                  >
                    {canAfford ? "Échanger" : "Trop court"}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Coupons */}
      <Card className="premium-card p-6 sm:p-7 animate-fade-up [animation-delay:160ms]">
        <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
            <Tag className="h-5 w-5" />
          </span>
          Mes coupons actifs
        </h2>

        <div className="space-y-3">
          {coupons.map((coupon) => {
            const expiryDate = new Date(coupon.expiry)
            const daysLeft = Math.ceil(
              (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            )
            const isExpiringSoon = daysLeft >= 0 && daysLeft <= 7
            return (
              <div
                key={coupon.code}
                className="group relative overflow-hidden rounded-2xl border border-dashed border-emerald-300/70 bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/40 p-4 sm:p-5"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-200/30 blur-3xl"
                />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="group/btn inline-flex items-center gap-2 font-mono text-base font-bold text-emerald-800 transition hover:text-emerald-950"
                    >
                      <span className="rounded-md bg-emerald-100/70 px-2 py-0.5 ring-1 ring-emerald-300/60">
                        {coupon.code}
                      </span>
                      {copiedCode === coupon.code ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 opacity-50 transition group-hover/btn:opacity-100" />
                      )}
                    </button>
                    <p className="mt-1.5 text-sm font-medium text-amber-950">
                      <span className="text-lg font-bold text-emerald-700">{coupon.discount}</span>
                      <span className="ml-1.5 text-amber-900/70">sur {coupon.item}</span>
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-xs",
                        isExpiringSoon ? "font-semibold text-orange-700" : "text-amber-900/55",
                      )}
                    >
                      {isExpiringSoon
                        ? `⏰ Expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`
                        : `Valable jusqu'au ${expiryDate.toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="rounded-full"
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copier
                    </Button>
                    <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700">
                      Utiliser
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </AccountSubLayout>
  )
}
