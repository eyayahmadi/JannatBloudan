"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import {
  Bot,
  CalendarDays,
  ChevronDown,
  Gift,
  Loader2,
  Package,
  SendHorizontal,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  buildConciergeInsights,
  filterOrdersByEmail,
  filterReservationsByEmail,
  type ConciergeInsight,
  type ConciergeOrderRow,
  type ConciergeContextInput,
} from "@/lib/account/concierge-insights"
import type { AccountDashboardNavigateId } from "@/lib/account/dashboard-nav"

type Favorite = { name: string; orders: number; image: string }

type Promo = { title: string; subtitle: string; code: string | null }

type Props = {
  firstName: string
  isLoggedIn: boolean
  userEmail: string
  loyaltyPoints: number
  favorites: Favorite[]
  onNavigate: (id: AccountDashboardNavigateId) => void
  promos: Promo[]
  fallbackOrderLabels: string[]
  fallbackReservationDate?: string | null
  fallbackEventTitle?: string | null
}

type ChatLine = { role: "assistant" | "user"; text: string }

const QUICK_ACTIONS: { label: string; nav: AccountDashboardNavigateId }[] = [
  { label: "Commander", nav: "order" },
  { label: "Réserver une table", nav: "reserve-table" },
  { label: "Voir le menu", nav: "menu" },
  { label: "Mes commandes", nav: "orders" },
  { label: "Événements", nav: "reserve-event" },
  { label: "Fidélité", nav: "loyalty" },
]

function categoryIcon(cat: ConciergeInsight["category"]) {
  switch (cat) {
    case "orders":
      return Package
    case "loyalty":
      return Gift
    case "promo":
      return Sparkles
    case "reservation":
      return CalendarDays
    case "event":
      return Sparkles
    case "weather":
      return UtensilsCrossed
    case "time":
      return UtensilsCrossed
    case "pairing":
      return UtensilsCrossed
    default:
      return Sparkles
  }
}

