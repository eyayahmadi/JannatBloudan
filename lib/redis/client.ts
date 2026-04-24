import { createClient } from "redis"

type RedisLike = Awaited<ReturnType<typeof createClient>>

let shared: RedisLike | null | undefined

export async function getRedis(): Promise<RedisLike | null> {
  const url = process.env.REDIS_URL?.trim()
  if (!url) return null

  if (shared === null) return null
  if (shared) return shared

  try {
    const client = createClient({ url }) as RedisLike
    await client.connect()
    shared = client
    return shared
  } catch {
    shared = null
    return null
  }
}
