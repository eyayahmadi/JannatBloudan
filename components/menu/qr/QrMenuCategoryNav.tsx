"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Wind } from "lucide-react"
import type { QrCategoryNavItem } from "@/lib/menu/qr-printed-menu"
import { isShishaCategorySlug } from "@/lib/menu/category-display-icon"
import { resolveQrCategoryLabel } from "@/lib/menu/qr-category-i18n"
import { useI18n } from "@/lib/i18n/context"
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
  label,
  onSelect,
  chipRef,
}: {
  category: QrCategoryNavItem
  active: boolean
  label: string
  onSelect: () => void
  chipRef?: (el: HTMLButtonElement | null) => void
}) {
  const shisha = isShishaCategorySlug(category.slug)

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
        <span className="text-base leading-none">
          {shisha ? (
            <Wind className="h-4 w-4 stroke-[1.75] text-sky-200" aria-hidden />
          ) : (
            category.icon
          )}
        </span>
        <span>{label}</span>
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
  const { t, locale } = useI18n()
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
    <nav className={cn("w-full min-w-0 max-w-full", className)} aria-label={t("menu.qrCategoriesAria")} data-menu-category-nav>
      <div
        ref={scrollRef}
        className="flex flex-row flex-nowrap gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-0.5 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {categories.map((category) => {
          const { primary } = resolveQrCategoryLabel(
            category.slug,
            locale,
            t,
            category.labelDe,
            category.labelAr,
          )
          return (
          <CategoryPill
            key={category.slug}
            category={category}
            label={primary}
            active={activeSlug === category.slug}
            onSelect={() =>
              router.push(hrefForCategory?.(category.slug) ?? `/table/${tableId}/menu/${category.slug}`)
            }
            chipRef={(el) => {
              chipRefs.current[category.slug] = el
            }}
          />
          )
        })}
      </div>
    </nav>
  )
}
