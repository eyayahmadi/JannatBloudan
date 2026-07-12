"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { QrCategoryNavItem } from "@/lib/menu/qr-printed-menu"
import { cn } from "@/lib/utils"

type QrMenuCategoryNavProps = {
  categories: QrCategoryNavItem[]
  tableId: string
  activeSlug?: string | null
  className?: string
  /** Override category href (e.g. staff `/server/.../menu/...`). */
  hrefForCategory?: (slug: string) => string
}

function CategoryPill({
  category,
  active,
  onSelect,
  chipRef,
}: {
  category: QrCategoryNavItem
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
        <span className="text-base leading-none">{category.icon}</span>
        <span>{category.labelDe}</span>
      </span>
    </button>
  )
}

/** Horizontal category navigation — opens category pages. */
export function QrMenuCategoryNav({
  categories,
  tableId,
  activeSlug = null,
  className,
  hrefForCategory,
}: QrMenuCategoryNavProps) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const prevActiveRef = useRef<string | null>(null)

  useEffect(() => {
    if (!activeSlug || prevActiveRef.current === activeSlug) return
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

  if (categories.length === 0) return null

  return (
    <nav className={cn("w-full min-w-0 max-w-full", className)} aria-label="Kategorien" data-menu-category-nav>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => (
          <CategoryPill
            key={category.slug}
            category={category}
            active={activeSlug === category.slug}
            onSelect={() =>
              router.push(hrefForCategory?.(category.slug) ?? `/table/${tableId}/menu/${category.slug}`)
            }
            chipRef={(el) => {
              chipRefs.current[category.slug] = el
            }}
          />
        ))}
      </div>
    </nav>
  )
}
