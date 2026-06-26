"use client"

import { useEffect, useState } from "react"
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

/** Pastille discrète indiquant l'état de la synchronisation temps réel. */
export function RealtimeIndicator({ className }: { className?: string }) {
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        meta.className,
        className,
      )}
      title={`Synchronisation : ${meta.label}`}
    >
      <span className="relative flex h-2 w-2">
        {status === "live" ? (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              meta.dot,
            )}
          />
        ) : null}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dot)} />
      </span>
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{meta.label}</span>
    </span>
  )
}
