import { NextResponse } from "next/server"

/** Features roadmap — état d'intégration dans la plateforme. */
export async function GET() {
  return NextResponse.json({
    innovationScore: 78,
    roadmapHorizon: "2026 — 2027",
    features: [
      {
        id: "emotion_ai",
        name: "Emotion AI (vision)",
        status: "pilot" as const,
        impactLevel: "high" as const,
        estimatedROI: 1.35,
        progressPercent: 42,
        technologies: ["Edge GPU", "Privacy blur", "LLM ton adaptatif"],
        description: "Happy / neutre / stress → ajustement du ton serveur & priorité cuisine.",
      },
      {
        id: "predictive_ordering",
        name: "Predictive ordering",
        status: "beta" as const,
        impactLevel: "high" as const,
        estimatedROI: 1.22,
        progressPercent: 58,
        technologies: ["Agent mémoire", "Séries temporelles", "Bandits"],
        description: "« Comme d'habitude ? » basé sur mémoire + historique commandes.",
      },
      {
        id: "geo_fence",
        name: "Geo-fencing marketing",
        status: "planned" as const,
        impactLevel: "medium" as const,
        estimatedROI: 1.08,
        progressPercent: 18,
        technologies: ["Push FCM/APNs", "Geohash"],
        description: "Notification contextuelle à l'approche du restaurant.",
      },
      {
        id: "ai_waiter",
        name: "AI Waiter Assistant",
        status: "pilot" as const,
        impactLevel: "high" as const,
        estimatedROI: 1.18,
        progressPercent: 51,
        technologies: ["Whisper léger", "RAG carte", "Tablette POS"],
        description: "Aide parole + priorités tables pour l'équipe salle.",
      },
      {
        id: "split_bill",
        name: "Smart split billing",
        status: "planned" as const,
        impactLevel: "medium" as const,
        estimatedROI: 1.05,
        progressPercent: 12,
        technologies: ["Paiement fractionné", "Règles TVA"],
        description: "Répartition assistée pour groupes.",
      },
      {
        id: "kitchen_live",
        name: "Live kitchen transparency",
        status: "concept" as const,
        impactLevel: "low" as const,
        estimatedROI: 0.92,
        progressPercent: 6,
        technologies: ["WebRTC", "Anonymisation"],
        description: "Visibilité état commande / file (option respect vie privée).",
      },
    ],
    stackHints: {
      orchestration: ["LangGraph", "CrewAI", "event-driven"],
      data: ["Pinecone / Weaviate", "ClickHouse", "Redis"],
      infra: ["Kubernetes", "Workers serverless"],
    },
    generatedAt: new Date().toISOString(),
  })
}
