"use client"

import { useMemo, useState } from "react"
import { MessageCircle, Send, X, Mic } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ChatMessage = {
  id: string
  sender: "user" | "bot"
  text: string
}

type BotResponse = {
  reply: string
  intent: string
  lang: string
  sentiment: {
    label: string
    score: number
  }
  source?: "llm" | "rules"
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function ChatWidget() {
  const sessionId = useMemo(() => makeId(), [])
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      sender: "bot",
      text: "Bonjour. Je suis l'assistant du restaurant. Je peux repondre en francais, anglais, allemand et arabe.",
    },
  ])

  const toggleVoice = () => {
    if (typeof window === "undefined") return
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      setMessages((prev) => [...prev, { id: makeId(), sender: "bot", text: "La reconnaissance vocale n'est pas supportee par votre navigateur." }])
      return
    }
    if (isListening) { setIsListening(false); return }
    const recognition = new SpeechRecognition()
    recognition.lang = "fr-FR"
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }
    recognition.onerror = () => { setIsListening(false) }
    recognition.onend = () => { setIsListening(false) }
    recognition.start()
    setIsListening(true)
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMessage: ChatMessage = {
      id: makeId(),
      sender: "user",
      text,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, role: "client", sessionId }),
      })
      const data = (await res.json()) as BotResponse | { error: string }

      if (!res.ok || !("reply" in data)) {
        throw new Error("error" in data ? data.error : "Chatbot indisponible")
      }

      const src = data.source ?? "rules"
      const botText = `${data.reply}\n(${data.lang} | ${data.intent} | ${data.sentiment.label} | ${src})`
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          sender: "bot",
          text: botText,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          sender: "bot",
          text: "Je ne peux pas repondre pour le moment. Reessaie dans quelques secondes.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-amber-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-amber-700 to-orange-700 px-4 py-3 text-white">
            <div>
              <div className="text-sm font-semibold">Assistant Bloudan</div>
              <div className="text-[10px] opacity-75">FR / EN / AR / DE</div>
            </div>
            <button
              type="button"
              aria-label="Fermer le chat"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-80 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                    m.sender === "user"
                      ? "bg-orange-600 text-white"
                      : "border border-amber-200 bg-amber-50 text-amber-950"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-amber-700">Le bot ecrit...</div>}
          </div>

          <div className="flex items-center gap-2 border-t border-amber-100 p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pose ta question..."
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendMessage()
              }}
            />
            <Button type="button" onClick={() => void sendMessage()} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={toggleVoice}
              disabled={loading}
              variant={isListening ? "destructive" : "outline"}
              className={isListening ? "animate-pulse" : ""}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="h-14 w-14 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 shadow-xl hover:from-amber-700 hover:to-orange-700"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  )
}
