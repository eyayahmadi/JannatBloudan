"use client"

import { memo, useEffect, useState } from "react"
import { Radio, RefreshCw, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getRealtimeStatus,
  onRealtimeStatus,
  type RealtimeConnectionStatus,
} from "@/lib/realtime/bus"

const META: Record<
  RealtimeConnectionStatus,
  { label: string; icon: typeof Wifi; className: string; dot: string }
> = {
  live: {
    label: "Temps réel",
    icon: Radio,
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  connecting: {
    label: "Connexion…",
    icon: Wifi,
    className:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  polling: {
    label: "Synchro auto",
    icon: RefreshCw,
    className:
      "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    dot: "bg-slate-400",
  },
}

/** Pastille discrète — dimensions fixes, pas d'animation layout. */
export const RealtimeIndicator = memo(function RealtimeIndicator({
  className,
}: {
  className?: string
}) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>("connecting")

  useEffect(() => {
    setStatus(getRealtimeStatus())
    return onRealtimeStatus(setStatus)
  }, [])

  const meta = META[status]
  const Icon = meta.icon

  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-[6.75rem] shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold",
        meta.className,
        className,
      )}
      title={`Synchronisation : ${meta.label}`}
    >
      <span className={cn("inline-flex h-2 w-2 shrink-0 rounded-full", meta.dot)} />
      <Icon className="h-3 w-3 shrink-0" />
      <span className="hidden truncate sm:inline">{meta.label}</span>
    </span>
  )
})
