"use client"

import { Clock, Heart } from "lucide-react"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { QrMenuProductCard } from "@/components/menu/qr/QrMenuProductCard"
import { cn } from "@/lib/utils"

type QrMenuQuickSectionsProps = {
  favorites: QrMenuItem[]
  recentlyOrdered: QrMenuItem[]
  favoriteIds: Set<string>
  onToggleFavorite: (productId: string) => void
  onOpenProduct: (item: QrMenuItem) => void
  onQuickAdd: (item: QrMenuItem) => void
  getInCartQty: (item: QrMenuItem) => number
  className?: string
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Heart
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h2 className="text-sm font-bold tracking-tight text-amber-950 dark:text-white">{title}</h2>
        {subtitle ? <p className="text-[11px] text-amber-800/55 dark:text-amber-300/55">{subtitle}</p> : null}
      </div>
    </div>
  )
}

export function QrMenuQuickSections({
  favorites,
  recentlyOrdered,
  favoriteIds,
  onToggleFavorite,
  onOpenProduct,
  onQuickAdd,
  getInCartQty,
  className,
}: QrMenuQuickSectionsProps) {
  if (favorites.length === 0 && recentlyOrdered.length === 0) return null

  const renderStrip = (items: QrMenuItem[]) => (
    <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item, i) => (
        <div key={item.id} className="w-[46%] min-w-[160px] max-w-[200px] shrink-0 sm:w-[42%]">
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
  )

  return (
    <div className={cn("mb-8 space-y-6", className)}>
      {favorites.length > 0 ? (
        <section>
          <SectionHeader icon={Heart} title="Favoriten" subtitle="Ihre Lieblingsgerichte" />
          {renderStrip(favorites)}
        </section>
      ) : null}
      {recentlyOrdered.length > 0 ? (
        <section>
          <SectionHeader icon={Clock} title="Zuletzt bestellt" subtitle="Schnell erneut bestellen" />
          {renderStrip(recentlyOrdered)}
        </section>
      ) : null}
    </div>
  )
}
