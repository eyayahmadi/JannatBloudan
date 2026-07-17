"use client"

import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { QrMenuProductCard } from "@/components/menu/qr/QrMenuProductCard"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

type QrFeaturedKey = "bestseller" | "today"

type QrMenuFeaturedStripProps = {
  id: string
  icon: string
  titleKey: QrFeaturedKey
  titleAr: string
  items: QrMenuItem[]
  favoriteIds: Set<string>
  onToggleFavorite: (productId: string) => void
  onOpenProduct: (item: QrMenuItem) => void
  onQuickAdd: (item: QrMenuItem) => void
  getInCartQty: (item: QrMenuItem) => number
  className?: string
}

export function QrMenuFeaturedStrip({
  id,
  icon,
  titleKey,
  titleAr,
  items,
  favoriteIds,
  onToggleFavorite,
  onOpenProduct,
  onQuickAdd,
  getInCartQty,
  className,
}: QrMenuFeaturedStripProps) {
  const { t, locale } = useI18n()

  if (items.length === 0) return null

  const primary = t(`menu.qrFeatured.${titleKey}`)
  const secondary = locale === "ar" ? undefined : titleAr

  return (
    <section id={id} className={cn("scroll-mt-28 space-y-3", className)}>
      <div className="px-1">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-amber-950 dark:text-white">
          <span>{icon}</span>
          <span>{primary}</span>
        </h2>
        {secondary ? (
          <p className="text-sm text-amber-800/55 dark:text-amber-300/55" dir="rtl">
            {secondary}
          </p>
        ) : null}
      </div>
      <div className="flex flex-row flex-nowrap gap-3 overflow-x-auto overscroll-x-contain pb-1 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => (
          <div key={item.id} className="w-[46%] min-w-[160px] max-w-[200px] shrink-0 grow-0 sm:w-[42%]">
            <QrMenuProductCard
              item={item}
              index={i}
              inCartQty={getInCartQty(item)}
              isFavorite={favoriteIds.has(item.id)}
              onToggleFavorite={() => onToggleFavorite(item.id)}
              onOpen={() => onOpenProduct(item)}
              onQuickAdd={() => onQuickAdd(item)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
