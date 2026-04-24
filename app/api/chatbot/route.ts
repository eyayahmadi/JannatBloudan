import { type NextRequest, NextResponse } from "next/server"

import { getRestaurantOperationalContext } from "@/lib/agent-context/context"
import { vectorBackendLabel } from "@/lib/agent-memory/pinecone"
import { formatRagBlock, getClientMemory, ingestUserMessage } from "@/lib/agent-memory/store"
import { chatCompletion, isLlmConfigured } from "@/lib/llm/chat"
import { appendChatTurns, loadChatHistory } from "@/lib/redis/chat-session"

type Role = "client" | "admin"
type Lang = "fr" | "en" | "de" | "ar"
type Intent =
  | "salutation"
  | "faire_commande"
  | "demande_menu"
  | "recommandation_plat"
  | "infos_restaurant"

type Sentiment = {
  label: "POSITIVE" | "NEGATIVE" | "NEUTRAL"
  score: number
}

const ARABIC_RANGE = /[\u0600-\u06FF]/

function detectLang(text: string): Lang {
  const t = text.toLowerCase()

  if (ARABIC_RANGE.test(text)) return "ar"

  if (
    [
      "ich",
      "bestellen",
      "essen",
      "kann",
      "mochte",
      "möchte",
      "bitte",
      "hallo",
      "guten",
      "wo",
      "wann",
      "uhr",
      "speisekarte",
      "empfehlen",
    ].some((w) => t.includes(w))
  ) {
    return "de"
  }

  if (["can", "order", "open", "where", "menu", "please", "hello", "hi", "recommend"].some((w) => t.includes(w))) {
    return "en"
  }

  return "fr"
}

function detectIntent(text: string, role: Role): Intent {
  const t = text.toLowerCase()

  if (role !== "client") return "salutation"

  if (["commande", "comande", "order", "bestellen", "اطلب", "أطلب", "طلب"].some((w) => t.includes(w))) {
    return "faire_commande"
  }

  if (["menu", "plat", "plats", "essen", "eat", "speisekarte", "منيو", "أكل", "اكل"].some((w) => t.includes(w))) {
    return "demande_menu"
  }

  if (["recommend", "recommande", "empfehlen", "suggest", "تقترح", "تنصح"].some((w) => t.includes(w))) {
    return "recommandation_plat"
  }

  if (["hour", "hours", "open", "horaire", "adresse", "wo", "wann", "ou", "où", "وين", "فين"].some((w) => t.includes(w))) {
    return "infos_restaurant"
  }

  return "salutation"
}

function analyzeSentiment(text: string): Sentiment {
  const t = text.toLowerCase()

  if (["merci", "good", "great", "excellent", "danke", "ممتاز", "شكرا", "top"].some((w) => t.includes(w))) {
    return { label: "POSITIVE", score: 0.9 }
  }

  if (["bad", "problem", "late", "schlecht", "سيء", "غالي", "مش باهي"].some((w) => t.includes(w))) {
    return { label: "NEGATIVE", score: 0.8 }
  }

  return { label: "NEUTRAL", score: 0.6 }
}

function respondSalutation(lang: Lang): string {
  return {
    fr: "Bonjour. Bienvenue chez Bloudan Restaurant. Comment je peux t'aider ?",
    en: "Hello. Welcome to Bloudan Restaurant. How can I help you?",
    de: "Hallo. Willkommen im Bloudan Restaurant. Wie kann ich dir helfen?",
    ar: "أهلا. مرحبا بك في مطعم بلودان. كيف يمكنني مساعدتك؟",
  }[lang]
}

function respondMenu(lang: Lang): string {
  return {
    fr: "Notre menu: Shawarma, Falafel, Kebbe, Hummus.",
    en: "Our menu: Shawarma, Falafel, Kebbeh, Hummus.",
    de: "Unsere Speisekarte: Shawarma, Falafel, Kibbeh, Hummus.",
    ar: "القائمة لدينا: شاورما، فلافل، كبة، حمص.",
  }[lang]
}

function respondRecommendation(lang: Lang): string {
  return {
    fr: "Je te recommande le shawarma poulet.",
    en: "I recommend the chicken shawarma.",
    de: "Ich empfehle dir das Hähnchen-Shawarma.",
    ar: "أنصحك بشاورما الدجاج.",
  }[lang]
}

