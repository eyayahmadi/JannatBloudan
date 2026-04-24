import { NextResponse } from "next/server"

const POSITIVE = ["excellent", "delicieux", "parfait", "rapide", "frais", "genereux", "savoureux", "magnifique", "incroyable", "top", "bravo", "merci", "super", "genial", "exquis", "chaleureux", "accueillant", "authentique", "bon", "bien"]
const NEGATIVE = ["froid", "lent", "mauvais", "decu", "cher", "petit", "long", "attente", "sale", "bruit", "erreur", "oubli", "tiede", "mediocre", "decevant", "desagreable", "incorrect"]
const INTENSIFIERS = ["tres", "vraiment", "extremement", "absolument", "tellement", "incroyablement"]

const TOPICS: Record<string, string[]> = {
  food: ["plat", "nourriture", "gout", "saveur", "cuisson", "portion", "ingredient", "recette", "shawarma", "pizza", "burger", "mezze", "dessert", "frais"],
  service: ["serveur", "service", "accueil", "attente", "rapidite", "personnel", "sourire", "aimable", "professionnel"],
  ambiance: ["ambiance", "decoration", "musique", "lieu", "propre", "beau", "cadre", "terrasse", "atmosphere"],
  price: ["prix", "cher", "abordable", "rapport", "qualite", "valeur", "cout"],
}

const MOCK_REVIEWS = [
  { id: 1, text: "Excellent shawarma, tres genereux et savoureux. Service rapide et accueillant.", date: "2024-12-15", author: "Amina K." },
  { id: 2, text: "Le kebab etait un peu tiede et l'attente longue. Mais les mezzes etaient parfaits.", date: "2024-12-14", author: "Mohamed R." },
  { id: 3, text: "Incroyable experience ! Cadre magnifique et nourriture authentique. Prix tres abordable.", date: "2024-12-13", author: "Sarah L." },
  { id: 4, text: "Decu par le burger, portion petite pour le prix. Le service etait correct.", date: "2024-12-12", author: "Ali M." },
  { id: 5, text: "Top ! Le baklava est exquis. Ambiance chaleureuse, on reviendra.", date: "2024-12-11", author: "Leila B." },
  { id: 6, text: "Tres bon restaurant syrien. Le houmous est le meilleur que j'ai goute. Bravo !", date: "2024-12-10", author: "Jean P." },
  { id: 7, text: "Service lent et erreur sur la commande. La nourriture etait bonne cependant.", date: "2024-12-09", author: "Omar T." },
  { id: 8, text: "Vraiment delicieux. La pizza orientale est absolument parfaite. Super accueil.", date: "2024-12-08", author: "Marie C." },
]

function analyzeText(text: string) {
  const words = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/)
  let score = 0
  let multiplier = 1

  words.forEach((word, i) => {
    if (INTENSIFIERS.includes(word)) { multiplier = 1.5; return }
    if (POSITIVE.includes(word)) { score += 1 * multiplier; multiplier = 1 }
    if (NEGATIVE.includes(word)) { score -= 1 * multiplier; multiplier = 1 }
  })

  const maxScore = Math.max(words.length * 0.3, 1)
  const normalized = Math.max(-1, Math.min(1, score / maxScore))
  const label = normalized > 0.15 ? "positive" : normalized < -0.15 ? "negative" : "neutral"

  const topicScores: Record<string, number> = {}
  Object.entries(TOPICS).forEach(([topic, keywords]) => {
    const matches = words.filter((w) => keywords.includes(w)).length
    topicScores[topic] = matches
  })

  return { score: Math.round(normalized * 100) / 100, label, topicScores }
}

export async function GET() {
  const analyzed = MOCK_REVIEWS.map((review) => {
    const analysis = analyzeText(review.text)
    return { ...review, ...analysis }
  })

  const avgScore = analyzed.reduce((s, r) => s + r.score, 0) / analyzed.length
  const positive = analyzed.filter((r) => r.label === "positive").length
  const negative = analyzed.filter((r) => r.label === "negative").length
  const neutral = analyzed.filter((r) => r.label === "neutral").length

  const topicAgg: Record<string, number> = { food: 0, service: 0, ambiance: 0, price: 0 }
  analyzed.forEach((r) => {
    Object.entries(r.topicScores).forEach(([t, v]) => { topicAgg[t] = (topicAgg[t] || 0) + v })
  })

  const allWords = MOCK_REVIEWS.flatMap((r) => r.text.toLowerCase().split(/\s+/).filter((w) => w.length > 3))
  const wordFreq: Record<string, number> = {}
  allWords.forEach((w) => { wordFreq[w] = (wordFreq[w] || 0) + 1 })
  const wordCloud = Object.entries(wordFreq).sort(([, a], [, b]) => b - a).slice(0, 20).map(([word, count]) => ({ word, count }))

  return NextResponse.json({
    reviews: analyzed,
    overall: { avgScore: Math.round(avgScore * 100) / 100, positive, negative, neutral, total: analyzed.length },
    topics: topicAgg,
    wordCloud,
    suggestions: [
      avgScore < 0.3 ? "Ameliorer la qualite generale — score moyen bas" : "Maintenir la qualite — bon score global",
      topicAgg.service < topicAgg.food ? "Le service recoit moins de mentions positives que la nourriture — renforcer la formation" : null,
      negative > positive ? "Attention: plus d'avis negatifs que positifs ce mois" : null,
    ].filter(Boolean),
    algorithm: "keyword_sentiment_analysis_v1",
  })
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    if (!text) return NextResponse.json({ error: "Texte requis" }, { status: 400 })
    const analysis = analyzeText(text)
    return NextResponse.json({ text, ...analysis, algorithm: "keyword_sentiment_analysis_v1" })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
