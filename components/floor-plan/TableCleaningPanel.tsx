"use client"

import { useState } from "react"
import { Check, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useElapsedTicker } from "@/lib/hooks/useElapsedTicker"
import {
  CLEANING_LABELS,
  MARK_CLEANED_LABELS,
  elapsedCleaningWait,
  formatCleaningElapsed,
} from "@/lib/table-lifecycle"

export function TableCleaningPanel({
  tableLabel,
  cleaningSince,
  onMarkCleaned,
  className,
  compact,
}: {
  tableLabel: string
  cleaningSince?: string | null
  onMarkCleaned: () => void | Promise<void>
  className?: string
  compact?: boolean
}) {
  const now = useElapsedTicker(true)
  const [busy, setBusy] = useState(false)
  const secs = elapsedCleaningWait(cleaningSince, now)

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-teal-300 bg-gradient-to-b from-teal-50 to-white p-4 shadow-sm dark:border-teal-800 dark:from-teal-950/40 dark:to-neutral-900",
        "animate-service-request-pulse",
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          {CLEANING_LABELS.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("font-bold text-teal-900 dark:text-teal-100", compact ? "text-sm" : "text-base")}>
            {CLEANING_LABELS.fr}
          </p>
          <p className="text-xs text-teal-800/80 dark:text-teal-200/80" dir="rtl">
            {CLEANING_LABELS.ar}
          </p>
          {!compact ? (
            <p className="mt-1 text-xs text-teal-700/70 dark:text-teal-300/70">
              Table {tableLabel} — en attente depuis{" "}
              <span className="font-mono font-semibold">{formatCleaningElapsed(secs)}</span>
            </p>
          ) : (
            <p className="mt-0.5 font-mono text-[10px] text-teal-700 dark:text-teal-300">
              {formatCleaningElapsed(secs)}
            </p>
          )}
        </div>
      </div>
      <Button
        type="button"
        className="w-full gap-2 bg-teal-600 hover:bg-teal-700"
        disabled={busy}
        onClick={() => {
          setBusy(true)
          void Promise.resolve(onMarkCleaned()).finally(() => setBusy(false))
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {MARK_CLEANED_LABELS.fr}
        <span className="text-[10px] opacity-80" dir="rtl">
          {MARK_CLEANED_LABELS.ar}
        </span>
      </Button>
      {!compact ? (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          {MARK_CLEANED_LABELS.de} · {MARK_CLEANED_LABELS.en}
        </p>
      ) : null}
    </div>
  )
}

export const CLEANING_CARD_RING =
  "border-teal-400 ring-2 ring-teal-400/45 shadow-[0_0_0_4px_rgba(20,184,166,0.12)] animate-service-request-pulse"
