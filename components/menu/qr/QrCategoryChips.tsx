"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { QrTableCategoryChip } from "@/lib/menu/qr-table-category-chips"

type QrCategoryChipsProps = {
  chips: QrTableCategoryChip[]
  activeId: string
  onSelect: (id: string) => void
}

export function QrCategoryChips({ chips, activeId, onSelect }: QrCategoryChipsProps) {
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevActiveRef = useRef<string | null>(null)

  // Scroll chip strip horizontally only — skip first paint, never scroll the page.
  useEffect(() => {
    if (prevActiveRef.current === activeId) return
    prevActiveRef.current = activeId

    const el = chipRefs.current[activeId]
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
  }, [activeId])

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((cat) => {
        const active = activeId === cat.id
        return (
          <button
            key={cat.id}
            ref={(node) => {
              chipRefs.current[cat.id] = node
            }}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              "relative shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "text-white"
                : "border border-amber-200/80 bg-white/90 text-amber-950 hover:border-amber-300 dark:border-amber-800 dark:bg-neutral-800/90 dark:text-amber-100",
            )}
          >
            {active ? (
              <span
                className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 shadow-md shadow-amber-600/25"
              />
            ) : null}
            <span className="relative flex items-center gap-1.5">
              <span className="text-base leading-none">{cat.icon}</span>
              <span>{cat.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
