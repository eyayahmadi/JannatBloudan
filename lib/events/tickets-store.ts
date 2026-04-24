import { getRedis } from "@/lib/redis/client"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export type ParticipantTicket = {
  code: string
  eventId: string
  eventTitle?: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  adults: number
  children: number
  unitPriceAdult: number
  unitPriceChild: number
  totalAmount: number
  paid: boolean
  status: "pending" | "paid" | "checked_in" | "cancelled"
  createdAt: string
  checkedInAt?: string
  specialRequests?: string
}

const PREFIX = "event:ticket:"
const INDEX_PREFIX = "event:tickets:index:"
const TTL_SECONDS = 60 * 60 * 24 * 180

const memoryStore = new Map<string, ParticipantTicket>()
const memoryIndex = new Map<string, Set<string>>()

export function generateTicketCode(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  const stamp = Date.now().toString(36).toUpperCase()
  return `BLD-${stamp.slice(-4)}-${rand}`
}

// Conversion row DB <-> ParticipantTicket
function rowToTicket(row: any): ParticipantTicket {
  return {
    code: row.code,
    eventId: row.event_id,
    eventTitle: row.event_title ?? undefined,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone ?? undefined,
    adults: Number(row.adults ?? 0),
    children: Number(row.children ?? 0),
    unitPriceAdult: Number(row.unit_price_adult ?? 0),
    unitPriceChild: Number(row.unit_price_child ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
    paid: Boolean(row.paid),
    status: row.status,
    createdAt: row.created_at,
    checkedInAt: row.checked_in_at ?? undefined,
    specialRequests: row.special_requests ?? undefined,
  }
}

function ticketToRow(t: ParticipantTicket) {
  return {
    code: t.code,
    event_id: t.eventId,
    event_title: t.eventTitle ?? null,
    guest_name: t.guestName,
    guest_email: t.guestEmail,
    guest_phone: t.guestPhone ?? null,
    adults: t.adults,
    children: t.children,
    unit_price_adult: t.unitPriceAdult,
    unit_price_child: t.unitPriceChild,
    total_amount: t.totalAmount,
    paid: t.paid,
    status: t.status,
    special_requests: t.specialRequests ?? null,
    checked_in_at: t.checkedInAt ?? null,
    created_at: t.createdAt,
  }
}

async function saveMemory(ticket: ParticipantTicket): Promise<void> {
  memoryStore.set(ticket.code, ticket)
  const set = memoryIndex.get(ticket.eventId) ?? new Set<string>()
  set.add(ticket.code)
  memoryIndex.set(ticket.eventId, set)
}

async function saveRedis(ticket: ParticipantTicket): Promise<boolean> {
  const redis = await getRedis()
  if (!redis) return false
  try {
    await redis.set(`${PREFIX}${ticket.code}`, JSON.stringify(ticket), { EX: TTL_SECONDS })
    await redis.sAdd(`${INDEX_PREFIX}${ticket.eventId}`, ticket.code)
    await redis.expire(`${INDEX_PREFIX}${ticket.eventId}`, TTL_SECONDS)
    return true
  } catch {
    return false
  }
}

export async function saveTicket(ticket: ParticipantTicket): Promise<void> {
  // 1. Supabase (persistence officielle)
  if (hasServerSupabaseEnv()) {
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from("event_tickets")
        .upsert(ticketToRow(ticket), { onConflict: "code" })
      if (!error) {
        await saveRedis(ticket)
        return
      }
      console.error("[tickets-store] supabase save error, fallback", error)
    } catch (err) {
      console.error("[tickets-store] supabase save exception", err)
    }
  }

  // 2. Redis
  const redisOk = await saveRedis(ticket)
  if (redisOk) return

  // 3. Memoire
  await saveMemory(ticket)
}

export async function getTicket(code: string): Promise<ParticipantTicket | null> {
  // 1. Supabase
  if (hasServerSupabaseEnv()) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from("event_tickets")
        .select("*")
        .eq("code", code)
        .maybeSingle()
      if (data) return rowToTicket(data)
    } catch {
      /* fallthrough */
    }
  }

  // 2. Redis
  const redis = await getRedis()
  if (redis) {
    try {
      const raw = await redis.get(`${PREFIX}${code}`)
      if (raw) return JSON.parse(raw) as ParticipantTicket
    } catch {
      /* fallthrough */
    }
  }

  // 3. Memoire
  return memoryStore.get(code) ?? null
}

export async function listTicketsForEvent(eventId: string): Promise<ParticipantTicket[]> {
  // 1. Supabase
  if (hasServerSupabaseEnv()) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("event_tickets")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true })
      if (!error && data) return data.map(rowToTicket)
    } catch {
      /* fallthrough */
    }
  }

  // 2. Redis
  const redis = await getRedis()
  if (redis) {
    try {
      const codes = await redis.sMembers(`${INDEX_PREFIX}${eventId}`)
      if (codes.length > 0) {
        const rows = await Promise.all(codes.map((c) => redis.get(`${PREFIX}${c}`)))
        return rows
          .filter((r): r is string => Boolean(r))
          .map((r) => JSON.parse(r) as ParticipantTicket)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      }
    } catch {
      /* fallthrough */
    }
  }

  // 3. Memoire
  const set = memoryIndex.get(eventId)
  if (!set) return []
  return [...set]
    .map((c) => memoryStore.get(c))
    .filter((x): x is ParticipantTicket => Boolean(x))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function updateTicket(
  code: string,
  patch: Partial<ParticipantTicket>,
): Promise<ParticipantTicket | null> {
  const current = await getTicket(code)
  if (!current) return null
  const updated: ParticipantTicket = { ...current, ...patch }
  if (patch.status === "checked_in" && !updated.checkedInAt) {
    updated.checkedInAt = new Date().toISOString()
  }
  await saveTicket(updated)
  return updated
}
