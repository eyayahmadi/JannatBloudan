/**
 * Agent Observability
 * -------------------
 * Helpers pour logger chaque execution d'agent dans `agent_executions`
 * (et `agent_feedback` si on veut remonter des signaux RL).
 *
 * Principe : fire-and-forget. Si Supabase est indisponible, on ignore.
 * Jamais de blocage sur le chemin critique.
 */

import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export type AgentExecutionLog = {
  agentName: string
  input?: unknown
  output?: unknown
  latencyMs?: number
  tokensUsed?: number
  costUsd?: number
  status?: "success" | "error" | "timeout"
  errorMessage?: string | null
  userId?: string | null
  modelVersionId?: string | null
  traceId?: string | null
}

export type AgentFeedback = {
  executionId?: string
  agentName?: string
  userId?: string | null
  reward?: number // [-1, 1]
  feedbackType?: "thumbs_up" | "thumbs_down" | "click" | "conversion" | "ignored"
  signalSource?: "explicit" | "implicit" | "behavioral"
  metadata?: Record<string, unknown>
}

/**
 * Log une execution d'agent. Non-bloquant, fire-and-forget.
 */
export async function logAgentExecution(entry: AgentExecutionLog): Promise<string | null> {
  if (!hasServerSupabaseEnv()) return null

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("agent_executions")
      .insert({
        agent_name: entry.agentName,
        input: entry.input ?? null,
        output: entry.output ?? null,
        latency_ms: entry.latencyMs ?? null,
        tokens_used: entry.tokensUsed ?? null,
        cost_usd: entry.costUsd ?? null,
        status: entry.status ?? "success",
        error_message: entry.errorMessage ?? null,
        user_id: entry.userId ?? null,
        model_version_id: entry.modelVersionId ?? null,
        trace_id: entry.traceId ?? null,
      })
      .select("id")
      .single()

    if (error) {
      // Silencieux : on ne casse jamais le flow applicatif
      console.warn("[observability] log failed:", error.message)
      return null
    }
    return data?.id ?? null
  } catch (err) {
    console.warn("[observability] log exception:", err)
    return null
  }
}

/**
 * Log un signal de feedback (RL ou UX).
 */
export async function logAgentFeedback(fb: AgentFeedback): Promise<void> {
  if (!hasServerSupabaseEnv()) return

  try {
    const supabase = await createClient()
    await supabase.from("agent_feedback").insert({
      execution_id: fb.executionId ?? null,
      agent_name: fb.agentName ?? null,
      user_id: fb.userId ?? null,
      reward: fb.reward ?? null,
      feedback_type: fb.feedbackType ?? null,
      signal_source: fb.signalSource ?? "explicit",
      metadata: fb.metadata ?? null,
    })
  } catch (err) {
    console.warn("[observability] feedback log exception:", err)
  }
}

/**
 * Wrapper : mesure latency + tokens automatiquement autour d'une fonction async.
 *
 * Exemple :
 *   const result = await withAgentTracking("agent_chatbot", async () => {
 *     return await chatCompletion(messages)
 *   })
 */
export async function withAgentTracking<T>(
  agentName: string,
  fn: () => Promise<T>,
  opts?: {
    input?: unknown
    userId?: string | null
    traceId?: string | null
    extractTokens?: (result: T) => number | undefined
  },
): Promise<{ result: T; executionId: string | null; latencyMs: number }> {
  const start = Date.now()
  const traceId = opts?.traceId ?? genTraceId()

  try {
    const result = await fn()
    const latencyMs = Date.now() - start
    const tokensUsed = opts?.extractTokens?.(result) ?? undefined

    const executionId = await logAgentExecution({
      agentName,
      input: opts?.input,
      output: typeof result === "string" ? { text: result } : result,
      latencyMs,
      tokensUsed,
      status: "success",
      userId: opts?.userId ?? null,
      traceId,
    })

    return { result, executionId, latencyMs }
  } catch (err) {
    const latencyMs = Date.now() - start
    await logAgentExecution({
      agentName,
      input: opts?.input,
      latencyMs,
      status: "error",
      errorMessage: err instanceof Error ? err.message : String(err),
      userId: opts?.userId ?? null,
      traceId,
    })
    throw err
  }
}

export function genTraceId(): string {
  return `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Estimation grossiere du cout OpenAI pour un usage (non officiel).
 * Basee sur gpt-4o-mini : ~0.15 USD / 1M tokens input, 0.60 USD / 1M tokens output.
 */
export function estimateOpenAICost(model: string, totalTokens: number): number {
  const m = model.toLowerCase()
  if (m.includes("gpt-4o-mini")) return (totalTokens / 1_000_000) * 0.375 // moyenne in/out
  if (m.includes("gpt-4o")) return (totalTokens / 1_000_000) * 5
  if (m.includes("gpt-4")) return (totalTokens / 1_000_000) * 15
  if (m.includes("gpt-3.5")) return (totalTokens / 1_000_000) * 0.75
  if (m.includes("claude")) return (totalTokens / 1_000_000) * 3
  return 0
}
