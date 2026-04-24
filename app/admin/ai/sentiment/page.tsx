"use client"

import { useState, useEffect } from "react"
import { SmilePlus, Meh, Frown, Search, Utensils, ConciergeBell, Music, Banknote } from "lucide-react"
import { toast } from "sonner"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

type Review = {
  id: number
  text: string
  date: string
  author: string
  score: number
  label: "positive" | "neutral" | "negative"
  topicScores: Record<string, number>
}

type SentimentData = {
  reviews: Review[]
  overall: { avgScore: number; positive: number; negative: number; neutral: number; total: number }
  topics: Record<string, number>
  wordCloud: { word: string; count: number }[]
  suggestions: string[]
}

const SENTIMENT_STYLE: Record<string, { bg: string; text: string; icon: typeof SmilePlus }> = {
  positive: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", icon: SmilePlus },
  neutral: { bg: "bg-gray-100 dark:bg-gray-800/50", text: "text-gray-600 dark:text-gray-400", icon: Meh },
  negative: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", icon: Frown },
}

const TOPIC_META: Record<string, { label: string; icon: typeof Utensils; color: string }> = {
  food: { label: "Nourriture", icon: Utensils, color: "text-amber-600 dark:text-amber-400" },
  service: { label: "Service", icon: ConciergeBell, color: "text-blue-600 dark:text-blue-400" },
  ambiance: { label: "Ambiance", icon: Music, color: "text-purple-600 dark:text-purple-400" },
  price: { label: "Prix", icon: Banknote, color: "text-emerald-600 dark:text-emerald-400" },
}

export default function SentimentPage() {
  const [data, setData] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzeText, setAnalyzeText] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [inlineResult, setInlineResult] = useState<{ score: number; label: string } | null>(null)

  useEffect(() => {
    fetch("/api/ai/sentiment")
      .then((r) => r.json())
      .then((d: SentimentData) => setData(d))
      .catch(() => toast.error("Erreur chargement sentiment"))
      .finally(() => setLoading(false))
  }, [])

  async function handleAnalyze() {
    if (!analyzeText.trim()) return
    setAnalyzing(true)
    setInlineResult(null)
    try {
      const res = await fetch("/api/ai/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: analyzeText }),
      })
      const result = await res.json()
      setInlineResult({ score: result.score, label: result.label })
    } catch {
      toast.error("Erreur analyse")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin/ai" />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-100 sm:text-3xl">
            Analyse de Sentiment IA
          </h1>
          <p className="mt-1 text-sm text-amber-800/70 dark:text-amber-300/70">
            Analyse automatique des avis clients et tendances
          </p>

          {loading ? (
            <div className="mt-12 text-center text-amber-700 dark:text-amber-400">Chargement...</div>
          ) : data ? (
            <div className="mt-8 space-y-10">
              {/* Overall gauge + avg score */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70">
                    Repartition du sentiment
                  </h2>
                  <div className="flex h-6 overflow-hidden rounded-full">
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${(data.overall.positive / data.overall.total) * 100}%` }}
                    />
                    <div
                      className="bg-gray-400 transition-all"
                      style={{ width: `${(data.overall.neutral / data.overall.total) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${(data.overall.negative / data.overall.total) * 100}%` }}
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-xs font-medium">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Positif {Math.round((data.overall.positive / data.overall.total) * 100)}%
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Neutre {Math.round((data.overall.neutral / data.overall.total) * 100)}%
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      Negatif {Math.round((data.overall.negative / data.overall.total) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-amber-950 dark:text-amber-100">{data.overall.avgScore}</p>
                    <p className="mt-1 text-sm font-medium text-amber-700/70 dark:text-amber-400/70">Score moyen</p>
                    <p className="mt-0.5 text-xs text-amber-600/50 dark:text-amber-500/50">{data.overall.total} avis analyses</p>
                  </div>
                </div>
              </div>

              {/* Topic breakdown */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Sujets mentionnes</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(TOPIC_META).map(([key, meta]) => {
                    const count = data.topics[key] ?? 0
                    const max = Math.max(...Object.values(data.topics), 1)
                    return (
                      <div
                        key={key}
                        className="rounded-2xl border border-amber-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                      >
                        <div className="flex items-center gap-2">
                          <meta.icon className={`h-5 w-5 ${meta.color}`} />
                          <span className="text-sm font-semibold text-amber-950 dark:text-amber-100">{meta.label}</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-100">{count}</p>
                        <p className="text-xs text-amber-700/60 dark:text-amber-400/60">mentions</p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-900/40">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Word cloud */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Nuage de mots</h2>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {data.wordCloud.map(({ word, count }) => {
                    const maxCount = Math.max(...data.wordCloud.map((w) => w.count), 1)
                    const size = 12 + ((count / maxCount) * 20)
                    return (
                      <span
                        key={word}
                        className="font-medium text-amber-800 transition hover:text-orange-600 dark:text-amber-300 dark:hover:text-orange-400"
                        style={{ fontSize: `${size}px` }}
                      >
                        {word}
                      </span>
                    )
                  })}
                </div>
              </section>

              {/* Recent reviews */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Avis recents</h2>
                <div className="space-y-3">
                  {data.reviews.map((r) => {
                    const style = SENTIMENT_STYLE[r.label]
                    const Icon = style.icon
                    return (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-amber-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-semibold text-amber-950 dark:text-amber-100">{r.author}</span>
                          <span className="text-xs text-amber-700/60 dark:text-amber-400/60">{r.date}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}>
                            <Icon className="h-3 w-3" /> {r.label}
                          </span>
                          <span className="ml-auto text-xs font-bold text-amber-800 dark:text-amber-300">
                            Score: {r.score}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-amber-800/80 dark:text-amber-300/80">{r.text}</p>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Analyze form */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <Search className="h-5 w-5 text-orange-600" /> Analyser un texte
                </h2>
                <textarea
                  value={analyzeText}
                  onChange={(e) => setAnalyzeText(e.target.value)}
                  placeholder="Collez un avis ou ecrivez un texte a analyser..."
                  rows={3}
                  className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950 outline-none focus:ring-2 focus:ring-amber-500 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="mt-3 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  <Search className="h-4 w-4" /> {analyzing ? "Analyse..." : "Analyser"}
                </button>
                {inlineResult && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/40">
                    {(() => {
                      const s = SENTIMENT_STYLE[inlineResult.label] ?? SENTIMENT_STYLE.neutral
                      const Icon = s.icon
                      return (
                        <>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
                            <Icon className="h-3.5 w-3.5" /> {inlineResult.label}
                          </span>
                          <span className="text-sm font-bold text-amber-950 dark:text-amber-100">
                            Score: {inlineResult.score}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                )}
              </section>

              {/* Suggestions */}
              {data.suggestions.length > 0 && (
                <section>
                  <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Suggestions IA</h2>
                  <ul className="space-y-2">
                    {data.suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-white/70 p-4 text-sm text-amber-800 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300"
                      >
                        <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-amber-500 to-orange-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ) : (
            <div className="mt-12 text-center text-red-600">Erreur de chargement</div>
          )}
        </main>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
