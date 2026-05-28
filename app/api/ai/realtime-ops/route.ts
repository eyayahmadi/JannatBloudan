import { NextResponse } from "next/server"

import { getRestaurantOperationalContext } from "@/lib/agent-context/context"

export async function GET() {
  const ctx = getRestaurantOperationalContext()
  const latencyMs = 38 + (ctx.loadIndex % 40)
  const queueDepth = Math.round(ctx.loadIndex * 0.8)
  const ordersPerMin = 4 + Math.round(ctx.loadIndex / 25)

  return NextResponse.json({
    agent: "realtime_optimization",
    live: true,
    latency: { preparationAvgSec: latencyMs + 180, dispatchDelayMin: latencyMs > 55 ? 6 : 3, label: "Préparation moyenne" },
    throughput: {
      ordersPerMin,
      kitchenLoadPercent: Math.min(100, queueDepth + 15),
      deliveryDelayEstimateMin: ctx.rushLevel === "rush" ? 38 : 22,
    },
    stations: [
      {
        id: "grill",
        label: "Grill",
        status: ctx.loadIndex > 65 ? "saturated" : "ok",
        loadPercent: Math.min(100, 40 + ctx.loadIndex * 0.45),
      },
      {
        id: "cold",
        label: "Froid / mezze",
        status: ctx.loadIndex > 75 ? "watch" : "ok",
        loadPercent: Math.min(100, 32 + ctx.loadIndex * 0.35),
      },
      {
        id: "dessert",
        label: "Desserts",
        status: "ok",
        loadPercent: Math.min(95, 25 + ctx.loadIndex * 0.2),
      },
      {
        id: "expedition",
        label: "Expédition",
        status: ctx.rushLevel === "rush" ? "watch" : "ok",
        loadPercent: Math.min(100, queueDepth),
      },
    ],
    bottleneck:
      ctx.loadIndex > 68
        ? "Grill — paralléliser broches ou réduire choix signatures"
        : "Flux équilibré — surveiller fenêtre livraisons",
    trafficPrediction:
      ctx.rushLevel === "rush"
        ? "Charge encore en hausse sur les 40 prochaines minutes"
        : "Stabilisation attendue après le créneau repas",
    aiRecommendations: [
      ctx.rushLevel === "rush"
        ? "Activer ménu express et buffer ETA +4 min"
        : "Réactiver upsell dessert et suggestions boisson",
      queueDepth > 55 ? "Pré-positionner conteneurs expédition" : "Maintenir staffing standard",
    ],
    actions: [
      ctx.rushLevel === "rush"
        ? { type: "throttle", target: "delivery_eta_buffer", value: "+4 min" }
        : { type: "boost", target: "upsell_agent", value: "on" },
      { type: "route", target: "grill_station", value: ctx.loadIndex > 60 ? "parallel" : "single" },
    ],
    context: ctx,
    generatedAt: new Date().toISOString(),
  })
}
