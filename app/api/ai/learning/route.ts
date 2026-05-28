import { NextResponse } from "next/server"

/** Auto-learning & registry (métriques demo — brancher ML ops / bandits en production). */
export async function GET() {
  const now = Date.now()
  const version = `bloudan-rl-${Math.floor(now / 86400000)}.2`
  const drift = 0.04 + (now % 100) / 10000
  const health = Math.max(72, Math.min(99, Math.round(96 - drift * 120)))

  return NextResponse.json({
    modelVersion: version,
    modelHealthScore: health,
    lastTrainingAt: new Date(now - 86400000 * 3).toISOString(),
    onlineLearning: {
      status: "active",
      lastBatchAt: new Date(now - 3600000).toISOString(),
      samplesProcessedToday: 1842 + (now % 200),
      driftScore: drift,
    },
    reinforcement: {
      policy: "epsilon_greedy_upsell_v2",
      rewardSignal: "marge + satisfaction normalisée",
      explorationRate: 0.08,
    },
    explorationPercent: 8,
    learningProgressPercent: Math.min(100, 68 + ((now % 5000) / 5000) * 8),
    abTests: [
      {
        name: "Upsell dessert — tonalité du message",
        variantA: "Courte",
        variantB: "Premium narrative",
        winner: "B" as const,
        upliftPercent: 6.2,
        confidencePercent: 94,
        status: "running" as const,
      },
      {
        name: "Menu rush — réduit",
        variantA: "6 plats",
        variantB: "10 plats",
        winner: "A" as const,
        upliftPercent: 3.1,
        confidencePercent: 78,
        status: "concluded" as const,
      },
    ],
    alerts: drift > 0.11 ? [{ level: "warning", text: "Dérive des features détectée — planifier ré-étalonnage." }] : [],
    nextRetrainAt: new Date(now + 7200000).toISOString(),
    generatedAt: new Date().toISOString(),
  })
}
