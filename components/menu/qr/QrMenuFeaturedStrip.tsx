"use client"

import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { QrTableMenuProductGrid } from "@/components/menu/qr/QrTableMenuProductGrid"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

type QrFeaturedKey = "bestseller" | "today"

type QrMenuFeaturedStripProps = {
  id: string
  icon: string
  titleKey: QrFeaturedKey
  titleAr: string
  items: QrMenuItem[]
  className?: string
}

/** Homepage promo section — same 2-column product grid as category pages. */
export function QrMenuFeaturedStrip({
  id,
  icon,
  titleKey,
  titleAr,
  items,
  className,
}: QrMenuFeaturedStripProps) {
  const { t, locale } = useI18n()

  if (items.length === 0) return null

  const primary = t(`menu.qrFeatured.${titleKey}`)
  const secondary = locale === "ar" ? undefined : titleAr

  return (
    <section id={id} className={cn("scroll-mt-28 space-y-3", className)}>
      <div className="px-1">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-white">
          <span>{icon}</span>
          <span>{primary}</span>
        </h2>
        {secondary ? (
          <p className="text-sm text-amber-300/70" dir="rtl">
            {secondary}
          </p>
        ) : null}
      </div>
      <QrTableMenuProductGrid items={items} />
    </section>
  )
}
