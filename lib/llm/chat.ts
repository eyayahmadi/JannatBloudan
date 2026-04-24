/**
 * OpenAI-compatible chat completions (OpenAI, Azure OpenAI via OPENAI_BASE_URL, OpenRouter, etc.).
 * Returns null when no API key is configured or the request fails.
 *
 * Integration observability : chaque appel est loggue en fire-and-forget
 * dans `agent_executions` (via logAgentExecution).
 */

import { estimateOpenAICost, logAgentExecution, genTraceId } from "@/lib/ai/observability"

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || process.env.AI_API_KEY
}

export function isLlmConfigured(): boolean {
  return Boolean(getApiKey()?.trim())
}

export type ChatCompletionOptions = {
  agentName?: string       // nom de l'agent appelant (defaut: "agent_chatbot")
  userId?: string | null   // user Supabase, si dispo
  traceId?: string | null
  temperature?: number
  maxTokens?: number
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<string | null> {
  const key = getApiKey()?.trim()
  if (!key) return null

  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
  const agentName = options.agentName ?? "agent_chatbot"
  const traceId = options.traceId ?? genTraceId()

  const start = Date.now()
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        ...(process.env.OPENAI_ORG_ID ? { "OpenAI-Organization": process.env.OPENAI_ORG_ID } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.6,
        max_tokens: options.maxTokens ?? 600,
      }),
    })

    if (!res.ok) {
      const latencyMs = Date.now() - start
      void logAgentExecution({
        agentName,
        input: { messages, model },
        latencyMs,
        status: "error",
        errorMessage: `HTTP ${res.status}`,
        userId: options.userId ?? null,
        traceId,
      })
      return null
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number }
    }
    const text = data.choices?.[0]?.message?.content?.trim()
    const totalTokens = data.usage?.total_tokens ?? 0
    const latencyMs = Date.now() - start

    // Fire-and-forget : on ne bloque jamais le retour
    void logAgentExecution({
      agentName,
      input: {
        messages: messages.map((m) => ({ role: m.role, len: m.content.length })),
        model,
      },
      output: { text: text?.slice(0, 500) ?? null, len: text?.length ?? 0 },
      latencyMs,
      tokensUsed: totalTokens,
      costUsd: estimateOpenAICost(model, totalTokens),
      status: text ? "success" : "error",
      errorMessage: text ? null : "Empty response",
      userId: options.userId ?? null,
      traceId,
    })

    return text || null
  } catch (err) {
    const latencyMs = Date.now() - start
    void logAgentExecution({
      agentName,
      input: { messages, model },
      latencyMs,
      status: "error",
      errorMessage: err instanceof Error ? err.message : String(err),
      userId: options.userId ?? null,
      traceId,
    })
    return null
  }
}
