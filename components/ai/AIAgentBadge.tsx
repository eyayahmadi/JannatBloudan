"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Brain, Send, X, Sparkles, Bot, ChefHat, Truck, Wine, Utensils, CircleDollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { SPRING_SOFT } from "@/lib/ui/motion"

export type AgentContext =
  | "admin"
  | "driver"
  | "kitchen"
  | "bar"
  | "shisha"
  | "pos"
  | "server"
  | "menu"
  | "events"

type AgentProfile = {
  label: string
  tagline: string
  icon: typeof Brain
  accentFrom: string
  accentTo: string
  welcome: string
  suggestions: string[]
  knowledge: { keywords: string[]; reply: string }[]
}

const PROFILES: Record<AgentContext, AgentProfile> = {
  admin: {
    label: "Copilote Admin",
    tagline: "Analytics · prédictions · alertes",
    icon: Brain,
    accentFrom: "#c9a24c",
    accentTo: "#6e1d2b",
    welcome:
      "Bonjour ! Je suis votre copilote admin. Demandez-moi les ventes, le stock, les clients ou le personnel.",
    suggestions: ["Ventes du jour ?", "Stock faible ?", "Top clients ?"],
    knowledge: [
      { keywords: ["vente", "revenu", "chiffre"], reply: "Ventes +12% vs semaine dernière. Shawarma poulet = best-seller. Suggestion : promo -15% sur Kebab Halabi en soirée." },
      { keywords: ["stock", "rupture"], reply: "3 alertes : Pistaches (2j), Tahini (4j), Fromage (3j). Commande fournisseur recommandée." },
      { keywords: ["client", "fidelite"], reply: "546 clients actifs · 234 inactifs 7j. Campagne win-back prête à lancer." },
      { keywords: ["reservation", "table"], reply: "32 réservations ce soir · occupation 78%. Ouvrir terrasse dès 19h." },
    ],
  },
  driver: {
    label: "Assistant Livreur",
    tagline: "Itinéraires · ETA · priorités",
    icon: Truck,
    accentFrom: "#5c6b3a",
    accentTo: "#c9a24c",
    welcome:
      "Salut, je suis votre copilote de livraison. Je priorise vos courses et optimise vos trajets.",
    suggestions: ["Prochaine livraison ?", "Optimiser tournée", "Alertes retard"],
    knowledge: [
      { keywords: ["prochaine", "suivant"], reply: "Table #1001 vers 12 rue de la République. 2,3 km · ETA 7 min." },
      { keywords: ["tournee", "itineraire", "optimiser"], reply: "Tournée optimale : #1001 → #1002. Gain estimé : 4 min et 1,1 km." },
      { keywords: ["retard", "delay"], reply: "1 livraison en retard (#1003 · 3 min). Pensez à prévenir le client." },
    ],
  },
  kitchen: {
    label: "Assistant Cuisine",
    tagline: "Préparation · priorités · ruptures",
    icon: ChefHat,
    accentFrom: "#6e1d2b",
    accentTo: "#d9b76a",
    welcome:
      "Bonjour chef ! Je priorise la file et je signale les ruptures d'ingrédients.",
    suggestions: ["Quoi préparer en 1er ?", "Ingrédients manquants ?", "Temps moyen ?"],
    knowledge: [
      { keywords: ["prior", "premier", "1er"], reply: "Table 5 (Pizza Margherita, attente 4 min) puis Table 12 (Shawarma ×2)." },
      { keywords: ["ingredient", "rupture", "manque"], reply: "Rupture imminente : Mozzarella (3 portions). Proposez la Margherita en indispo." },
      { keywords: ["temps", "moyenne"], reply: "Temps moyen cuisine aujourd'hui : 12 min (objectif 15 min)." },
    ],
  },
  bar: {
    label: "Assistant Bar",
    tagline: "Commandes rapides · cocktails",
    icon: Wine,
    accentFrom: "#8e6b1e",
    accentTo: "#c9a24c",
    welcome: "Hello barmaker ! Priorité aux boissons rapides pour ne pas bloquer le service.",
    suggestions: ["File actuelle", "Temps moyen", "Stock boissons"],
    knowledge: [
      { keywords: ["file", "attente"], reply: "4 boissons en file. 2 Coca, 1 Limonade, 1 Mojito. Objectif < 3 min." },
      { keywords: ["temps"], reply: "Temps moyen bar : 2 min 40s. Très bon rythme." },
      { keywords: ["stock", "boisson"], reply: "Stock tonic faible (6 unités). Réappro avant ce soir." },
    ],
  },
  shisha: {
    label: "Assistant Shisha",
    tagline: "Préparation · goûts · charbon",
    icon: Sparkles,
    accentFrom: "#4a0f1c",
    accentTo: "#c9a24c",
    welcome: "Bonsoir, je gère les chichas en parallèle et les changements de charbon.",
    suggestions: ["File shisha", "Goûts populaires", "Alertes charbon"],
    knowledge: [
      { keywords: ["file", "attente"], reply: "3 chichas en cours. Prochaine : Table 7 (Double Apple + Menthe)." },
      { keywords: ["gout", "populaire"], reply: "Top 3 du soir : Double Apple, Menthe, Raisin-Menthe." },
      { keywords: ["charbon"], reply: "Charbons à changer sur Table 5 (15 min écoulées)." },
    ],
  },
  pos: {
    label: "Assistant Caisse",
    tagline: "Paiements · clôture · écarts",
    icon: CircleDollarSign,
    accentFrom: "#c9a24c",
    accentTo: "#5c6b3a",
    welcome: "Bonjour ! Je vous aide sur les encaissements, les écarts et la clôture.",
    suggestions: ["Total journée ?", "Paiements online ?", "Écart caisse ?"],
    knowledge: [
      { keywords: ["total", "journee", "jour"], reply: "CA aujourd'hui : 3 420 € (62% cash · 38% online)." },
      { keywords: ["online", "carte", "stripe"], reply: "Paiements online : 1 300 € · 24 transactions · 0 impayés." },
      { keywords: ["ecart", "difference"], reply: "Aucun écart détecté. Caisse conforme à 100%." },
    ],
  },
  server: {
    label: "Assistant Serveur",
    tagline: "Tables · appels · priorités",
    icon: Bot,
    accentFrom: "#6e1d2b",
    accentTo: "#5c6b3a",
    welcome: "Bonjour ! Je priorise vos tables et signale les appels clients.",
    suggestions: ["Tables en attente", "Appels clients", "Commandes prêtes"],
    knowledge: [
      { keywords: ["attente", "table"], reply: "3 tables en attente de service : 5, 8, 12." },
      { keywords: ["appel", "client"], reply: "Table 9 demande l'addition. Table 12 appelle un serveur." },
      { keywords: ["prete", "pret"], reply: "2 commandes prêtes en cuisine : Tables 3 et 7." },
    ],
  },
  menu: {
    label: "Sommelier IA",
    tagline: "Recommandations · accords",
    icon: Utensils,
    accentFrom: "#5c6b3a",
    accentTo: "#c9a24c",
    welcome: "Je vous aide à composer le repas idéal. Dites-moi vos goûts !",
    suggestions: ["Suggestions pour 2", "Plat végétarien", "Accord chicha"],
    knowledge: [
      { keywords: ["vegetarien", "veggie"], reply: "Je recommande Mezzé complet + Fattoush + Manakish Zaatar." },
      { keywords: ["couple", "2", "deux"], reply: "Formule duo : Mezzé assortis + Kebab mixte + Baklava à partager." },
      { keywords: ["chicha", "shisha"], reply: "Double Apple s'accorde à merveille avec un thé à la menthe et des baklavas." },
    ],
  },
  events: {
    label: "Assistant Événements",
    tagline: "Capacité · devis · tickets",
    icon: Sparkles,
    accentFrom: "#6e1d2b",
    accentTo: "#d9b76a",
    welcome: "Bonjour ! Je vous aide à organiser mariage, brunch, karaoke ou soirée privée.",
    suggestions: ["Capacité max ?", "Devis mariage", "Tickets soirée"],
    knowledge: [
      { keywords: ["capacite", "max"], reply: "Salle principale : 80 pax · terrasse : 40 pax · privatisation totale : 120." },
      { keywords: ["devis", "mariage"], reply: "Forfait mariage dès 75 €/pax (menu 4 services + 1 boisson + décoration)." },
      { keywords: ["ticket", "billet", "scan"], reply: "Génération QR ticket automatique + scan à l'entrée via /events/scan." },
    ],
  },
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

type Message = { id: string; role: "user" | "assistant"; text: string }

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

type AIAgentBadgeProps = {
  context: AgentContext
  /** Position du badge (default bottom-right) */
  position?: "bottom-right" | "bottom-left"
}

export function AIAgentBadge({
  context,
  position = "bottom-right",
}: AIAgentBadgeProps) {
  const profile = PROFILES[context]
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: makeId(), role: "assistant", text: profile.welcome },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  const findReply = (text: string): string => {
    const n = normalize(text)
    for (const entry of profile.knowledge) {
      if (entry.keywords.some((k) => n.includes(k))) return entry.reply
    }
    return `Je suis ${profile.label}. ${profile.tagline}. Essayez : "${profile.suggestions[0]}".`
  }

  const send = (payload?: string) => {
    const text = (payload ?? input).trim()
    if (!text) return
    setInput("")
    setMessages((p) => [...p, { id: makeId(), role: "user", text }])
    setTimeout(() => {
      setMessages((p) => [...p, { id: makeId(), role: "assistant", text: findReply(text) }])
    }, 500)
  }

  const Icon = profile.icon
  const posClasses =
    position === "bottom-left"
      ? "bottom-6 left-6"
      : "bottom-6 right-6 rtl:left-6 rtl:right-auto"
  const panelPosClasses =
    position === "bottom-left"
      ? "bottom-24 left-6"
      : "bottom-24 right-6 rtl:left-6 rtl:right-auto"

  return (
    <>
      {/* Floating badge */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed z-[70] flex h-16 w-16 items-center justify-center rounded-full text-white shadow-xl",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40",
          posClasses,
        )}
        style={{
          background: `linear-gradient(135deg, ${profile.accentFrom}, ${profile.accentTo})`,
          boxShadow: `0 18px 40px -12px ${profile.accentFrom}99`,
        }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING_SOFT}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label={`Ouvrir ${profile.label}`}
      >
        {/* Aurora ring behind */}
        <span className="aurora-ring" aria-hidden />
        {/* Online dot */}
        <motion.span
          className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white"
          style={{ background: "#22c55e" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="icon"
              className="breathe"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className="h-7 w-7" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={SPRING_SOFT}
            className={cn(
              "fixed z-[70] flex h-[520px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border shadow-2xl",
              "border-[color-mix(in_srgb,var(--lux-gold)_40%,transparent)]",
              "bg-[color-mix(in_srgb,var(--lux-cream)_98%,transparent)]",
              "dark:bg-[color-mix(in_srgb,var(--lux-ink)_95%,transparent)]",
              panelPosClasses,
            )}
            style={{
              boxShadow:
                "0 30px 80px -30px rgba(26, 20, 16, 0.55), 0 10px 30px -10px rgba(201, 162, 76, 0.25)",
            }}
          >
            {/* Header */}
            <div
              className="relative flex items-center gap-3 px-4 py-3 text-white"
              style={{
                background: `linear-gradient(135deg, ${profile.accentFrom}, ${profile.accentTo})`,
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-semibold tracking-tight">
                  {profile.label}
                </p>
                <p className="truncate text-[11px] opacity-90">{profile.tagline}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition hover:bg-white/15"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-md bg-[var(--lux-bordeaux)] text-white"
                        : "rounded-bl-md border border-[color-mix(in_srgb,var(--lux-gold)_30%,transparent)] bg-white/90 text-[var(--lux-ink)] dark:bg-white/5 dark:text-amber-50",
                    )}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 border-t border-amber-900/10 bg-amber-50/60 px-3 py-2 dark:border-amber-200/10 dark:bg-amber-950/20">
                {profile.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-amber-900/15 bg-white px-3 py-1 text-xs font-medium text-amber-950 transition hover:border-amber-900/40 hover:bg-amber-100 dark:border-amber-200/20 dark:bg-white/5 dark:text-amber-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex items-center gap-2 border-t border-amber-900/10 bg-white/80 p-3 dark:border-amber-200/10 dark:bg-white/5"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez une question…"
                className="flex-1 rounded-xl border border-amber-900/15 bg-white px-3 py-2 text-sm outline-none placeholder:text-amber-900/40 focus:border-amber-500 focus:ring-1 focus:ring-amber-400/40 dark:border-amber-200/15 dark:bg-white/5 dark:text-amber-50"
              />
              <motion.button
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.05 }}
                type="submit"
                disabled={!input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md transition disabled:opacity-40"
                style={{
                  background: `linear-gradient(135deg, ${profile.accentFrom}, ${profile.accentTo})`,
                }}
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
