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
  vipSeats: number
  groupPackages: number
  unitPriceAdult: number
  unitPriceChild: number
  totalAmount: number
  paid: boolean
  paymentMethod: "stripe" | "cash_at_venue" | "card_at_venue"
  paymentStatus: "pending" | "authorized" | "paid" | "refunded"
  holdExpiresAt?: string
  linkedTableSessionId?: string | null
  cancelledAt?: string | null
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

function coerceTicket(parsed: ParticipantTicket): ParticipantTicket {
  return {
    ...parsed,
    vipSeats: parsed.vipSeats ?? 0,
    groupPackages: parsed.groupPackages ?? 0,
    paymentMethod: parsed.paymentMethod ?? "stripe",
    paymentStatus: parsed.paymentStatus ?? (parsed.paid ? "paid" : "pending"),
    linkedTableSessionId: parsed.linkedTableSessionId ?? null,
    cancelledAt: parsed.cancelledAt ?? null,
  }
}

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
    vipSeats: Number(row.vip_seats ?? 0),
    groupPackages: Number(row.group_packages ?? 0),
    unitPriceAdult: Number(row.unit_price_adult ?? 0),
    unitPriceChild: Number(row.unit_price_child ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
    paid: Boolean(row.paid),
    paymentMethod: normalizePaymentMethod(row.payment_method),
    paymentStatus: normalizePaymentStatus(row.payment_status, Boolean(row.paid)),
    holdExpiresAt: row.hold_expires_at ?? undefined,
    linkedTableSessionId: row.linked_table_session_id ?? null,
    cancelledAt: row.cancelled_at ?? null,
    status: row.status,
    createdAt: row.created_at,
    checkedInAt: row.checked_in_at ?? undefined,
    specialRequests: row.special_requests ?? undefined,
  }
}

function normalizePaymentMethod(raw: unknown): ParticipantTicket["paymentMethod"] {
  const s = String(raw ?? "").toLowerCase()
  if (s === "cash_at_venue") return "cash_at_venue"
  if (s === "card_at_venue") return "card_at_venue"
  return "stripe"
}

function normalizePaymentStatus(raw: unknown, paid: boolean): ParticipantTicket["paymentStatus"] {
  const s = String(raw ?? "").toLowerCase()
  if (s === "authorized") return "authorized"
  if (s === "refunded") return "refunded"
  if (s === "paid" || paid) return "paid"
  return "pending"
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
    vip_seats: t.vipSeats ?? 0,
    group_packages: t.groupPackages ?? 0,
    unit_price_adult: t.unitPriceAdult,
    unit_price_child: t.unitPriceChild,
    total_amount: t.totalAmount,
    paid: t.paid,
    payment_method: t.paymentMethod,
    payment_status: t.paymentStatus,
    hold_expires_at: t.holdExpiresAt ?? null,
    linked_table_session_id: t.linkedTableSessionId ?? null,
    cancelled_at: t.cancelledAt ?? null,
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
      if (raw) return coerceTicket(JSON.parse(raw) as ParticipantTicket)
    } catch {
      /* fallthrough */
    }
  }

  // 3. Memoire
  return memoryStore.get(code) ? coerceTicket(memoryStore.get(code)!) : null
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
          .map((r) => coerceTicket(JSON.parse(r) as ParticipantTicket))
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
    .map(coerceTicket)
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
  if (patch.status === "cancelled" && !updated.cancelledAt) {
    updated.cancelledAt = new Date().toISOString()
  }
  if ((patch.paymentStatus === "paid" || patch.paid === true) && patch.paymentStatus !== "refunded") {
    updated.paid = true
    updated.paymentStatus = "paid"
  }
  await saveTicket(updated)
  return updated
}
