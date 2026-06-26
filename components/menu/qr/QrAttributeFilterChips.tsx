"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { QR_MENU_ATTRIBUTE_FILTERS, type QrAttributeFilterId } from "@/lib/menu/product-attributes"

type QrAttributeFilterChipsProps = {
  activeId: QrAttributeFilterId
  onSelect: (id: QrAttributeFilterId) => void
}

export function QrAttributeFilterChips({ activeId, onSelect }: QrAttributeFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {QR_MENU_ATTRIBUTE_FILTERS.map((chip) => {
        const active = activeId === chip.id
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.id)}
            className={cn(
              "relative shrink-0 rounded-full px-3 py-2 text-xs font-medium transition",
              active ? "text-white" : "border border-amber-200/70 bg-white/90 text-amber-950 dark:border-amber-800 dark:bg-neutral-800 dark:text-amber-100",
            )}
          >
            {active ? (
              <motion.span
                layoutId="qr-attr-chip"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-stone-700 to-amber-800 shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
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
