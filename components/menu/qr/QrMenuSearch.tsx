"use client"

import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

type QrMenuSearchProps = {
  value: string
  onChange: (value: string) => void
  resultCount?: number
}

export function QrMenuSearch({ value, onChange, resultCount }: QrMenuSearchProps) {
  const showCount = value.trim() && resultCount != null

  return (
    <div className="relative [overflow-anchor:none]">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-700/45 dark:text-amber-400/45" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Suchen — Deutsch oder عربي"
        aria-label="Speisekarte durchsuchen"
        enterKeyHint="search"
        className={cn(
          "w-full rounded-2xl border border-amber-200/70 bg-white py-3.5 pl-12 pr-12 text-base text-amber-950 shadow-sm",
          "placeholder:text-amber-800/40 transition-[border-color,box-shadow] duration-200",
          "focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/25 focus:shadow-md",
          "dark:border-amber-800/50 dark:bg-neutral-900 dark:text-white dark:placeholder:text-amber-300/35",
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-amber-700/70 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
          aria-label="Suche löschen"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      <p
        className={cn(
          "mt-1.5 min-h-[1.125rem] px-1 text-xs text-amber-800/55 transition-opacity dark:text-amber-300/55",
          showCount ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-live="polite"
      >
        {showCount ? `${resultCount} ${resultCount === 1 ? "Ergebnis" : "Ergebnisse"}` : "\u00a0"}
      </p>
    </div>
  )
}
