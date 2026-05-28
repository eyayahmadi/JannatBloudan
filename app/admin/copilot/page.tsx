"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Bot,
  LineChart,
  Sparkles,
  AlertTriangle,
  Eye,
  Tag,
  Send,
  Loader2,
  Truck,
  PackageSearch,
  ClipboardList,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

const TILES: { href: string; label: string; Icon: typeof Sparkles }[] = [
  { href: "/admin/insights", label: "Insights ops", Icon: Sparkles },
  { href: "/admin/reports", label: "Rapports données réelles", Icon: LineChart },
  { href: "/admin/supplier-invoices", label: "Factures · OCR / validation", Icon: Truck },
  { href: "/admin/supplier-intelligence", label: "Synthèse fournisseurs", Icon: PackageSearch },
  { href: "/admin/audit-log", label: "Journal d'audit", Icon: ClipboardList },
  { href: "/admin/ai/anomalies", label: "Anomalies", Icon: AlertTriangle },
  { href: "/admin/ai/forecast", label: "Prévisions", Icon: LineChart },
  { href: "/admin/ai/vision", label: "Vision", Icon: Eye },
  { href: "/admin/ai/pricing", label: "Pricing dynamique", Icon: Tag },
]

export default function AdminCopilotPage() {
  const [prompt, setPrompt] = useState("")
  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState("")

  const send = useCallback(async () => {
    const msg = prompt.trim()
    if (!msg) return
    setLoading(true)
    setReply("")
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          role: "admin",
          sessionId: "",
        }),
      })
      const j = (await res.json()) as { reply?: string; source?: string }
      setReply(typeof j.reply === "string" ? j.reply : JSON.stringify(j, null, 2))
      setSource(typeof j.source === "string" ? j.source : "")
    } catch {
      setReply("Erreur réseau.")
    } finally {
      setLoading(false)
    }
  }, [prompt])

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell className="min-h-screen bg-[color:var(--lux-cream)] dark:bg-neutral-950">
        <SiteHeader hideMainNav backHref="/admin" backLabel="Admin" />
        <div className="site-container max-w-4xl space-y-8 py-8">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Tableau de bord
            </Link>
            <h1 className="flex items-center gap-2 font-display text-3xl font-semibold tracking-tight">
              <Bot className="h-9 w-9 text-[color:var(--lux-gold-deep)]" />
              Copilot admin
            </h1>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Hub ERP + IA : raccourcis vers les modules lourds. Le chat utilise{" "}
              <code className="text-xs">POST /api/chatbot</code> en rôle admin (LLM si une clé OpenAI
              compatible est configurée).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {TILES.map(({ href, label, Icon }) => (
              <Link key={href} href={href}>
                <Card className="transition hover:border-[color:var(--lux-gold)]/40 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                    <Icon className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                    <CardTitle className="text-base">{label}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assistant conversationnel</CardTitle>
              <CardDescription>
                Exemple : « Synthétise les risques stocks et caisse cette semaine » — la réponse s&apos;appuiera sur la
                config LLM ou un message d&apos;orientation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Votre question…"
                className="min-h-[120px]"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" onClick={() => void send()} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Envoyer
                </Button>
                {source ? (
                  <span className="text-xs text-muted-foreground">
                    Source : <strong>{source}</strong>
                  </span>
                ) : null}
              </div>
              {reply ? (
                <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm whitespace-pre-wrap">
                  {reply}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </RequireAuth>
  )
}
