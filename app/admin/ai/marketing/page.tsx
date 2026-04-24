"use client"

import { useState, useEffect } from "react"
import { Mail, MessageSquare, Bell, Send, Plus, Users, Target, Megaphone } from "lucide-react"
import { toast } from "sonner"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

type Campaign = {
  id: string
  name: string
  targetSegment: string
  message: string
  channel: "sms" | "email" | "push"
  discount: number
  timing: string
  estimatedReach: number
  estimatedRevenue: number
  status: "draft" | "scheduled" | "sent"
}

type Segment = {
  name: string
  count: number
  description: string
}

type MarketingData = {
  campaigns: Campaign[]
  segments: Segment[]
  summary: { totalSegments: number; totalReachable: number; activeCampaigns: number }
}

const SEGMENT_COLORS = [
  "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700",
  "bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700",
  "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700",
  "bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700",
  "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700",
]

const CHANNEL_ICON: Record<string, typeof Mail> = { email: Mail, sms: MessageSquare, push: Bell }

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  sent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
}

const PAST_CAMPAIGNS = [
  { name: "Promo ete -25%", segment: "Tous", sent: "2024-07-01", reach: 412, revenue: 3290, conversions: 87 },
  { name: "Fidelite VIP", segment: "Clients fideles", sent: "2024-08-15", reach: 134, revenue: 1870, conversions: 56 },
  { name: "Lancement pizza orientale", segment: "Fans desserts", sent: "2024-09-20", reach: 98, revenue: 1240, conversions: 43 },
]

