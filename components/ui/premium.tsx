"use client"

/**
 * Primitives premium réutilisables — homogènes avec le design system Jannat Bloudan.
 * Doivent être préférées aux <div> ad-hoc pour les KPIs, badges et états de chargement
 * dans tous les portails (admin, caisse, server, KDS, client).
 */

import type { ElementType, ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { CountUp } from "@/components/ui/motion-primitives"
import { EASE_QUICK } from "@/lib/ui/motion"

/* -------------------------------------------------------------------------- */
/*  PremiumStatCard — KPI tile                                                */
/* -------------------------------------------------------------------------- */

export type PremiumStatCardProps = {
  label: string
  /** Valeur numérique animée (CountUp). Ignoré si `displayValue` est fourni. */
  value?: number
  /** Suffixe / unité affiché après la valeur (ex. " €", " %"). */
  suffix?: string
  /** Préfixe affiché avant la valeur. */
  prefix?: string
  /** Nombre de décimales (par défaut 2 si `value` non entier). */
  decimals?: number
  /** Surcharge complète de l'affichage (désactive l'animation CountUp). */
  displayValue?: ReactNode
  /** Icône optionnelle (lucide-react). */
  icon?: ElementType
  /** Couleur d'accent : `gold` (défaut), `bordeaux`, `emerald`, `amber`, `rose`, `indigo`. */
  accent?: "gold" | "bordeaux" | "emerald" | "amber" | "rose" | "indigo" | "neutral"
  /** Variation chiffrée vs période précédente (delta affiché en bas du tile). */
  delta?: { value: number; label?: string; positiveIsGood?: boolean }
  className?: string
  onClick?: () => void
  /** Affiche un état de chargement squelette plutôt que la valeur. */
  loading?: boolean
}

const ACCENT: Record<NonNullable<PremiumStatCardProps["accent"]>, { icon: string; ring: string }> = {
  gold: {
    icon: "bg-[color:var(--lux-gold)]/15 text-[color:var(--lux-gold-deep)] dark:bg-[color:var(--lux-gold)]/25 dark:text-[color:var(--lux-gold-bright)]",
    ring: "hover:ring-[color:var(--lux-gold)]/35",
  },
  bordeaux: {
    icon: "bg-[color:var(--lux-bordeaux)]/12 text-[color:var(--lux-bordeaux)] dark:bg-[color:var(--lux-bordeaux)]/30 dark:text-[color:var(--lux-gold-bright)]",
    ring: "hover:ring-[color:var(--lux-bordeaux)]/30",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
    ring: "hover:ring-emerald-300/50",
  },
  amber: {
    icon: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100",
    ring: "hover:ring-amber-300/50",
  },
  rose: {
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-100",
    ring: "hover:ring-rose-300/50",
  },
  indigo: {
    icon: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100",
    ring: "hover:ring-indigo-300/50",
  },
  neutral: {
    icon: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    ring: "hover:ring-neutral-300/50",
  },
}

export function PremiumStatCard({
  label,
  value,
  suffix,
  prefix,
  decimals,
  displayValue,
  icon: Icon,
  accent = "gold",
  delta,
  className,
  onClick,
  loading,
}: PremiumStatCardProps) {
  const tone = ACCENT[accent]
  const inferredDecimals = decimals ?? (value != null && !Number.isInteger(value) ? 2 : 0)

  return (
    <motion.div
      whileHover={onClick ? { y: -3 } : undefined}
      transition={EASE_QUICK}
      onClick={onClick}
      className={cn(
        "premium-card flex items-center gap-3 p-4 ring-1 ring-transparent transition-shadow",
        tone.ring,
        onClick && "cursor-pointer",
        className,
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm",
            tone.icon,
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 truncate text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {loading ? (
            <Skeleton className="h-5 w-24" />
          ) : displayValue !== undefined ? (
            displayValue
          ) : value != null ? (
            <CountUp value={value} prefix={prefix} suffix={suffix} decimals={inferredDecimals} />
          ) : (
            "—"
          )}
        </div>
        {delta && !loading ? <AnimatedDelta {...delta} /> : null}
      </div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  AnimatedDelta — variation period-over-period                               */
/* -------------------------------------------------------------------------- */

export function AnimatedDelta({
  value,
  label,
  positiveIsGood = true,
}: {
  value: number
  label?: string
  positiveIsGood?: boolean
}) {
  if (!Number.isFinite(value)) return null
  const isUp = value > 0
  const isFlat = value === 0
  const good = isFlat ? null : isUp === positiveIsGood
  const tone = good == null
    ? "text-neutral-500"
    : good
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400"
  const arrow = isFlat ? "→" : isUp ? "↑" : "↓"
  const formatted = `${arrow} ${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  })}${label ? ` ${label}` : "%"}`
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={EASE_QUICK}
      className={cn("mt-0.5 text-[11px] font-medium", tone)}
    >
      {formatted}
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  NotificationDot — pastille pulsante sur badges / icônes                    */
/* -------------------------------------------------------------------------- */

export function NotificationDot({
  count,
  className,
  tone = "bordeaux",
  pulsing = true,
}: {
  count?: number
  className?: string
  tone?: "bordeaux" | "gold" | "rose" | "amber"
  pulsing?: boolean
}) {
  const visible = count == null || count > 0
  if (!visible) return null
  const palette: Record<string, string> = {
    bordeaux: "bg-[color:var(--lux-bordeaux)] text-white",
    gold: "bg-[color:var(--lux-gold)] text-[color:var(--lux-ink)]",
    rose: "bg-rose-500 text-white",
    amber: "bg-amber-500 text-white",
  }
  return (
    <span
      className={cn(
        "absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold shadow-sm",
        palette[tone],
        pulsing && "animate-pulse-glow",
        className,
      )}
      aria-label={count != null ? `${count} notification${count > 1 ? "s" : ""}` : undefined}
    >
      {count != null && count > 0 ? (count > 99 ? "99+" : count) : ""}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  StatusPill — petite étiquette colorée avec dot                             */
/* -------------------------------------------------------------------------- */

export function StatusPill({
  label,
  tone = "neutral",
  pulsing,
  icon: Icon,
  className,
}: {
  label: string
  tone?: "emerald" | "amber" | "blue" | "cyan" | "orange" | "purple" | "rose" | "neutral" | "gold"
  pulsing?: boolean
  icon?: ElementType
  className?: string
}) {
  const map: Record<string, { bg: string; dot: string }> = {
    emerald: {
      bg: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100",
      dot: "bg-emerald-500",
    },
    amber: {
      bg: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100",
      dot: "bg-amber-500",
    },
    blue: {
      bg: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100",
      dot: "bg-blue-500",
    },
    cyan: {
      bg: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-100",
      dot: "bg-cyan-500",
    },
    orange: {
      bg: "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-900/40 dark:text-orange-100",
      dot: "bg-orange-500",
    },
    purple: {
      bg: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-100",
      dot: "bg-purple-500",
    },
    rose: {
      bg: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-100",
      dot: "bg-rose-500",
    },
    neutral: {
      bg: "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200",
      dot: "bg-neutral-400",
    },
    gold: {
      bg: "bg-[color:var(--lux-gold)]/18 text-[color:var(--lux-bordeaux-dark)] border-[color:var(--lux-gold)]/40 dark:text-[color:var(--lux-gold-bright)]",
      dot: "bg-[color:var(--lux-gold)]",
    },
  }
  const t = map[tone] ?? map.neutral
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        t.bg,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot, pulsing && "animate-pulse")} />
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {label}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  SkeletonStatCard — placeholder cohérent avec PremiumStatCard               */
/* -------------------------------------------------------------------------- */

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("premium-card flex items-center gap-3 p-4", className)}>
      <Skeleton className="h-11 w-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-32" />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  PremiumSection — entête de section avec animation fade-in                  */
/* -------------------------------------------------------------------------- */

export function PremiumSection({
  title,
  description,
  trailing,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  trailing?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn("space-y-3", className)}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {trailing ? <div className="flex items-center gap-2">{trailing}</div> : null}
      </header>
      {children}
    </motion.section>
  )
}
