"use client"

import { useEffect, useMemo, useState } from "react"
import { X, Sparkles } from "lucide-react"
import type { PublicPromotion } from "@/lib/promotions/serialize"
import { formatPromoBadge } from "@/lib/promotions/serialize"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import {
  QR_PRODUCT_HIGHLIGHTS,
  pickQrHighlightProducts,
} from "@/lib/menu/qr-printed-menu"
import { cn } from "@/lib/utils"

const DISMISS_KEY = "qr-menu-promo-dismissed"

type QrMenuPromoBannersProps = {
  items: QrMenuItem[]
  onOpenProduct: (item: QrMenuItem) => void
  onScrollToSection: (sectionId: string) => void
  className?: string
}

function dismissId(id: string) {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    const set = new Set<string>(raw ? (JSON.parse(raw) as string[]) : [])
    set.add(id)
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

function isDismissed(id: string): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    return (JSON.parse(raw) as string[]).includes(id)
  } catch {
    return false
  }
}

export function QrMenuPromoBanners({
  items,
  onOpenProduct,
  onScrollToSection,
  className,
}: QrMenuPromoBannersProps) {
  const [promo, setPromo] = useState<PublicPromotion | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const initial = new Set<string>()
    for (const h of QR_PRODUCT_HIGHLIGHTS) {
      if (isDismissed(`highlight-${h.id}`)) initial.add(`highlight-${h.id}`)
    }
    if (isDismissed("promo-api")) initial.add("promo-api")
    setDismissed(initial)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch("/api/promotions/active?context=qr_table")
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        const promos = (body.promos ?? []) as PublicPromotion[]
        setPromo(promos[0] ?? null)
      })
      .catch(() => {
        if (!cancelled) setPromo(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const productHighlights = useMemo(() => {
    return QR_PRODUCT_HIGHLIGHTS.map((h) => ({
      def: h,
      product: pickQrHighlightProducts(items, h.tag, 1)[0] ?? null,
    })).filter((x) => x.product != null)
  }, [items])

  const handleDismiss = (id: string) => {
    dismissId(id)
    setDismissed((prev) => new Set([...prev, id]))
  }

  const banners: Array<{
    id: string
    title: string
    subtitle?: string
    onClick: () => void
    accent: string
  }> = []

  if (promo && !dismissed.has("promo-api")) {
    banners.push({
      id: "promo-api",
      title: promo.short_label || promo.name || "Angebot",
      subtitle: promo.description?.slice(0, 80) || formatPromoBadge(promo) || undefined,
      onClick: () => onScrollToSection("qr-section-menu"),
      accent: "from-amber-900/90 via-rose-950/90 to-stone-900/90",
    })
  }

  for (const { def, product } of productHighlights) {
    const id = `highlight-${def.id}`
    if (dismissed.has(id) || !product) continue
    banners.push({
      id,
      title: `${def.icon} ${def.labelDe}`,
      subtitle: product.name,
      onClick: () => onOpenProduct(product),
      accent: "from-stone-800/95 via-amber-950/95 to-stone-900/95",
    })
  }

  if (banners.length === 0) return null

  return (
    <div className={cn("space-y-2", className)}>
      {banners.slice(0, 3).map((b) => (
        <div
          key={b.id}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-amber-200/30 bg-gradient-to-r text-white shadow-sm",
            b.accent,
          )}
        >
          <button
            type="button"
            onClick={b.onClick}
            className="flex w-full items-center gap-3 px-4 py-3 pr-12 text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{b.title}</span>
              {b.subtitle ? (
                <span className="block truncate text-xs text-white/75">{b.subtitle}</span>
              ) : null}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleDismiss(b.id)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