export default function MarketingPage() {
  const [data, setData] = useState<MarketingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const [newSegment, setNewSegment] = useState("")
  const [newChannel, setNewChannel] = useState<"email" | "sms" | "push">("email")
  const [newMessage, setNewMessage] = useState("")

  useEffect(() => {
    fetch("/api/ai/marketing")
      .then((r) => r.json())
      .then((d: MarketingData) => {
        setData(d)
        setCampaigns(d.campaigns)
      })
      .catch(() => toast.error("Erreur chargement marketing"))
      .finally(() => setLoading(false))
  }, [])

  function handleLaunch(id: string) {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "sent" as const } : c)),
    )
    toast.success("Campagne lancee avec succes !")
  }

  function handleCreate() {
    if (!newSegment || !newMessage.trim()) {
      toast.error("Veuillez remplir tous les champs")
      return
    }
    const id = `CMP-${String(Date.now()).slice(-5)}`
    const created: Campaign = {
      id,
      name: `Campagne ${id}`,
      targetSegment: newSegment,
      message: newMessage,
      channel: newChannel,
      discount: 0,
      timing: "Immediat",
      estimatedReach: Math.round(Math.random() * 200 + 50),
      estimatedRevenue: Math.round(Math.random() * 2000 + 500),
      status: "draft",
    }
    setCampaigns((prev) => [...prev, created])
    setNewMessage("")
    toast.success("Campagne creee !")
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PageShell>
        <SiteHeader backHref="/admin/ai" />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-100 sm:text-3xl">
            Agent Marketing IA
          </h1>
          <p className="mt-1 text-sm text-amber-800/70 dark:text-amber-300/70">
            Segmentation, campagnes automatisees et ciblage intelligent
          </p>

          {loading ? (
            <div className="mt-12 text-center text-amber-700 dark:text-amber-400">Chargement...</div>
          ) : data ? (
            <div className="mt-8 space-y-10">
              {/* Summary cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Segments", value: data.summary.totalSegments, icon: Target },
                  { label: "Clients atteignables", value: data.summary.totalReachable, icon: Users },
                  { label: "Campagnes actives", value: data.summary.activeCampaigns, icon: Megaphone },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-4 rounded-2xl border border-amber-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-950 dark:text-amber-100">{s.value}</p>
                      <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Segments */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Segments clients</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.segments.map((seg, i) => (
                    <div
                      key={seg.name}
                      className={`rounded-xl border p-4 ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`}
                    >
                      <div className="flex items-baseline justify-between">
                        <h3 className="font-semibold text-amber-950 dark:text-amber-100">{seg.name}</h3>
                        <span className="text-lg font-bold text-amber-800 dark:text-amber-300">{seg.count}</span>
                      </div>
                      <p className="mt-1 text-xs text-amber-800/70 dark:text-amber-400/60">{seg.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Campaigns */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Campagnes</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {campaigns.map((c) => {
                    const Icon = CHANNEL_ICON[c.channel] ?? Bell
                    return (
                      <div
                        key={c.id}
                        className="flex flex-col rounded-2xl border border-amber-200/60 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-100">{c.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[c.status]}`}>
                            {c.status}
                          </span>
                        </div>
                        <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          <Target className="h-3 w-3" /> {c.targetSegment}
                        </span>
                        <p className="mb-3 line-clamp-2 text-xs text-amber-800/80 dark:text-amber-300/80">{c.message}</p>
                        <div className="mb-3 flex items-center gap-3 text-xs text-amber-700/70 dark:text-amber-400/60">
                          <Icon className="h-3.5 w-3.5" />
                          {c.discount > 0 && <span className="font-semibold text-orange-600 dark:text-orange-400">-{c.discount}%</span>}
                          <span>{c.estimatedReach} cibles</span>
                          <span>{c.estimatedRevenue} EUR</span>
                        </div>
                        {c.status === "draft" && (
                          <button
                            onClick={() => handleLaunch(c.id)}
                            className="mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:shadow-md active:scale-[0.98]"
                          >
                            <Send className="h-3.5 w-3.5" /> Lancer
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Create campaign */}
              <section className="rounded-2xl border border-amber-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-amber-950/30">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-950 dark:text-amber-100">
                  <Plus className="h-5 w-5 text-orange-600" /> Generer nouvelle campagne
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <select
                    value={newSegment}
                    onChange={(e) => setNewSegment(e.target.value)}
                    className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950 outline-none focus:ring-2 focus:ring-amber-500 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100"
                  >
                    <option value="">Segment...</option>
                    {data.segments.map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as "email" | "sms" | "push")}
                    className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950 outline-none focus:ring-2 focus:ring-amber-500 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push</option>
                  </select>
                  <button
                    onClick={handleCreate}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:shadow-md active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" /> Creer
                  </button>
                </div>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Redigez votre message..."
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950 outline-none focus:ring-2 focus:ring-amber-500 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100"
                />
              </section>

              {/* History */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-amber-950 dark:text-amber-100">Historique des campagnes</h2>
                <div className="overflow-hidden rounded-2xl border border-amber-200/60 dark:border-amber-800/40">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-amber-50/80 text-xs font-semibold uppercase text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                      <tr>
                        <th className="px-4 py-3">Campagne</th>
                        <th className="px-4 py-3">Segment</th>
                        <th className="px-4 py-3">Envoyee</th>
                        <th className="px-4 py-3 text-right">Portee</th>
                        <th className="px-4 py-3 text-right">Revenu</th>
                        <th className="px-4 py-3 text-right">Conversions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 dark:divide-amber-800/30">
                      {PAST_CAMPAIGNS.map((pc) => (
                        <tr key={pc.name} className="bg-white/60 dark:bg-amber-950/20">
                          <td className="px-4 py-3 font-medium text-amber-950 dark:text-amber-100">{pc.name}</td>
                          <td className="px-4 py-3 text-amber-700 dark:text-amber-400">{pc.segment}</td>
                          <td className="px-4 py-3 text-amber-700 dark:text-amber-400">{pc.sent}</td>
                          <td className="px-4 py-3 text-right text-amber-700 dark:text-amber-400">{pc.reach}</td>
                          <td className="px-4 py-3 text-right font-semibold text-amber-800 dark:text-amber-300">{pc.revenue} EUR</td>
                          <td className="px-4 py-3 text-right text-amber-700 dark:text-amber-400">{pc.conversions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
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