function respondInfo(lang: Lang): string {
  return {
    fr: "Bloudan Restaurant: ouvert de 11h a 23h.",
    en: "Bloudan Restaurant: open from 11am to 11pm.",
    de: "Bloudan Restaurant: geöffnet von 11 bis 23 Uhr.",
    ar: "مطعم بلودان: مفتوح من 11 إلى 23.",
  }[lang]
}

function respondOrder(lang: Lang): string {
  return {
    fr: "Bien sur. Dis-moi le plat et la quantite.",
    en: "Sure. Tell me the dish and the quantity.",
    de: "Natürlich. Nenne mir das Gericht und die Menge.",
    ar: "أكيد. قل لي الطبق والكمية.",
  }[lang]
}

function dispatch(role: Role, intent: Intent, lang: Lang): string {
  if (role !== "client") return "Admin mode."
  if (intent === "salutation") return respondSalutation(lang)
  if (intent === "demande_menu") return respondMenu(lang)
  if (intent === "recommandation_plat") return respondRecommendation(lang)
  if (intent === "infos_restaurant") return respondInfo(lang)
  if (intent === "faire_commande") return respondOrder(lang)
  return respondSalutation(lang)
}

const LLM_SYSTEM = `Tu es l'assistant du restaurant Bloudan (cuisine levantine : shawarma, falafel, mezze, kibbeh, etc.).
Reponds de facon courte et utile, dans la meme langue que le message du client (FR / EN / DE / AR).
Pour le menu : mentionne des plats types; si les prix sont incertains, renvoie vers le menu en ligne.
Pour une commande : demande le plat, la quantite, et la table si pertinent.
Utilise les preferences et le contexte (rush / calme) fournis pour personnaliser (ex: client spicy → proposer plats releves).`

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { message?: string; role?: Role; sessionId?: string }
    const message = (body.message ?? "").trim()
    const role: Role = body.role === "admin" ? "admin" : "client"
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : ""
    const clientKey = sessionId || "anonymous"

    if (!message) {
      return NextResponse.json({ error: "Le message est requis." }, { status: 400 })
    }

    const lang = detectLang(message)
    const intent = detectIntent(message, role)
    const sentiment = analyzeSentiment(message)
    const opCtx = getRestaurantOperationalContext()

    const memBefore =
      role === "client" && clientKey !== "anonymous" ? await getClientMemory(clientKey) : null

    const contextBlock =
      role === "client"
        ? `\n\n--- Contexte operationnel ---\nCharge: ${opCtx.rushLevel} (index ${opCtx.loadIndex}/100), creneau: ${opCtx.timeSlot}, week-end: ${opCtx.isWeekend ? "oui" : "non"}.\n${opCtx.hints.join(" ")}`
        : ""

    const ragBlock =
      memBefore && clientKey !== "anonymous"
        ? `\n--- Memoire client (RAG / ${vectorBackendLabel()}) ---\n${formatRagBlock(memBefore, message)}`
        : ""

    let reply = dispatch(role, intent, lang)
    let source: "llm" | "rules" = "rules"

    if (role === "client" && isLlmConfigured()) {
      const history = await loadChatHistory(sessionId)
      const systemPrompt = `${LLM_SYSTEM}${contextBlock}${ragBlock}`
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user" as const, content: message },
      ]
      const llmText = await chatCompletion(messages)
      if (llmText) {
        reply = llmText
        source = "llm"
      }
    }

    if (role === "client" && clientKey !== "anonymous") {
      await ingestUserMessage(clientKey, message, sentiment.label)
    }

    if (sessionId && role === "client") {
      await appendChatTurns(sessionId, message, reply)
    }

    const memAfter =
      role === "client" && clientKey !== "anonymous" ? await getClientMemory(clientKey) : null

    return NextResponse.json({
      reply,
      intent,
      lang,
      sentiment,
      role,
      sessionId: sessionId || null,
      source,
      operationalContext: role === "client" ? opCtx : undefined,
      memory:
        memAfter && clientKey !== "anonymous"
          ? {
              topPreferences: Object.entries(memAfter.tasteVector)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6),
              learningScore: memAfter.learningScore,
              ragBackend: vectorBackendLabel(),
            }
          : undefined,
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
