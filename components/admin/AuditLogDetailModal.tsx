"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { AuditDiffRow } from "@/lib/audit/audit-display"
import { cn } from "@/lib/utils"

export type AuditDetailPayload = {
  id: number | string
  created_at: string
  action: string
  entity_type: string | null
  entity_id: string | null
  user_id: string | null
  user_email: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  diff: AuditDiffRow[]
  element_label: string
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  logId: number | null
}

function actionTone(action: string): { label: string; className: string } {
  const a = String(action).toLowerCase()
  if (a === "create" || a === "insert")
    return {
      label: "Création",
      className: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100",
    }
  if (a === "delete" || a === "remove")
    return {
      label: "Suppression",
      className: "border-red-300 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100",
    }
  if (a.includes("cancel"))
    return {
      label: "Annulation",
      className: "border-slate-300 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
    }
  if (a.includes("error") || a.includes("fail") || a.includes("denied"))
    return {
      label: String(action),
      className: "border-rose-800 bg-rose-950 text-rose-50 dark:border-rose-950",
    }
  if (a === "login") return { label: "Connexion", className: "border-sky-300 bg-sky-50 text-sky-950 dark:bg-sky-950/40" }
  return {
    label: "Modification",
    className: "border-amber-300 bg-amber-50 text-amber-950 dark:bg-amber-950/25 dark:text-amber-100",
  }
}

export function AuditLogDetailModal({ open, onOpenChange, logId }: Props) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [detail, setDetail] = useState<AuditDetailPayload | null>(null)

  useEffect(() => {
    if (!open || logId == null) {
      setDetail(null)
      setErr(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setErr(null)
    void fetch(`/api/admin/audit-logs/${logId}`, { cache: "no-store" })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { detail?: AuditDetailPayload; error?: string }
        if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Erreur")
        return j.detail ?? null
      })
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, logId])

  const tone = detail ? actionTone(detail.action) : actionTone("update")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,760px)] flex-col gap-0 overflow-hidden rounded-2xl border-amber-200/60 p-0 sm:max-w-lg md:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-amber-200/40 bg-[color:var(--lux-cream)]/90 px-5 py-4 dark:border-amber-900/35 dark:bg-neutral-900/95">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <DialogTitle className="font-display text-lg tracking-tight">Détails de l&apos;événement</DialogTitle>
              <DialogDescription className="text-left text-xs text-muted-foreground">
                Ancien état vs nouvel état — données sensibles masquées automatiquement.
              </DialogDescription>
            </div>
            {detail ? (
              <Badge variant="outline" className={cn("shrink-0 text-[11px]", tone.className)}>
                {tone.label}
              </Badge>
            ) : null}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement…
            </div>
          ) : err ? (
            <p className="px-5 py-10 text-center text-sm text-rose-600">{err}</p>
          ) : detail ? (
            <ScrollArea className="max-h-[min(60vh,520px)] px-5 py-4">
              <div className="space-y-5 pr-3">
                <dl className="grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Date et heure</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {detail.created_at
                        ? new Date(detail.created_at).toLocaleString("fr-FR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Utilisateur</dt>
                    <dd className="mt-0.5 font-medium break-all">{detail.user_email ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Entité</dt>
                    <dd className="mt-0.5 font-medium">{detail.entity_type ?? "—"}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">ID enregistrement</dt>
                    <dd className="mt-0.5 truncate font-mono text-[11px]" title={detail.entity_id ?? ""}>
                      {detail.entity_id ?? "—"}
                    </dd>
                  </div>
                  {detail.element_label && detail.element_label !== "—" ? (
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Élément</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-foreground">{detail.element_label}</dd>
                    </div>
                  ) : null}
                </dl>

                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Modifications
                  </h4>
                  {detail.diff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Pas de différence détaillée (entrée brute ou données identiques).</p>
                  ) : (
                    <ul className="space-y-3">
                      {detail.diff.map((row) => (
                        <li
                          key={row.key}
                          className="rounded-xl border border-amber-200/55 bg-white/95 p-3 text-sm shadow-[0_1px_0_rgba(120,90,60,0.06)] transition-colors dark:border-slate-700 dark:bg-neutral-950/80"
                        >
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {row.label}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-rose-200/80 bg-rose-50/80 px-2.5 py-2 dark:border-rose-900/55 dark:bg-rose-950/25">
                              <span className="text-[10px] font-semibold uppercase text-rose-800 dark:text-rose-300">
                                Avant
                              </span>
                              <p className="mt-1 break-words font-mono text-[12px] text-rose-950 dark:text-rose-100">{row.before}</p>
                            </div>
                            <div className="rounded-lg border border-emerald-200/85 bg-emerald-50/80 px-2.5 py-2 dark:border-emerald-900/55 dark:bg-emerald-950/25">
                              <span className="text-[10px] font-semibold uppercase text-emerald-800 dark:text-emerald-300">
                                Après
                              </span>
                              <p className="mt-1 break-words font-mono text-[12px] text-emerald-950 dark:text-emerald-100">{row.after}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Accordion type="single" collapsible className="rounded-xl border border-slate-200/80 px-3 dark:border-slate-700">
                  <AccordionItem value="tech" className="border-none">
                    <AccordionTrigger className="py-3 text-xs font-medium hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        Vue technique (JSON sanitisé, optionnel)
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pb-4">
                      <p className="text-[11px] text-muted-foreground">Champs secrets remplacés par « masqué » pour l&apos;affichage.</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <pre className="max-h-[200px] overflow-auto rounded-lg border bg-neutral-950/[0.04] p-2 text-[10px] leading-relaxed dark:bg-white/[0.04]">
                          {detail.old_values && Object.keys(detail.old_values).length ? JSON.stringify(detail.old_values, null, 2) : "{}"}
                        </pre>
                        <pre className="max-h-[200px] overflow-auto rounded-lg border bg-neutral-950/[0.04] p-2 text-[10px] leading-relaxed dark:bg-white/[0.04]">
                          {detail.new_values && Object.keys(detail.new_values).length ? JSON.stringify(detail.new_values, null, 2) : "{}"}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollArea>
          ) : null}
        </div>

        <div className="shrink-0 border-t px-5 py-3 dark:border-neutral-800">
          <Button type="button" variant="outline" className="w-full rounded-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
