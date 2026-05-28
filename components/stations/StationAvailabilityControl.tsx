"use client"

/**
 * StationAvailabilityControl
 * --------------------------
 * Pill + dropdown intégré dans le header du KDS (StationBoard) qui permet
 * à la station d'afficher / changer son statut courant :
 *   OPEN | BUSY | PAUSED | CLOSING_SOON | CLOSED
 *
 * Utilise le hook `useStationAvailability` (qui gère API + fallback localStorage).
 */

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  AVAILABILITY_META,
  STATION_AVAILABILITY_STATUSES,
  type StationAvailabilityStatus,
} from "@/lib/stations/availability"
import type { Station } from "@/lib/stations/config"
import { useStationAvailability } from "@/lib/hooks/useStationAvailability"
import { useI18n } from "@/lib/i18n/context"
import {
  CheckCircle2,
  Coffee,
  PauseCircle,
  Clock,
  XCircle,
  Loader2,
  Settings2,
} from "lucide-react"

const STATUS_ICON: Record<StationAvailabilityStatus, typeof CheckCircle2> = {
  OPEN: CheckCircle2,
  BUSY: Coffee,
  PAUSED: PauseCircle,
  CLOSING_SOON: Clock,
  CLOSED: XCircle,
}

const TONE_CLASS: Record<"ok" | "warn" | "muted" | "danger", string> = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300/60",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-300/60",
  muted: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-300/60",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border-red-300/60",
}

export type StationAvailabilityControlProps = {
  station: Station
  /** Affichage compact (sans le bouton "modifier"). */
  readOnly?: boolean
  className?: string
}

export function StationAvailabilityControl({
  station,
  readOnly = false,
  className,
}: StationAvailabilityControlProps) {
  const { t } = useI18n()
  const { get, setStatus, loading } = useStationAvailability()
  const current = get(station)
  const [open, setOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState<StationAvailabilityStatus>(current.status)
  const [draftReason, setDraftReason] = useState<string>(current.reason ?? "")
  const [draftWait, setDraftWait] = useState<string>(
    current.estimated_wait_minutes != null ? String(current.estimated_wait_minutes) : "",
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const meta = AVAILABILITY_META[current.status]
  const Icon = STATUS_ICON[current.status]

  function openDialog() {
    setDraftStatus(current.status)
    setDraftReason(current.reason ?? "")
    setDraftWait(
      current.estimated_wait_minutes != null ? String(current.estimated_wait_minutes) : "",
    )
    setError(null)
    setOpen(true)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const waitNum = draftWait.trim() === "" ? null : Number(draftWait)
    try {
      await setStatus(station, {
        status: draftStatus,
        reason: draftReason.trim() || null,
        estimated_wait_minutes:
          waitNum != null && Number.isFinite(waitNum) ? Math.max(0, Math.round(waitNum)) : null,
      })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={readOnly}
        onClick={readOnly ? undefined : openDialog}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
          TONE_CLASS[meta.tone],
          !readOnly && "hover:shadow-md hover:scale-[1.02] cursor-pointer",
          readOnly && "cursor-default opacity-90",
          className,
        )}
        title={t(meta.i18nKey, current.status)}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
        <span className="uppercase tracking-wide">
          {t(meta.i18nKey, current.status)}
        </span>
        {current.estimated_wait_minutes != null && current.estimated_wait_minutes > 0 && (
          <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1.5">
            ~{current.estimated_wait_minutes} min
          </Badge>
        )}
        {!readOnly && <Settings2 className="h-3 w-3 opacity-70" />}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("stations.availability.dialogTitle", "Disponibilité station")} —{" "}
              {t(`stations.${station.toLowerCase()}`, station)}
            </DialogTitle>
            <DialogDescription>
              {t(
                "stations.availability.dialogDesc",
                "Choisissez le statut affiché côté client / serveur.",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STATION_AVAILABILITY_STATUSES.map((s) => {
                const m = AVAILABILITY_META[s]
                const SIcon = STATUS_ICON[s]
                const isActive = draftStatus === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraftStatus(s)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition",
                      "hover:shadow-md",
                      isActive
                        ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white"
                        : "border-slate-200 dark:border-slate-800",
                      TONE_CLASS[m.tone],
                    )}
                  >
                    <SIcon className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {t(m.i18nKey, s)}
                    </span>
                    <span className="text-[10px] opacity-80">
                      {m.acceptingOrders
                        ? t("stations.availability.acceptingOrders", "Accepte commandes")
                        : t("stations.availability.blockingOrders", "Bloque commandes")}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="station-avail-reason">
                {t("stations.availability.reasonLabel", "Raison (visible staff)")}
              </Label>
              <Textarea
                id="station-avail-reason"
                value={draftReason}
                onChange={(e) => setDraftReason(e.target.value)}
                placeholder={t(
                  "stations.availability.reasonPh",
                  "Ex: Rush du soir, ingrédient manquant, fin de service…",
                )}
                rows={2}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="station-avail-wait">
                {t("stations.availability.waitLabel", "Temps d'attente estimé (min)")}
              </Label>
              <Input
                id="station-avail-wait"
                type="number"
                min={0}
                max={240}
                value={draftWait}
                onChange={(e) => setDraftWait(e.target.value)}
                placeholder="ex: 20"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              {t("common.cancel", "Annuler")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="me-1 h-4 w-4 animate-spin" />
              ) : null}
              {t("common.save", "Enregistrer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
