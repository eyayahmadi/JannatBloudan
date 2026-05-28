"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ClipboardList, Eye, Loader2, RefreshCw, Search, User } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AuditLogDetailModal } from "@/components/admin/AuditLogDetailModal"
import { cn } from "@/lib/utils"
import type { AuditListRow } from "@/lib/audit/audit-display"

type ApiPayload = {
  rows?: AuditListRow[]
  total?: number
  page?: number
  pageSize?: number
  error?: string
}

function actionTone(action: string): { badge: string; short: string } {
  const a = String(action).toLowerCase()
  if (a === "create" || a === "insert")
    return {
      short: "+",
      badge: "border-emerald-300/85 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/35 dark:text-emerald-50",
    }
  if (a === "delete" || a === "remove")
    return {
      short: "×",
      badge: "border-red-300/85 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-50",
    }
  if (a.includes("cancel"))
    return {
      short: "⊘",
      badge: "border-slate-300 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
    }
  if (a.includes("error") || a.includes("fail"))
    return {
      short: "!",
      badge: "border-rose-800 bg-rose-950 text-rose-50",
    }
  if (a === "login") return { short: "↪", badge: "border-sky-300 bg-sky-50 text-sky-950 dark:bg-sky-950/35" }
  return {
    short: "⟳",
    badge: "border-amber-300/85 bg-amber-50 text-amber-950 dark:bg-amber-950/35 dark:text-amber-50",
  }
}

