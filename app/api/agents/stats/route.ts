import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get("days") || 30)

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      agents: [],
      recent: [],
      errorsRate: 0,
      totalExecutions: 0,
      totalCost: 0,
      source: "mock",
    })
  }

  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - days * 86400000).toISOString()

    // Vue aggregee (creee dans migration 08)
    const [{ data: stats }, { data: recent }, { data: registry }] = await Promise.all([
      supabase.from("v_agent_stats").select("*"),
      supabase
        .from("agent_executions")
        .select("id, agent_name, status, latency_ms, tokens_used, cost_usd, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("model_registry").select("name, agent_type, current_version, status"),
    ])

    const agents = (stats ?? []).map((row: any) => {
      const meta = (registry ?? []).find((r: any) => r.name === row.agent_name)
      return {
        name: row.agent_name,
        type: meta?.agent_type ?? "unknown",
        version: meta?.current_version ?? null,
        executions: Number(row.executions_count ?? 0),
        avgLatencyMs: Math.round(Number(row.avg_latency_ms ?? 0)),
        totalTokens: Number(row.total_tokens ?? 0),
        totalCost: Number(row.total_cost_usd ?? 0),
        errors: Number(row.errors_count ?? 0),
        errorRate:
          Number(row.executions_count) > 0
            ? Number(row.errors_count ?? 0) / Number(row.executions_count)
            : 0,
        lastRunAt: row.last_run_at,
      }
    })

    const totalExecutions = agents.reduce((s, a) => s + a.executions, 0)
    const totalErrors = agents.reduce((s, a) => s + a.errors, 0)
    const totalCost = agents.reduce((s, a) => s + a.totalCost, 0)
    const errorsRate = totalExecutions > 0 ? totalErrors / totalExecutions : 0

    return NextResponse.json({
      agents,
      recent: recent ?? [],
      totalExecutions,
      totalCost,
      errorsRate,
      registry: registry ?? [],
      periodDays: days,
      source: "supabase",
    })
  } catch (err) {
    console.error("[agents/stats] exception", err)
    return NextResponse.json({
      agents: [],
      recent: [],
      errorsRate: 0,
      totalExecutions: 0,
      totalCost: 0,
      source: "mock-fallback",
    })
  }
}
