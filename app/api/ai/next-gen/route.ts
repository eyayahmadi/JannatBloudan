import { NextResponse } from "next/server"

/** Features roadmap 2026–27 — etat d'integration dans la plateforme. */
export async function GET() {
  return NextResponse.json({
    features: [
      {
        id: "emotion_ai",
        name: "Emotion AI (camera)",
        status: "pilot",
        description: "Happy / angry → ajustement ton serveur & priorite cuisine",
      },
      {
        id: "predictive_ordering",
        name: "Predictive ordering",
        status: "beta",
        description: "‘Comme d’habitude?’ base sur memoire agent + historique commandes",
      },
      {
        id: "geo_fence",
        name: "Geo-fencing marketing",
        status: "planned",
        description: "Push quand le client approche du restaurant",
      },
      {
        id: "ai_waiter",
        name: "AI Waiter Assistant",
        status: "pilot",
        description: "Suggestions de parole + priorite tables pour le staff",
      },
      {
        id: "split_bill",
        name: "Smart split billing",
        status: "planned",
        description: "Repartition facture multi-convives assistee par IA",
      },
      {
        id: "kitchen_live",
        name: "Live kitchen transparency",
        status: "concept",
        description: "Flux video anonymise / etat des commandes pour le client",
      },
    ],
    stackHints: {
      orchestration: ["LangGraph", "CrewAI", "event-driven (Kafka)"],
      data: ["Pinecone / Weaviate", "ClickHouse", "Redis"],
      infra: ["Kubernetes", "Docker", "serverless workers"],
    },
    generatedAt: new Date().toISOString(),
  })
}
