"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { X, Sparkles, Timer } from "lucide-react"

import type { PublicPromotion } from "@/lib/promotions/serialize"
import { formatPromoBadge } from "@/lib/promotions/serialize"
import { cn } from "@/lib/utils"

function formatCountdown(endsIso: string): string {
  const end = new Date(endsIso).getTime()
  const now = Date.now()
  const ms = Math.max(0, end - now)
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  if (h > 48) return `${Math.floor(ms / 86_400_000)}j`
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`
  return `${m}m ${String(s).padStart(2, "0")}s`
}

export type PromoBannerProps = {
  /** Filtre visibilité côté API (`all`, `delivery`, `dine_in`, `qr_table`, …). */
  context?: string
  className?: string
}

function pickHeroPromo(promos: PublicPromotion[]): PublicPromotion | null {
  if (!promos.length) return null
  const scored = [...promos].sort((a, b) => {
    const img = (b.image_url ? 2 : 0) - (a.image_url ? 2 : 0)
    if (img !== 0) return img
    const sa = a.short_label ? 1 : 0
    const sb = b.short_label ? 1 : 0
    return sb - sa
  })
  return scored[0]
}

/**
 * Bandeau promotion dynamique branché sur `/api/promotions/active`.
 * Luxe beige / bordeaux aligné avec le thème landing.
 */
export function PromoBanner({ context = "all", className }: PromoBannerProps) {
  const [picked, setPicked] = useState<PublicPromotion | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/promotions/active?context=${encodeURIComponent(context)}`)
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        const promos = (body.promos ?? []) as PublicPromotion[]
        setPicked(pickHeroPromo(promos))
      })
      .catch(() => {
        if (!cancelled) setPicked(null)
      })
    return () => {
      cancelled = true
    }
  }, [context])

  const countdown = useMemo(() => {
    const raw = picked?.meta?.countdown_ends_at
    if (typeof raw !== "string" || !picked) return null
    if (Number.isNaN(new Date(raw).getTime())) return null
    return raw
  }, [picked])

  const [, tick] = useState(0)
  useEffect(() => {
    if (!countdown) return
    const id = setInterval(() => tick((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [countdown])

  useEffect(() => {
    if (!picked?.id || dismissed) return
    try {
      const dismissedIds = JSON.parse(sessionStorage.getItem("lux-dismissed-promos") ?? "[]") as string[]
      if (dismissedIds.includes(picked.id)) setDismissed(true)
    } catch {
      /* ignore */
    }
  }, [picked?.id, dismissed])

  if (!picked || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    try {
      const dismissedIds = JSON.parse(sessionStorage.getItem("lux-dismissed-promos") ?? "[]") as string[]
      sessionStorage.setItem("lux-dismissed-promos", JSON.stringify([...dismissedIds, picked.id]))
    } catch {
      /* ignore */
    }
  }

  const badge = formatPromoBadge(picked)
  const line =
    picked.short_label?.trim() ||
    picked.description?.trim()?.slice(0, 140) ||
    `${picked.name} — ${badge}`

  const showCountdown = countdown && new Date(countdown).getTime() > Date.now()

  return (
    <div
      role="banner"
      className={cn(
        "relative overflow-hidden border-b border-[color:var(--lux-gold)]/25 bg-[color:var(--lux-cream)] text-amber-950 dark:border-[color:var(--lux-gold)]/15 dark:bg-zinc-950 dark:text-amber-100",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12] dark:opacity-[0.18]"
        style={{
          background:
            "linear-gradient(110deg, #6e1d2b 0%, transparent 45%), linear-gradient(-20deg, #c9a24c 0%, transparent 50%)",
        }}
      />
      <div className="site-container relative flex items-center justify-center gap-3 py-2.5 pl-10 pr-10 text-sm font-medium">
        <Sparkles className="hidden h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 sm:block" />
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
          <span className="rounded-full bg-[color:var(--lux-gold)]/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-950 dark:bg-amber-500/15 dark:text-amber-50">
            {badge}
          </span>
          <span className="text-balance">{line}</span>
          {picked.promo_code ? (
            <span className="font-mono text-xs text-amber-900/85 dark:text-amber-200/90">
              Code&nbsp;<strong>{picked.promo_code}</strong>
              {picked.auto_apply ? (
                <span className="ml-1 font-sans text-[10px] font-normal text-amber-900/60 dark:text-amber-200/60">
                  (auto)
                </span>
              ) : null}
            </span>
          ) : null}
          {showCountdown ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] tabular-nums dark:bg-white/10">
              <Timer className="h-3 w-3 shrink-0" />
              {formatCountdown(countdown!)}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-1/2 shrink-0 -translate-y-1/2 rounded-full p-1.5 transition hover:bg-black/10 dark:hover:bg-white/10"
          aria-label="Fermer la bannière"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <Link
          href="/delivery"
          className="absolute left-4 top-1/2 hidden -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wide text-amber-900/80 underline-offset-4 hover:underline sm:block dark:text-amber-200/90"
        >
          Commander
        </Link>
      </div>
    </div>
  )
}
