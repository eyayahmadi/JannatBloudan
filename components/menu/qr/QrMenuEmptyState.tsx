"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

type QrMenuEmptyStateProps = {
  variant: "search" | "category" | "error" | "offline"
  onReset?: () => void
  onRetry?: () => void
}

const COPY = {
  search: {
    emoji: "🔍",
    title: "Kein Gericht gefunden",
    body: "Versuchen Sie einen anderen Suchbegriff — auf Deutsch oder Arabisch.",
  },
  category: {
    emoji: "🍽️",
    title: "Keine Gerichte hier",
    body: "In dieser Kategorie sind derzeit keine Gerichte verfügbar.",
  },
  error: {
    emoji: "⚠️",
    title: "Speisekarte nicht geladen",
    body: "Die Karte konnte nicht geladen werden. Bitte erneut versuchen.",
  },
  offline: {
    emoji: "📡",
    title: "Keine Verbindung",
    body: "Prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
  },
} as const

export function QrMenuEmptyState({ variant, onReset, onRetry }: QrMenuEmptyStateProps) {
  const c = COPY[variant]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 py-20 text-center"
    >
      <motion.span
        className="text-5xl"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {c.emoji}
      </motion.span>
      <div className="max-w-xs space-y-2">
        <p className="text-lg font-semibold text-amber-950 dark:text-white">{c.title}</p>
        <p className="text-sm leading-relaxed text-amber-800/65 dark:text-amber-300/65">{c.body}</p>
      </div>
      {variant === "search" && onReset ? (
        <Button type="button" variant="outline" size="sm" onClick={onReset} className="rounded-full">
          Suche zurücksetzen
        </Button>
      ) : null}
      {(variant === "error" || variant === "offline") && onRetry ? (
        <Button type="button" size="sm" onClick={onRetry} className="rounded-full">
          Erneut laden
        </Button>
      ) : null}
    </motion.div>
  )
}

export function QrMenuCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="overflow-hidden rounded-2xl border border-amber-100/80 bg-white shadow-sm dark:border-amber-900/25 dark:bg-neutral-900"
    >
      <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-amber-100/90 to-amber-50/50 dark:from-neutral-800 dark:to-neutral-900" />
      <div className="space-y-2.5 p-3.5">
        <div className="h-4 w-4/5 animate-pulse rounded-lg bg-amber-100 dark:bg-neutral-800" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-amber-50 dark:bg-neutral-800/80" />
        <div className="h-3 w-full animate-pulse rounded bg-amber-50/80 dark:bg-neutral-800/60" />
        <div className="flex justify-between pt-1">
          <div className="h-5 w-16 animate-pulse rounded bg-amber-100 dark:bg-neutral-800" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-amber-100 dark:bg-neutral-800" />
        </div>
      </div>
    </motion.div>
  )
}
