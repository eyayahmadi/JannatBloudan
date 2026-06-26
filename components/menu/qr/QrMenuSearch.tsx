"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

type QrMenuSearchProps = {
  value: string
  onChange: (value: string) => void
  resultCount?: number
}

export function QrMenuSearch({ value, onChange, resultCount }: QrMenuSearchProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-700/45 dark:text-amber-400/45" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Suchen — Deutsch oder عربي"
        aria-label="Speisekarte durchsuchen"
        className={cn(
          "w-full rounded-2xl border border-amber-200/70 bg-white py-3.5 pl-12 pr-12 text-base text-amber-950 shadow-sm",
          "placeholder:text-amber-800/40 transition-all duration-200",
          "focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/25 focus:shadow-md",
          "dark:border-amber-800/50 dark:bg-neutral-900 dark:text-white dark:placeholder:text-amber-300/35",
        )}
      />
      <AnimatePresence>
        {value ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-amber-700/70 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
            aria-label="Suche löschen"
          >
            <X className="h-4 w-4" />
          </motion.button>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {value.trim() && resultCount != null ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1.5 px-1 text-xs text-amber-800/55 dark:text-amber-300/55"
          >
            {resultCount} {resultCount === 1 ? "Ergebnis" : "Ergebnisse"}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
