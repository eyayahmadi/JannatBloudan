import { getRedis } from "@/lib/redis/client"

const CHAT_PREFIX = "chat:session:"
const MAX_MESSAGES = 12

async function getClient() {
  return getRedis()
}

export type StoredTurn = { role: "user" | "assistant"; content: string }

export async function loadChatHistory(sessionId: string): Promise<StoredTurn[]> {
  const redis = await getClient()
  if (!redis || !sessionId) return []
  try {
    const raw = await redis.get(`${CHAT_PREFIX}${sessionId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is StoredTurn => {
        if (typeof x !== "object" || x === null) return false
        const o = x as Record<string, unknown>
        return (
          (o.role === "user" || o.role === "assistant") &&
          typeof o.content === "string"
        )
      })
      .slice(-MAX_MESSAGES)
  } catch {
    return []
  }
}

export async function appendChatTurns(sessionId: string, userText: string, assistantText: string): Promise<void> {
  const redis = await getClient()
  if (!redis || !sessionId) return
  try {
    const prev = await loadChatHistory(sessionId)
    const next: StoredTurn[] = [
      ...prev,
      { role: "user" as const, content: userText },
      { role: "assistant" as const, content: assistantText },
    ].slice(-MAX_MESSAGES)
    await redis.set(`${CHAT_PREFIX}${sessionId}`, JSON.stringify(next), { EX: 60 * 60 * 24 * 7 })
  } catch {
    /* ignore cache errors */
  }
}
