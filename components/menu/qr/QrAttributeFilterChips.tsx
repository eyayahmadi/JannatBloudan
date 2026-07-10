"use client"

import { cn } from "@/lib/utils"
import { QR_MENU_ATTRIBUTE_FILTERS, type QrAttributeFilterId } from "@/lib/menu/product-attributes"

type QrAttributeFilterChipsProps = {
  activeId: QrAttributeFilterId
  onSelect: (id: QrAttributeFilterId) => void
}

export function QrAttributeFilterChips({ activeId, onSelect }: QrAttributeFilterChipsProps) {
  return (
    <div className="flex min-h-10 w-full min-w-0 max-w-full shrink-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {QR_MENU_ATTRIBUTE_FILTERS.map((chip) => {
        const active = activeId === chip.id
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.id)}
            className={cn(
              "relative shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors",
              active ? "text-white" : "border border-amber-200/70 bg-white/90 text-amber-950 dark:border-amber-800 dark:bg-neutral-800 dark:text-amber-100",
            )}
          >
            {active ? (
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-stone-700 to-amber-800 shadow-sm" />
            ) : null}
            <span className="relative flex items-center gap-1">
              <span>{chip.icon}</span>
              <span>{chip.labelDe}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
