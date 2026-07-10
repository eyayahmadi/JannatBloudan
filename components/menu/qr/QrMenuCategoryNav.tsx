"use client"

import {
  QR_NAV_CATEGORIES,
  countItemsInNavCategory,
  qrSectionDomId,
  type QrNavCategory,
} from "@/lib/menu/qr-printed-menu"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { cn } from "@/lib/utils"

type QrMenuCategoryNavProps = {
  items: QrMenuItem[]
  onSelectCategory: (sectionId: string) => void
  className?: string
}

function CategoryCard({
  nav,
  count,
  onSelect,
}: {
  nav: QrNavCategory
  count: number
  onSelect: () => void
}) {
  if (count === 0) return null

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-[6.5rem] w-[8.75rem] shrink-0 flex-col justify-between rounded-2xl border border-amber-200/70 bg-white p-3.5 text-left shadow-sm transition",
        "hover:border-amber-300 hover:shadow-md active:scale-[0.98]",
        "dark:border-amber-900/40 dark:bg-neutral-900 dark:hover:border-amber-800",
      )}
    >
      <span className="text-2xl leading-none">{nav.icon}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-amber-950 dark:text-white">{nav.labelDe}</p>
        <p className="truncate text-xs text-amber-800/55 dark:text-amber-300/55" dir="rtl">
          {nav.labelAr}
        </p>
      </div>
    </button>
  )
}

export function QrMenuCategoryNav({ items, onSelectCategory, className }: QrMenuCategoryNavProps) {
  const visible = QR_NAV_CATEGORIES.filter((nav) => countItemsInNavCategory(items, nav) > 0)

  if (visible.length === 0) return null

  return (
    <section className={cn("space-y-3", className)} aria-label="Kategorien">
      <div className="px-1">
        <h2 className="font-display text-lg font-bold tracking-tight text-amber-950 dark:text-white">
          Karte
        </h2>
        <p className="text-sm text-amber-800/55 dark:text-amber-300/55" dir="rtl">
          قائمة الطعام
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((nav) => (
          <CategoryCard
            key={nav.slug}
            nav={nav}
            count={countItemsInNavCategory(items, nav)}
            onSelect={() => onSelectCategory(qrSectionDomId(nav.slug))}
          />
        ))}
      </div>
    </section>
  )
}
