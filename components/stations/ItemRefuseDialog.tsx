"use client"

/**
 * ItemRefuseDialog
 * ----------------
 * Dialog modal qui demande au staff d'une station :
 *   1. Une raison codifiée du refus
 *   2. Une note libre optionnelle
 *   3. Un flag "déjà préparé → marquer en perte" (waste) si pertinent
 */

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import {
  REFUSAL_REASON_CODES,
  REFUSAL_REASON_META,
  type RefusalReasonCode,
} from "@/lib/stations/refusal-reasons"
import { Loader2 } from "lucide-react"

const TONE_CLASS: Record<"danger" | "warn" | "muted", string> = {
  danger: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border-red-300/60",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-300/60",
  muted: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-300/60",
}

export type ItemRefuseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  /** True si l'item était déjà en cours de préparation (donne accès au flag waste). */
  canMarkWaste?: boolean
  /** Préselection (par ex. raison auto basée sur availability.status). */
  defaultReason?: RefusalReasonCode
  onConfirm: (payload: {
    reasonCode: RefusalReasonCode
    reasonNote: string
    markWaste: boolean
  }) => Promise<void> | void
}

export function ItemRefuseDialog({
  open,
  onOpenChange,
  itemName,
  canMarkWaste = false,
  defaultReason,
  onConfirm,
}: ItemRefuseDialogProps) {
  const { t } = useI18n()
  const [reason, setReason] = useState<RefusalReasonCode>(defaultReason ?? "produit_indisponible")
  const [note, setNote] = useState("")
  const [waste, setWaste] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setReason(defaultReason ?? "produit_indisponible")
      setNote("")
      setWaste(false)
      setError(null)
      setSubmitting(false)
    }
  }, [open, defaultReason])

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm({ reasonCode: reason, reasonNote: note.trim(), markWaste: waste })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("stations.refuseDialog.title", "Refuser l'item")} — {itemName}
          </DialogTitle>
          <DialogDescription>
            {t(
              "stations.refuseDialog.desc",
              "Cette action notifie le client et le serveur. L'item ne sera pas facturé.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-1">
          <div>
            <Label className="text-xs">
              {t("stations.refuseDialog.reasonLabel", "Raison")}
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {REFUSAL_REASON_CODES.map((code) => {
                const meta = REFUSAL_REASON_META[code]
                const isActive = reason === code
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setReason(code)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-xs font-medium transition hover:shadow-sm",
                      isActive
                        ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white"
                        : "border-slate-200 dark:border-slate-800",
                      TONE_CLASS[meta.tone],
                    )}
                  >
                    {t(meta.i18nKey, code)}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="refuse-note" className="text-xs">
              {t("stations.refuseDialog.noteLabel", "Note (optionnelle)")}
            </Label>
            <Textarea
              id="refuse-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t(
                "stations.refuseDialog.notePh",
                "Ex: « Plus de pâte à pizza, désolé. »",
              )}
              rows={2}
            />
          </div>

          {canMarkWaste && (
            <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/40">
              <input
                type="checkbox"
                checked={waste}
                onChange={(e) => setWaste(e.target.checked)}
                className="mt-0.5"
              />
              <div>
                <div className="font-semibold text-amber-900 dark:text-amber-100">
                  {t("stations.refuseDialog.wasteLabel", "Marquer en perte (waste)")}
                </div>
                <p className="text-amber-800 dark:text-amber-200/80">
                  {t(
                    "stations.refuseDialog.wasteHelp",
                    "Item déjà préparé : le stock reste consommé mais l'item n'est pas facturé.",
                  )}
                </p>
              </div>
            </label>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel", "Annuler")}
          </Button>
          <Button onClick={handleConfirm} disabled={submitting} variant="destructive">
            {submitting ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : null}
            {t("stations.refuseDialog.confirm", "Refuser l'item")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
