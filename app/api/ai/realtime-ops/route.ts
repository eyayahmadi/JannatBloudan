import { NextResponse } from "next/server"

import { getRestaurantOperationalContext } from "@/lib/agent-context/context"

export async function GET() {
  const ctx = getRestaurantOperationalContext()
  const latencyMs = 38 + (ctx.loadIndex % 40)
  const queueDepth = Math.round(ctx.loadIndex * 0.8)

  return NextResponse.json({
    agent: "realtime_optimization",
    latency: { p50: latencyMs, p95: latencyMs + 120, p99: latencyMs + 280 },
    throughput: { ordersPerMin: 4 + Math.round(ctx.loadIndex / 25), kitchenLoad: queueDepth },
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