export function AccountAIConcierge({
  firstName,
  isLoggedIn,
  userEmail,
  loyaltyPoints,
  favorites,
  onNavigate,
  promos,
  fallbackOrderLabels,
  fallbackReservationDate,
  fallbackEventTitle,
}: Props) {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState<ChatLine[]>([])
  const [apiOrders, setApiOrders] = useState<ConciergeOrderRow[]>([])
  const [apiReservations, setApiReservations] = useState<ConciergeContextInput["reservations"]>([])
  const [apiEvents, setApiEvents] = useState<ConciergeContextInput["events"]>([])
  const [weatherTempC, setWeatherTempC] = useState<number | null>(null)
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "done">("idle")
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const anonSidRef = useRef<string | null>(null)

  const getConciergeSessionId = useCallback(() => {
    const em = userEmail.trim()
    if (em) return `portal:${em.toLowerCase()}`
    if (typeof window === "undefined") return "anonymous"
    if (!anonSidRef.current) {
      let s = sessionStorage.getItem("bloudan-concierge-sid")
      if (!s) {
        s = `anon:${crypto.randomUUID()}`
        sessionStorage.setItem("bloudan-concierge-sid", s)
      }
      anonSidRef.current = s
    }
    return anonSidRef.current
  }, [userEmail])

  useEffect(() => {
    let cancelled = false
    async function loadWeather() {
      try {
        const w = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&current_weather=true",
        ).then((r) => r.json())
        if (!cancelled && typeof w?.current_weather?.temperature === "number") {
          setWeatherTempC(w.current_weather.temperature)
        }
      } catch {
        if (!cancelled) setWeatherTempC(null)
      }
    }
    void loadWeather()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadAccountData() {
      if (!isLoggedIn || !userEmail) {
        setApiOrders([])
        setApiReservations([])
        setApiEvents([])
        setFetchState("idle")
        return
      }
      setFetchState("loading")
      try {
        const [oRes, rRes, eRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/reservations"),
          fetch("/api/events"),
        ])
        const oJson = oRes.ok ? await oRes.json().catch(() => ({})) : {}
        const rJson = rRes.ok ? await rRes.json().catch(() => ({})) : {}
        const eJson = eRes.ok ? await eRes.json().catch(() => ({})) : {}
        if (cancelled) return
        const ordersRaw = Array.isArray(oJson?.orders) ? oJson.orders : []
        const resRaw = Array.isArray(rJson?.reservations) ? rJson.reservations : []
        const eventsRaw = Array.isArray(eJson?.events) ? eJson.events : []
        const mine = filterOrdersByEmail(ordersRaw, userEmail)
        mine.sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0
          return tb - ta
        })
        setApiOrders(mine)
        setApiReservations(filterReservationsByEmail(resRaw, userEmail))
        setApiEvents(eventsRaw)
      } catch {
        if (!cancelled) {
          setApiOrders([])
          setApiReservations([])
          setApiEvents([])
        }
      } finally {
        if (!cancelled) setFetchState("done")
      }
    }
    void loadAccountData()
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, userEmail])

  const insights = useMemo(
    () =>
      buildConciergeInsights({
        firstName,
        isLoggedIn,
        loyaltyPoints,
        favorites,
        orders: apiOrders,
        reservations: apiReservations,
        events: apiEvents,
        promos,
        fallbackOrderLabels,
        fallbackReservationDate: fallbackReservationDate ?? undefined,
        fallbackEventTitle: fallbackEventTitle ?? undefined,
        weatherTempC,
      }),
    [
      firstName,
      isLoggedIn,
      loyaltyPoints,
      favorites,
      apiOrders,
      apiReservations,
      apiEvents,
      promos,
      fallbackOrderLabels,
      fallbackReservationDate,
      fallbackEventTitle,
      weatherTempC,
    ],
  )

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    const salut = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"
    return `${salut} ${firstName} — que souhaitez-vous faire aujourd’hui ?`
  }, [firstName])

  useEffect(() => {
    if (!open) return
    setLines([{ role: "assistant", text: greeting }])
  }, [open, greeting])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [open, lines])

  const handleInsightCta = useCallback(
    (ins: ConciergeInsight) => {
      setLines((prev) => [
        ...prev,
        { role: "user", text: ins.title },
        { role: "assistant", text: `Très bien — ${ins.cta.toLowerCase()}.` },
      ])
      if (ins.href) return
      if (ins.nav) onNavigate(ins.nav)
    },
    [onNavigate],
  )

  const quickReply = useCallback(
    (label: string, nav: AccountDashboardNavigateId) => {
      setLines((prev) => [
        ...prev,
        { role: "user", text: label },
        { role: "assistant", text: "C’est noté — j’ouvre cette section pour vous." },
      ])
      onNavigate(nav)
      setOpen(false)
    },
    [onNavigate],
  )

  const sendUserMessage = useCallback(async () => {
    const text = draft.trim()
    if (!text || sending) return
    setDraft("")
    setLines((prev) => [...prev, { role: "user", text }])
    setSending(true)
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          role: "client",
          sessionId: getConciergeSessionId(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string }
      if (!res.ok) {
        throw new Error(data.error || "Erreur réseau")
      }
      const reply =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : "Je n’ai pas pu formuler une réponse. Reformulez ou utilisez un raccourci ci-dessous."

      setLines((prev) => [...prev, { role: "assistant", text: reply }])

      const t = text.toLowerCase()
      if (/\b(mes commandes|historique|suivi de commande)\b/i.test(text)) {
        onNavigate("orders")
        setLines((prev) => [
          ...prev,
          { role: "assistant", text: "J’ai ouvert l’onglet « Mes commandes » dans votre espace client." },
        ])
      } else if (/\b(r[ée]server|r[ée]servation|une table)\b/i.test(t) && /\btable\b/i.test(text)) {
        onNavigate("reserve-table")
        setLines((prev) => [
          ...prev,
          { role: "assistant", text: "Section « Réserver une table » ouverte — complétez vos infos pour confirmer." },
        ])
      } else if (/\b([ée]v[ée]nement|soir[ée]e|billet|ticket)\b/i.test(t)) {
        onNavigate("reserve-event")
        setLines((prev) => [
          ...prev,
          { role: "assistant", text: "Voici les événements — choisissez une date et réservez vos places." },
        ])
      } else if (/\b(menu|carte|plat)\b/i.test(t) && /\b(voir|montre|où|ou|affiche)\b/i.test(t)) {
        onNavigate("menu")
        setLines((prev) => [
          ...prev,
          { role: "assistant", text: "Le menu s’affiche dans la section dédiée de votre compte." },
        ])
      } else if (/\b(commander|commande|panier|livraison)\b/i.test(t)) {
        onNavigate("order")
        setLines((prev) => [
          ...prev,
          { role: "assistant", text: "Espace commande ouvert — ajoutez vos plats au panier." },
        ])
      } else if (/\b(fid[ée]lit[ée]|points)\b/i.test(t)) {
        onNavigate("loyalty")
        setLines((prev) => [
          ...prev,
          { role: "assistant", text: "Votre programme fidélité est dans l’onglet correspondant." },
        ])
      }
    } catch {
      setLines((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Désolé, l’assistant n’a pas répondu. Vérifiez votre connexion ou réessayez dans un instant.",
        },
      ])
    } finally {
      setSending(false)
    }
  }, [draft, sending, getConciergeSessionId, onNavigate])

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex flex-col items-end sm:bottom-8 sm:right-8">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            id="ai-concierge-panel"
            className="pointer-events-auto mb-3 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-[color:var(--lux-gold)]/35 bg-gradient-to-b from-white via-[color:var(--lux-cream)]/40 to-white/95 shadow-[0_24px_60px_-20px_rgba(110,29,43,0.45)] backdrop-blur-md sm:w-[min(100vw-3rem,26rem)]"
            role="dialog"
            aria-label="Assistant Jannat"
          >
            <div
              className="relative px-4 py-3 text-white"
              style={{
                background: "linear-gradient(125deg, var(--lux-bordeaux) 0%, #3d1520 55%, var(--lux-bordeaux-dark) 100%)",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[color:var(--lux-gold)]/25 blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-amber-200/20 blur-xl"
              />
              <div className="relative flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 shadow-inner ring-2 ring-[color:var(--lux-gold)]/40">
                    <Bot className="h-6 w-6 text-[color:var(--lux-gold-bright)]" strokeWidth={1.75} />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--lux-gold)] text-[10px] shadow">
                      <Sparkles className="h-2.5 w-2.5 text-[color:var(--lux-ink)]" />
                    </span>
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold leading-tight">Concierge IA</p>
                    <p className="text-[11px] text-amber-100/85">
                      Conseils selon vos habitudes
                      {fetchState === "loading" ? " · synchronisation…" : isLoggedIn && apiOrders.length > 0 ? " · données compte" : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/60"
                  aria-label="Fermer l’assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={listRef}
              className="max-h-[13rem] space-y-2 overflow-y-auto px-3 py-3 text-sm scrollbar-thin"
            >
              {lines.map((line, i) => (
                <div
                  key={`${line.role}-${i}`}
                  className={cn(
                    "flex",
                    line.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[92%] rounded-2xl px-3 py-2 text-[13px] leading-snug shadow-sm",
                      line.role === "user"
                        ? "bg-[color:var(--lux-bordeaux)]/12 font-medium text-amber-950"
                        : "border border-amber-900/10 bg-white/90 text-amber-900/90",
                    )}
                  >
                    {line.text}
                  </div>
                </div>
              ))}
              {sending ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-amber-900/10 bg-white/90 px-3 py-2 text-[13px] text-amber-900/70">
                    <Loader2 className="h-4 w-4 animate-spin text-[color:var(--lux-bordeaux)]" />
                    L’agent réfléchit…
                  </div>
                </div>
              ) : null}
            </div>

            <form
              className="border-t border-amber-900/10 bg-white/60 px-3 py-2.5"
              onSubmit={(e) => {
                e.preventDefault()
                void sendUserMessage()
              }}
            >
              <label htmlFor="concierge-chat-input" className="sr-only">
                Écrire un message au concierge
              </label>
              <div className="flex gap-2">
                <textarea
                  id="concierge-chat-input"
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      void sendUserMessage()
                    }
                  }}
                  placeholder="Posez votre question… (Entrée pour envoyer)"
                  disabled={sending}
                  className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-amber-900/12 bg-white/95 px-3 py-2 text-[13px] text-amber-950 placeholder:text-amber-900/40 focus:border-[color:var(--lux-gold)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--lux-gold)]/25 disabled:opacity-60"
                />
                <Button
                  type="submit"
                  variant="gold"
                  size="icon"
                  disabled={sending || !draft.trim()}
                  className="h-11 w-11 shrink-0 rounded-xl"
                  aria-label="Envoyer le message"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-5 w-5" strokeWidth={1.75} />
                  )}
                </Button>
              </div>
              <p className="mt-1.5 text-[10px] text-amber-900/45">Maj+Entrée pour une nouvelle ligne.</p>
            </form>

            <div className="border-t border-amber-900/10 px-3 py-2">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900/45">Raccourcis</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((q) => (
                  <button
                    key={q.nav + q.label}
                    type="button"
                    onClick={() => quickReply(q.label, q.nav)}
                    className="rounded-full border border-amber-900/12 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-amber-950 shadow-sm transition hover:border-[color:var(--lux-gold)]/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[14rem] overflow-y-auto border-t border-amber-900/10 bg-gradient-to-b from-white/50 to-[color:var(--lux-cream)]/30 px-3 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900/50">
                <Sparkles className="h-3.5 w-3.5 text-[color:var(--lux-gold)]" />
                Pour vous maintenant
              </p>
              <ul className="space-y-2">
                {insights.map((ins) => {
                  const Icon = categoryIcon(ins.category)
                  const content = (
                    <>
                      <div className="flex gap-2">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--lux-bordeaux)]/10 text-[color:var(--lux-bordeaux)]">
                          <Icon className="h-4 w-4" strokeWidth={1.6} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-display text-[13px] font-semibold leading-snug text-amber-950">{ins.title}</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-900/70">{ins.body}</p>
                        </div>
                      </div>
                      {ins.href ? (
                        <Button
                          asChild
                          size="sm"
                          variant="gold"
                          className="mt-2 h-8 w-full rounded-full text-xs"
                        >
                          <Link href={ins.href}>{ins.cta}</Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="gold"
                          className="mt-2 h-8 w-full rounded-full text-xs"
                          onClick={() => handleInsightCta(ins)}
                        >
                          {ins.cta}
                        </Button>
                      )}
                    </>
                  )
                  return (
                    <motion.li
                      key={ins.id}
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 }}
                      className="rounded-xl border border-amber-900/8 bg-white/85 p-2.5 shadow-sm"
                    >
                      {content}
                    </motion.li>
                  )
                })}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        layout
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? "ai-concierge-panel" : undefined}
        aria-label={open ? "Fermer le concierge IA" : "Ouvrir le concierge IA"}
        className={cn(
          "pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full shadow-[0_12px_40px_-8px_rgba(110,29,43,0.55)] ring-4 ring-white/90 transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--lux-gold)]/50",
        )}
        style={{
          background: "linear-gradient(145deg, var(--lux-bordeaux) 0%, #4a1a28 50%, var(--lux-bordeaux-dark) 100%)",
        }}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full bg-[color:var(--lux-gold)]/35 blur-md transition-opacity duration-500",
            open ? "opacity-40" : "animate-pulse opacity-70",
          )}
        />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
          {open ? (
            <ChevronDown className="h-6 w-6 text-[color:var(--lux-gold-bright)]" strokeWidth={2} />
          ) : (
            <Bot className="h-6 w-6 text-[color:var(--lux-gold-bright)]" strokeWidth={1.75} />
          )}
        </span>
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--lux-gold)] shadow-md">
          <Sparkles className="h-3 w-3 text-[color:var(--lux-ink)]" strokeWidth={2} />
        </span>
      </motion.button>
    </div>
  )
}
