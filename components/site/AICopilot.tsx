"use client"

import { useRef, useEffect, useState } from "react"
import { Brain, Send, X, Sparkles } from "lucide-react"

type Message = {
  id: string
  role: "user" | "assistant"
  text: string
}

const KNOWLEDGE: { keywords: string[]; reply: string }[] = [
  {
    keywords: ["vente", "ventes", "revenu", "revenus", "chiffre"],
    reply: "Vos ventes cette semaine sont en hausse de 12%. Le plat le plus vendu est le Shawarma Poulet. Suggestion: promouvoir le Kebab Halabi en soiree.",
  },
  {
    keywords: ["stock", "inventaire", "rupture"],
    reply: "3 produits en alerte: Pistaches (2 jours), Tahini (4 jours), Fromage (3 jours). Voulez-vous que je genere une commande fournisseur?",
  },
  {
    keywords: ["personnel", "staff", "employe", "employes", "equipe", "rh"],
    reply: "8 employes actifs. Performance moyenne: 87%. Suggestion: renforcer l'equipe terrasse le weekend.",
  },
  {
    keywords: ["menu", "plat", "plats", "carte"],
    reply: "5 plats en rupture potentielle cette semaine. Le Baklava est votre dessert le plus populaire (+23%). Envisagez une promotion sur les pizzas (ventes en baisse).",
  },
  {
    keywords: ["client", "clients", "fidel", "fidelite"],
    reply: "546 clients actifs. 234 inactifs depuis 7 jours. Campagne win-back recommandee.",
  },
  {
    keywords: ["reservation", "reservations", "table", "tables"],
    reply: "32 reservations prevues ce soir. Taux d'occupation estime: 78%. Suggestion: ouvrir la terrasse des 19h.",
  },
  {
    keywords: ["qualite", "hygiene", "conformite"],
    reply: "Score qualite global: 96/100. Dernier audit: conforme. Prochaine verification HACCP dans 12 jours.",
  },
]

const DEFAULT_REPLY = "Je suis votre copilote IA. Posez-moi des questions sur les ventes, le stock, le personnel, le menu ou les clients."

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function findReply(input: string): string {
  const norm = normalize(input)
  for (const entry of KNOWLEDGE) {
    if (entry.keywords.some((kw) => norm.includes(kw))) return entry.reply
  }
  return DEFAULT_REPLY
}

export function AICopilot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { id: makeId(), role: "assistant", text: "Bonjour, je suis votre copilote IA admin. Comment puis-je vous aider?" },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text) return
    const userMsg: Message = { id: makeId(), role: "user", text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", text: findReply(text) }])
    }, 600)
  }

  return (
    <>
      {/* Floating button — bottom-left */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-xl shadow-violet-500/30 transition-transform hover:scale-105 active:scale-95"
        aria-label="Ouvrir le copilote IA"
      >
        {open ? <X className="h-6 w-6" /> : <Brain className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 left-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-violet-500/10 animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Copilote IA Admin</p>
              <p className="text-[10px] text-violet-200">Assistant intelligent</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-violet-200 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-br-md"
                      : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-700 bg-slate-800/80 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez une question..."
                className="flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-white transition-opacity disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