export default function AdminAuditLogPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [actionFilter, setActionFilter] = useState("")
  const [entityTypeFilter, setEntityTypeFilter] = useState("")
  const [entityIdFilter, setEntityIdFilter] = useState("")
  const [userFilter, setUserFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [textQuery, setTextQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [payload, setPayload] = useState<ApiPayload | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const sp = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    if (actionFilter.trim()) sp.set("action", actionFilter.trim())
    if (entityTypeFilter.trim()) sp.set("entity_type", entityTypeFilter.trim())
    if (entityIdFilter.trim()) sp.set("entity_id", entityIdFilter.trim())
    if (userFilter.trim()) sp.set("user", userFilter.trim())
    if (dateFrom.trim()) sp.set("date_from", dateFrom.trim())
    if (dateTo.trim()) sp.set("date_to", dateTo.trim())
    if (textQuery.trim()) sp.set("q", textQuery.trim())
    try {
      const res = await fetch(`/api/admin/audit-logs?${sp.toString()}`, { cache: "no-store" })
      const j = (await res.json()) as ApiPayload
      if (!res.ok) {
        setErr(j.error ?? "Erreur")
        setPayload(null)
        return
      }
      setPayload(j)
    } catch {
      setErr("Réseau")
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, actionFilter, entityTypeFilter, entityIdFilter, userFilter, dateFrom, dateTo, textQuery])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  const rows = payload?.rows ?? []
  const total = payload?.total ?? 0

  const openDetail = (id: number) => {
    setDetailId(id)
    setDetailOpen(true)
  }

  const resetFilters = () => {
    setActionFilter("")
    setEntityTypeFilter("")
    setEntityIdFilter("")
    setUserFilter("")
    setDateFrom("")
    setDateTo("")
    setTextQuery("")
    setPage(1)
  }

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell className="min-h-screen bg-[color:var(--lux-cream)] dark:bg-neutral-950">
        <SiteHeader hideMainNav backHref="/admin" backLabel="Admin" />
        <div className="site-container py-8">
          <Link
            href="/admin"
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Retour tableau de bord
          </Link>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display flex items-center gap-3 text-3xl font-semibold tracking-tight text-foreground">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/80 bg-white/85 shadow-sm dark:border-amber-900/50 dark:bg-neutral-900/80">
                  <ClipboardList className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                </span>
                Journal d&apos;audit
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Vue synthétique des changements. Les payloads complets sont chargés au clic (« Détails »).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-full border-amber-200/70 dark:border-amber-800"
              onClick={() => void fetchLogs()}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Actualiser
            </Button>
          </div>

          <Card className="mb-6 border-amber-200/55 bg-white/85 shadow-sm backdrop-blur-sm dark:border-amber-900/40 dark:bg-neutral-900/70">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold">Filtres</CardTitle>
                <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={resetFilters}>
                  Réinitialiser
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Recherche globale</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    className="h-10 pl-9"
                    placeholder="Email exact, UUID, ou nom d&apos;entité…"
                    value={textQuery}
                    onChange={(e) => {
                      setTextQuery(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Utilisateur</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    className="h-10 pl-9"
                    placeholder="E-mail ou UUID auth…"
                    value={userFilter}
                    onChange={(e) => {
                      setUserFilter(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Type d&apos;action</label>
                <Select
                  value={actionFilter === "" ? "_all" : actionFilter}
                  onValueChange={(v) => {
                    setActionFilter(v === "_all" ? "" : v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Toutes</SelectItem>
                    <SelectItem value="create">Création</SelectItem>
                    <SelectItem value="update">Modification</SelectItem>
                    <SelectItem value="delete">Suppression</SelectItem>
                    <SelectItem value="login">Connexion</SelectItem>
                    <SelectItem value="cancel">Annulation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Entité (table)</label>
                <Input
                  placeholder="ex. products"
                  className="h-10 rounded-xl"
                  value={entityTypeFilter}
                  onChange={(e) => {
                    setEntityTypeFilter(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">ID enregistrement</label>
                <Input
                  placeholder="UUID ou texte id…"
                  className="h-10 rounded-xl font-mono text-xs"
                  value={entityIdFilter}
                  onChange={(e) => {
                    setEntityIdFilter(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Du</label>
                <Input
                  type="date"
                  className="h-10 rounded-xl"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Au</label>
                <Input
                  type="date"
                  className="h-10 rounded-xl"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Par page</label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {err ? <p className="mb-4 text-sm text-rose-600">{err}</p> : null}

          <Card className="overflow-hidden border-amber-200/50 bg-white/90 shadow-md dark:border-amber-900/35 dark:bg-neutral-900/75">
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 border-b border-amber-100/70 bg-gradient-to-r from-[#fdfbf7] to-white pb-4 dark:border-amber-900/35 dark:from-neutral-950 dark:to-neutral-900">
              <CardTitle className="text-lg">Événements</CardTitle>
              <span className="text-xs text-muted-foreground sm:text-sm">
                {total} entrée(s) · page {page}
              </span>
            </CardHeader>
            <CardContent className="px-3 py-4 sm:px-5">
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <span className="text-sm">Chargement du journal…</span>
                </div>
              ) : rows.length === 0 ? (
                <p className="py-16 text-center text-muted-foreground">Aucune entrée ne correspond aux filtres.</p>
              ) : (
                <div className="space-y-3">
                  <div className="mb-2 hidden grid-cols-12 gap-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
                    <span className="col-span-2">Quand</span>
                    <span className="col-span-3">Acteur</span>
                    <span className="col-span-2">Type</span>
                    <span className="col-span-3">Résumé</span>
                    <span className="col-span-2 text-right"></span>
                  </div>

                  <ul className="space-y-2">
                    {rows.map((row) => {
                      const tone = actionTone(row.action)
                      return (
                        <li key={row.id}>
                          <article
                            className={cn(
                              "group rounded-2xl border border-amber-200/55 bg-gradient-to-br from-white to-[#fcf9f5] px-3 py-3 shadow-sm transition",
                              "hover:border-amber-300/95 hover:shadow-md dark:border-slate-700/90 dark:from-neutral-950 dark:to-neutral-900 dark:hover:border-amber-800/65",
                              "sm:py-4",
                            )}
                          >
                            <div className="grid gap-3 lg:grid-cols-12 lg:items-start lg:gap-2 lg:px-2">
                              <div className="flex flex-wrap items-center gap-2 lg:col-span-2 lg:flex-col lg:items-start lg:gap-1">
                                <time
                                  dateTime={row.created_at}
                                  className="whitespace-nowrap text-[11px] font-medium tabular-nums text-slate-600 dark:text-slate-300 sm:text-xs"
                                >
                                  {new Date(row.created_at).toLocaleString("fr-FR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </time>
                              </div>
                              <div className="lg:col-span-3">
                                <p className="text-sm font-semibold leading-tight text-foreground">
                                  {row.user_email ?? (
                                    <span className="font-normal text-muted-foreground">Système / non renseigné</span>
                                  )}
                                </p>
                                {row.user_id ? (
                                  <p className="mt-1 font-mono text-[10px] text-muted-foreground" title={row.user_id}>
                                    {String(row.user_id).slice(0, 10)}…
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap gap-2 lg:col-span-2">
                                <Badge variant="outline" className={cn("rounded-full px-2.5 text-[11px] font-semibold", tone.badge)}>
                                  <span aria-hidden>{tone.short}</span>
                                  &nbsp;<span className="capitalize">{row.action}</span>
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-slate-200/85 bg-white/90 text-[11px] dark:border-slate-600 dark:bg-neutral-900/65"
                                >
                                  {row.entity_type ?? "—"}
                                </Badge>
                              </div>
                              <div className="min-w-0 lg:col-span-3">
                                <p
                                  className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400"
                                  title={row.element_label}
                                >
                                  {row.element_label !== "—"
                                    ? row.element_label
                                    : row.entity_id?.slice(0, 36) ?? "Élément"}
                                </p>
                                <p className="mt-1 line-clamp-2 text-sm leading-snug text-foreground" title={row.summary}>
                                  {row.summary}
                                </p>
                              </div>
                              <div className="flex justify-end lg:col-span-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="gap-2 rounded-full border border-amber-200/85 bg-white/95 shadow-none hover:bg-amber-50 dark:border-amber-900/55 dark:bg-neutral-900 dark:hover:bg-amber-950/40"
                                  onClick={() => openDetail(row.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                  Détails
                                </Button>
                              </div>
                            </div>
                          </article>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {total > pageSize ? (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-dashed border-amber-200/50 pt-6 dark:border-slate-700">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full px-6"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {Math.min((page - 1) * pageSize + 1, total)} – {Math.min(page * pageSize, total)}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full px-6"
                    disabled={page * pageSize >= total || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <AuditLogDetailModal open={detailOpen} onOpenChange={setDetailOpen} logId={detailId} />
      </PageShell>
    </RequireAuth>
  )
}
