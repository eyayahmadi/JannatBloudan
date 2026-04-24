import { NextResponse } from "next/server"

/** Auto-learning & registry (metriques demo — brancher ML ops / bandits en production). */
export async function GET() {
  const now = Date.now()
  const version = `bloudan-rl-${Math.floor(now / 86400000)}.2`
  return NextResponse.json({
    modelVersion: version,
    onlineLearning: {
      status: "active",
      lastBatch: new Date(now - 3600000).toISOString(),
      samplesProcessed24h: 1842 + (now % 200),
      driftScore: 0.04 + (now % 100) / 10000,
    },
    reinforcement: {
      policy: "epsilon_greedy_upsell_v2",
      rewardSignal: "margin_plus_satisfaction",
      explorationRate: 0.08,
    },
    abTests: [
      { name: "upsell_dessert_copy", variant: "B", liftPercent: 6.2 },
      { name: "rush_fast_menu", variant: "A", liftPercent: 3.1 },
    ],
    nextRetrain: new Date(now + 7200000).toISOString(),
    generatedAt: new Date().toISOString(),
  })
}
