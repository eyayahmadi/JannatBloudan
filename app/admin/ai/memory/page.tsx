"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Brain,
  ChevronDown,
  Code2,
  Database,
  RefreshCw,
  Smile,
  ThumbsDown,
  ThumbsUp,
  UtensilsCrossed,
} from "lucide-react"
import type { ClientAgentMemory } from "@/lib/agent-memory/types"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/context/AuthContext"
import { cn } from "@/lib/utils"

type MemoryApiOk = {
  memory: ClientAgentMemory
  ragBackend: string
  generatedAt: string
}

function isMemoryApiOk(data: unknown): data is MemoryApiOk {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return typeof d.ragBackend === "string" && typeof d.generatedAt === "string" && d.memory != null && typeof d.memory === "object"
}

function formatFrDate(iso: string | undefined) {
  if (!iso) return "—"
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return iso
  return new Date(t).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function MemoryAgentPage() {
  const { user } = useAuth()
  const [clientKey, setClientKey] = useState("demo-client")
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [techOpen, setTechOpen] = useState(false)

  const endpoint = useMemo(
    () => `/api/ai/memory?clientKey=${encodeURIComponent(clientKey)}`,
    [clientKey],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(endpoint)
      const json = await res.json()
      setData(json)
    } catch {
      setData({ error: "Erreur reseau" })
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    setData(null)
  }, [clientKey])

  useEffect(() => {
    void load()
  }, [load])

  const isAdmin = user?.role === "ADMIN"
  const ok = isMemoryApiOk(data) ? data : null
  const err =
    data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
      ? (data as { error: string }).error
      : null

  const learningPercent = ok ? Math.min(100, Math.max(0, Math.round((ok.memory.learningScore ?? 0) * 100))) : 0

  const tasteEntries = ok
    ? Object.entries(ok.memory.tasteVector ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 16)
    : []

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell className="bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <SiteHeader backHref="/admin/ai" backLabel="Centre AI" hideMainNav />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Agent Mémoire &amp; RAG</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Profil client, préférences et corpus — sans exposer le brut par défaut.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
              className="shrink-0 border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Rafraîchir
            </Button>
          </div>

          <Card className="mb-6 border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <CardContent className="pt-6">
              <Label htmlFor="ck" className="text-slate-700 dark:text-slate-300">
                Clé client (session chat / utilisateur)
              </Label>
              <Input
                id="ck"
                value={clientKey}
                onChange={(e) => setClientKey(e.target.value)}
                className="mt-2 max-w-md font-mono text-sm"
                placeholder="sessionId ou identifiant stable"
              />
            </CardContent>
          </Card>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse border-slate-200/60 bg-white/60 dark:border-slate-800">
                  <CardContent className="h-32 pt-6" />
                </Card>
              ))}
            </div>
          ) : null}

          {!loading && err ? (
            <Card className="border-red-200 bg-red-50/90 dark:border-red-900 dark:bg-red-950/40">
              <CardHeader>
                <CardTitle className="text-red-900 dark:text-red-100">Impossible de charger la mémoire</CardTitle>
                <CardDescription className="text-red-800/90 dark:text-red-200/80">{err}</CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {!loading && ok ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
                  <CardHeader className="pb-2">
                    <CardDescription>Client ID</CardDescription>
                    <CardTitle className="truncate font-mono text-base">{ok.memory.clientKey || clientKey}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-500 dark:text-slate-400">
                    Dernière mise à jour mémoire : {formatFrDate(ok.memory.updatedAt)}
                  </CardContent>
                </Card>

                <Card className="border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
                  <CardHeader className="pb-2">
                    <CardDescription>État backend RAG</CardDescription>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Brain className="h-5 w-5 text-indigo-500" />
                      {ok.ragBackend}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-500 dark:text-slate-400">
                    Réponse serveur à {formatFrDate(ok.generatedAt)}
                  </CardContent>
                </Card>

                <Card className="border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/95 sm:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardDescription>Score d&apos;apprentissage</CardDescription>
                      <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{learningPercent}%</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={learningPercent} className="h-3 bg-violet-100 dark:bg-violet-950/50" />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Composite dérivé des interactions et du renforcement léger (mode démo).
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5 text-amber-600" />
                      <CardTitle className="text-lg">Préférences de goût</CardTitle>
                    </div>
                    <CardDescription>Poids agrégés sur les tags détectés (lexical).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tasteEntries.length === 0 ? (
                      <p className="text-sm text-slate-500">Aucune préférence enregistrée pour cette clé.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tasteEntries.map(([tag, weight]) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="border border-slate-200/80 bg-slate-50 px-3 py-1 font-normal dark:border-slate-700 dark:bg-slate-800"
                          >
                            <span className="font-medium">{tag}</span>
                            <span className="ml-2 tabular-nums text-slate-500 dark:text-slate-400">{weight.toFixed(2)}</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-cyan-600" />
                      <CardTitle className="text-lg">Corpus RAG</CardTitle>
                    </div>
                    <CardDescription>Chunks indexés pour le retrieval.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
                      {ok.memory.chunks?.length ?? 0}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">segments en mémoire pour cette session</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
                <CardHeader>
                  <CardTitle className="text-lg">Résumés de commandes</CardTitle>
                  <CardDescription>Historique condensé des commandes liées au client.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(ok.memory.orderSummaries ?? []).length === 0 ? (
                    <p className="text-sm text-slate-500">Aucun résumé de commande stocké.</p>
                  ) : (
                    (ok.memory.orderSummaries ?? []).map((line, i) => (
                      <div
                        key={`${i}-${line.slice(0, 12)}`}
                        className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200"
                      >
                        {line}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/90 to-white dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-slate-900/95">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-lg">Réactions positives</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(ok.memory.reactions?.positive ?? []).length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">Aucune trace positive pour l&apos;instant.</p>
                    ) : (
                      (ok.memory.reactions?.positive ?? []).map((r, i) => (
                        <div key={`p-${i}`} className="flex gap-2 rounded-lg border border-emerald-100/80 bg-white/90 px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-slate-950/40">
                          <Smile className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{r}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border-rose-200/60 bg-gradient-to-br from-rose-50/90 to-white dark:border-rose-900/50 dark:from-rose-950/30 dark:to-slate-900/95">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-5 w-5 text-rose-600" />
                      <CardTitle className="text-lg">Réactions négatives</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(ok.memory.reactions?.negative ?? []).length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">Aucune friction enregistrée.</p>
                    ) : (
                      (ok.memory.reactions?.negative ?? []).map((r, i) => (
                        <div key={`n-${i}`} className="flex gap-2 rounded-lg border border-rose-100/80 bg-white/90 px-3 py-2 text-sm dark:border-rose-900/40 dark:bg-slate-950/40">
                          <span className="text-rose-600">−</span>
                          <span>{r}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {isAdmin ? (
                <Collapsible open={techOpen} onOpenChange={setTechOpen}>
                  <div className="flex justify-center pt-2">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Code2 className="h-4 w-4" />
                        Voir détails techniques
                        <ChevronDown className={cn("h-4 w-4 transition-transform", techOpen && "rotate-180")} />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <Card className="mt-4 border-slate-300/80 bg-slate-950 dark:border-slate-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
                          <Code2 className="h-4 w-4" />
                          Payload API (admin uniquement)
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                          Données brutes pour débogage — non affichées par défaut.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <pre className="max-h-[420px] overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-emerald-300">
                          {JSON.stringify(data, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </div>
          ) : null}

          {!loading && !ok && !err && data != null ? (
            <Card className="border-amber-200 bg-amber-50/90 dark:border-amber-900 dark:bg-amber-950/30">
              <CardHeader>
                <CardTitle className="text-amber-900 dark:text-amber-100">Réponse inattendue</CardTitle>
                <CardDescription className="text-amber-800 dark:text-amber-200/90">
                  Le serveur a renvoyé un format non reconnu. Réessayez ou contactez un administrateur système.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {!loading && isAdmin && data && !ok && !err ? (
            <Collapsible open={techOpen} onOpenChange={setTechOpen} className="mt-4">
              <div className="flex justify-center">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Code2 className="h-4 w-4" />
                    Voir détails techniques
                    <ChevronDown className={cn("h-4 w-4 transition-transform", techOpen && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <Card className="mt-4 border-slate-300/80 bg-slate-950 dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      <Code2 className="h-4 w-4" />
                      Payload brut (admin)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-[420px] overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-emerald-300">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
