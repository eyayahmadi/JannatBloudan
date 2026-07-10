"use client"

import { useEffect, useRef } from "react"
import {
  QR_NAV_CATEGORIES,
  countItemsInNavCategory,
  type QrNavCategory,
} from "@/lib/menu/qr-printed-menu"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { cn } from "@/lib/utils"

type QrMenuCategoryNavProps = {
  items: QrMenuItem[]
  activeSlug: string
  onSelect: (slug: string) => void
  className?: string
}

function CategoryPill({
  nav,
  active,
  onSelect,
  chipRef,
}: {
  nav: QrNavCategory
  active: boolean
  onSelect: () => void
  chipRef?: (el: HTMLButtonElement | null) => void
}) {
  return (
    <button
      ref={chipRef}
      type="button"
      onClick={onSelect}
      className={cn(
        "relative shrink-0 rounded-full px-3.5 py-2.5 text-sm font-medium transition-colors",
        active
          ? "text-white shadow-md shadow-amber-600/20"
          : "border border-amber-200/80 bg-white text-amber-950 hover:border-amber-300 dark:border-amber-800 dark:bg-neutral-900 dark:text-amber-100",
      )}
    >
      {active ? (
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-600 to-orange-600" />
      ) : null}
      <span className="relative flex items-center gap-1.5 whitespace-nowrap">
        <span className="text-base leading-none">{nav.icon}</span>
        <span>{nav.labelDe}</span>
      </span>
    </button>
  )
}

/** Sticky top category navigation — real menu categories only, fixed order. */
export function QrMenuCategoryNav({
  items,
  activeSlug,
  onSelect,
  className,
}: QrMenuCategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const prevActiveRef = useRef<string | null>(null)

  const visible = QR_NAV_CATEGORIES.filter((nav) => countItemsInNavCategory(items, nav) > 0)

  useEffect(() => {
    if (prevActiveRef.current === activeSlug) return
    prevActiveRef.current = activeSlug

    const el = chipRefs.current[activeSlug]
    const container = scrollRef.current
    if (!el || !container) return

    const elLeft = el.offsetLeft
    const elRight = elLeft + el.offsetWidth
    const viewLeft = container.scrollLeft
    const viewRight = viewLeft + container.clientWidth
    if (elLeft < viewLeft) {
      container.scrollTo({ left: elLeft - 8, behavior: "smooth" })
    } else if (elRight > viewRight) {
      container.scrollTo({ left: elRight - container.clientWidth + 8, behavior: "smooth" })
    }
  }, [activeSlug])

  if (visible.length === 0) return null

  return (
    <nav
      aria-label="Kategorien"
      className={cn("w-full min-w-0 max-w-full", className)}
      data-menu-category-nav
    >
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visible.map((nav) => (
          <CategoryPill
            key={nav.slug}
            nav={nav}
            active={activeSlug === nav.slug}
            onSelect={() => onSelect(nav.slug)}
            chipRef={(el) => {
              chipRefs.current[nav.slug] = el
            }}
          />
        ))}
      </div>
    </nav>
  )
}
