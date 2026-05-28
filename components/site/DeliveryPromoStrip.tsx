"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Flame } from "lucide-react"

import type { PublicPromotion } from "@/lib/promotions/serialize"
import { formatPromoBadge } from "@/lib/promotions/serialize"

/**
 * Ruban promotions sous le header livraison (filtré `visibility=delivery` ou `all`).
 */
export function DeliveryPromoStrip() {
  const [promos, setPromos] = useState<PublicPromotion[]>([])

  useEffect(() => {
    let cancelled = false
    fetch("/api/promotions/active?context=delivery")
      .then((r) => r.json())
      .then((body) => {
        if (!cancelled) setPromos((body.promos ?? []).slice(0, 12))
      })
      .catch(() => {
        if (!cancelled) setPromos([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!promos.length) return null

  return (
    <div className="border-b border-amber-800/10 bg-gradient-to-r from-amber-50 via-white to-amber-50 py-2 dark:border-amber-500/10 dark:from-amber-950/40 dark:via-zinc-950 dark:to-amber-950/40">
      <div className="site-container flex items-center gap-3">
        <Flame className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
          {promos.map((p) => (
            <Link
              key={p.id}
              href="#menu"
              scroll
              className="shrink-0 rounded-full border border-amber-300/50 bg-white/90 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur dark:border-amber-700/40 dark:bg-zinc-900/90"
            >
              <span className="text-amber-800 dark:text-amber-200">{formatPromoBadge(p)}</span>
              <span className="mx-1 text-amber-950/40 dark:text-amber-100/30">·</span>
              <span className="text-stone-700 dark:text-stone-200">{p.short_label ?? p.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
