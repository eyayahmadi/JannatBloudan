"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { QrTableCategoryChip } from "@/lib/menu/qr-table-category-chips"

type QrCategoryChipsProps = {
  chips: QrTableCategoryChip[]
  activeId: string
  onSelect: (id: string) => void
}

export function QrCategoryChips({ chips, activeId, onSelect }: QrCategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((cat) => {
        const active = activeId === cat.id
        return (
          <button
            key={cat.id}
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
              <motion.span
                layoutId="qr-active-chip"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 shadow-md shadow-amber-600/25"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
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
