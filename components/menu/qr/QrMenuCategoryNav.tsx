"use client"

import { useEffect, useRef } from "react"
import type { QrPrintedMenuBlock } from "@/lib/menu/qr-printed-menu"
import { cn } from "@/lib/utils"

type QrMenuCategoryNavProps = {
  sections: QrPrintedMenuBlock[]
  onScrollToSection: (sectionId: string) => void
  activeSectionId?: string | null
  className?: string
}

function CategoryPill({
  section,
  active,
  onSelect,
  chipRef,
}: {
  section: QrPrintedMenuBlock
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
        <span className="text-base leading-none">{section.icon}</span>
        <span>{section.labelDe}</span>
      </span>
    </button>
  )
}

/** Horizontal category navigation — scroll-only shortcuts to menu sections. */
export function QrMenuCategoryNav({
  sections,
  onScrollToSection,
  activeSectionId = null,
  className,
}: QrMenuCategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const prevActiveRef = useRef<string | null>(null)

  useEffect(() => {
    if (!activeSectionId || prevActiveRef.current === activeSectionId) return
    prevActiveRef.current = activeSectionId

    const el = chipRefs.current[activeSectionId]
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
  }, [activeSectionId])

  if (sections.length === 0) return null

  return (
    <nav className={cn("w-full min-w-0 max-w-full", className)} aria-label="Kategorien" data-menu-category-nav>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((section) => (
          <CategoryPill
            key={section.id}
            section={section}
            active={activeSectionId === section.id}
            onSelect={() => onScrollToSection(section.id)}
            chipRef={(el) => {
              chipRefs.current[section.id] = el
            }}
          />
        ))}
      </div>
    </nav>
  )
}
