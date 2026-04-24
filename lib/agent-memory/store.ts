import { getRedis } from "@/lib/redis/client"
import { mergeTasteVector, extractTagsFromText } from "@/lib/agent-memory/tag-extract"
import type { ClientAgentMemory, MemoryChunk } from "@/lib/agent-memory/types"

const PREFIX = "agent:memory:"
const MEM_TTL_SEC = 60 * 60 * 24 * 30

const memoryFallback = new Map<string, ClientAgentMemory>()

function emptyMemory(clientKey: string): ClientAgentMemory {
  return {
    clientKey,
    tasteVector: {},
    orderSummaries: [],
    reactions: { positive: [], negative: [] },
    chunks: [],
    updatedAt: new Date().toISOString(),
    learningScore: 0.72,
  }
}

function makeId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zà-ÿ\u0600-\u06ff0-9]+/i)
    .filter((w) => w.length > 2)
    .slice(0, 40)
}

/** Retrieval lexical simple (proxy Vector DB / RAG sans infra externe). */
export function retrieveRelevantChunks(query: string, chunks: MemoryChunk[], topK = 4): MemoryChunk[] {
  const qTokens = new Set(tokenize(query))
  if (qTokens.size === 0) return chunks.slice(-topK)
  const scored = chunks.map((c) => {
    const overlap = c.tokens.filter((t) => qTokens.has(t)).length
    return { c, s: overlap + c.tokens.length * 0.02 }
  })
  return scored
    .sort((a, b) => b.s - a.s)
    .slice(0, topK)
    .map((x) => x.c)
}

export function formatRagBlock(mem: ClientAgentMemory, query: string): string {
  const top = retrieveRelevantChunks(query, mem.chunks, 4)
  const prefs = Object.entries(mem.tasteVector)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, v]) => `${k}:${v.toFixed(2)}`)
    .join(", ")
  const orders = mem.orderSummaries.slice(-4).join(" | ")
  const reactP = mem.reactions.positive.slice(-2).join(", ")
  const reactN = mem.reactions.negative.slice(-2).join(", ")
  const rag = top.map((c) => `- ${c.text}`).join("\n")
  return [
    prefs && `Preferences (poids): ${prefs}`,
    orders && `Commandes recentes: ${orders}`,
    reactP && `Feedback +: ${reactP}`,
    reactN && `Feedback -: ${reactN}`,
    rag && `Memoires pertinentes:\n${rag}`,
  ]
    .filter(Boolean)
    .join("\n")
}

async function loadRaw(clientKey: string): Promise<ClientAgentMemory | null> {
  if (!clientKey) return null
  const redis = await getRedis()
  if (redis) {
    try {
      const raw = await redis.get(`${PREFIX}${clientKey}`)
      if (!raw) return null
      return JSON.parse(raw) as ClientAgentMemory
    } catch {
      return null
    }
  }
  return memoryFallback.get(clientKey) ?? null
}

async function saveRaw(mem: ClientAgentMemory): Promise<void> {
  mem.updatedAt = new Date().toISOString()
  const redis = await getRedis()
  const payload = JSON.stringify(mem)
  if (redis) {
    try {
      await redis.set(`${PREFIX}${mem.clientKey}`, payload, { EX: MEM_TTL_SEC })
    } catch {
      /* ignore */
    }
    return
  }
  memoryFallback.set(mem.clientKey, mem)
}

export async function getClientMemory(clientKey: string): Promise<ClientAgentMemory> {
  const existing = await loadRaw(clientKey)
  if (existing) return existing
  const m = emptyMemory(clientKey)
  await saveRaw(m)
  return m
}

export async function ingestUserMessage(
  clientKey: string,
  message: string,
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL",
): Promise<ClientAgentMemory> {
  const mem = await getClientMemory(clientKey)
  const tags = extractTagsFromText(message)
  mem.tasteVector = mergeTasteVector(mem.tasteVector, tags)
  const tokens = tokenize(message)
  mem.chunks.push({
    id: makeId(),
    text: message.slice(0, 500),
    createdAt: new Date().toISOString(),
    tokens: [...new Set([...tokens, ...Object.keys(tags)])],
  })
  if (mem.chunks.length > 40) mem.chunks = mem.chunks.slice(-40)
  if (sentiment === "POSITIVE") mem.reactions.positive.push(message.slice(0, 120))
  if (sentiment === "NEGATIVE") mem.reactions.negative.push(message.slice(0, 120))
  if (mem.reactions.positive.length > 15) mem.reactions.positive = mem.reactions.positive.slice(-15)
  if (mem.reactions.negative.length > 15) mem.reactions.negative = mem.reactions.negative.slice(-15)
  mem.learningScore = Math.min(0.99, mem.learningScore + 0.001)
  await saveRaw(mem)
  return mem
}

export async function recordOrderSummary(clientKey: string, summary: string): Promise<ClientAgentMemory> {
  const mem = await getClientMemory(clientKey)
  mem.orderSummaries.push(summary.slice(0, 200))
  if (mem.orderSummaries.length > 20) mem.orderSummaries = mem.orderSummaries.slice(-20)
  await saveRaw(mem)
  return mem
}
