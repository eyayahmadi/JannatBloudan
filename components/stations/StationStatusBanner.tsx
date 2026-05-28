"use client"

/**
 * StationStatusBanner — bandeau client / serveur affichant l'état des stations.
 * -----------------------------------------------------------------------------
 * À insérer en haut d'une page menu, panier, table QR ou tableau serveur.
 * - Reste silencieux si toutes les stations sont OPEN
 * - Affiche un bandeau pour chaque station BUSY / PAUSED / CLOSING_SOON / CLOSED
 *
 * Le composant utilise `useStationAvailability` qui fait un fallback localStorage
 * si Supabase n'est pas configuré.
 */

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { useStationAvailability } from "@/lib/hooks/useStationAvailability"
import {
  AVAILABILITY_META,
  clientBlockedMessageKey,
  type StationAvailabilityStatus,
} from "@/lib/stations/availability"
import { STATIONS, STATION_META, type Station } from "@/lib/stations/config"
import { Clock, PauseCircle, XCircle, Coffee } from "lucide-react"

const ICON: Record<StationAvailabilityStatus, typeof Clock> = {
  OPEN: Clock,
  BUSY: Coffee,
  PAUSED: PauseCircle,
  CLOSING_SOON: Clock,
  CLOSED: XCircle,
}

const TONE_CLASS: Record<"ok" | "warn" | "muted" | "danger", string> = {
  ok: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
  warn: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  muted: "border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
  danger: "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100",
}

export type StationStatusBannerProps = {
  /** Restreint l'affichage à une station donnée (par défaut: les 3). */
  filter?: Station[]
  /** Si true, affiche aussi quand toutes les stations sont OPEN. */
  alwaysShow?: boolean
  className?: string
}

export function StationStatusBanner({
  filter,
  alwaysShow = false,
  className,
}: StationStatusBannerProps) {
  const { t } = useI18n()
  const { availability } = useStationAvailability()

  const stations = useMemo(() => filter ?? STATIONS, [filter])

  const visible = useMemo(() => {
    return stations
      .map((s) => availability[s])
      .filter((a) => a)
      .filter((a) => alwaysShow || a.status !== "OPEN")
  }, [availability, stations, alwaysShow])

  if (visible.length === 0) return null

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {visible.map((a) => {
        const stationMeta = STATION_META[a.station]
        const meta = AVAILABILITY_META[a.status]
        const Icon = ICON[a.status]
        const stationLabel = t(stationMeta.i18nKey, a.station)
        const messageKey = clientBlockedMessageKey(a.status, a.station)
        return (
          <div
            key={a.station}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm",
              TONE_CLASS[meta.tone],
            )}
            role="status"
          >
            <span aria-hidden className="text-2xl leading-none">
              {stationMeta.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {stationLabel} — {t(meta.i18nKey, a.status)}
                </span>
                {a.estimated_wait_minutes != null && a.estimated_wait_minutes > 0 && (
                  <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold dark:bg-black/30">
                    ~{a.estimated_wait_minutes} min
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm">
                {t(messageKey, "")}
                {a.reason ? ` — ${a.reason}` : null}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
