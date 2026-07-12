import type { SupabaseClient } from "@supabase/supabase-js"

/** DB + UI status for tables awaiting cleaning after payment/close. */
export const NEEDS_CLEANING_STATUS = "CLEANING" as const

export const CLEANING_LABELS = {
  fr: "À nettoyer",
  de: "Zu reinigen",
  en: "Needs cleaning",
  ar: "تحتاج تنظيف",
  emoji: "🧹",
} as const

export const MARK_CLEANED_LABELS = {
  fr: "Table nettoyée",
  de: "Tisch gereinigt",
  en: "Table cleaned",
  ar: "تم تنظيف الطاولة",
} as const

export function isNeedsCleaningStatus(status: string | null | undefined): boolean {
  const s = String(status ?? "").toUpperCase()
  return s === "CLEANING" || s === "NEEDS_CLEANING"
}

export function isTableAvailableForNewSession(status: string | null | undefined): boolean {
  const s = String(status ?? "").toUpperCase()
  return s === "FREE" || s === "" || s === "LIBRE"
}

/**
 * After payment or session close: close session, mark linked tables CLEANING (not FREE).
 * Preserves session + order history in DB.
 */
export async function transitionSessionToNeedsCleaning(
  supabase: SupabaseClient,
  sessionId: string,
  opts?: { closeSession?: boolean },
): Promise<{ tableIds: number[] }> {
  const now = new Date().toISOString()
  const closeSession = opts?.closeSession !== false

  if (closeSession) {
    await supabase
      .from("table_sessions")
      .update({ closed_at: now, paid: true })
      .eq("id", sessionId)
      .is("closed_at", null)
  }

  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id")
    .eq("current_session_id", sessionId)

  const tableIds = (tables ?? [])
    .map((t) => Number((t as { id?: number }).id))
    .filter((id) => Number.isFinite(id) && id > 0)

  if (tableIds.length > 0) {
    await supabase
      .from("restaurant_tables")
      .update({
        status: NEEDS_CLEANING_STATUS,
        cleaning_since: now,
        current_session_id: null,
        last_activity: now,
      })
      .in("id", tableIds)
  }

  return { tableIds }
}

/** @deprecated Use transitionSessionToNeedsCleaning — kept for call-site clarity. */
export async function markTablesNeedCleaningForSession(
  supabase: SupabaseClient,
  sessionId: string,
) {
  return transitionSessionToNeedsCleaning(supabase, sessionId, { closeSession: false })
}

/**
 * Staff confirmed cleaning — table becomes FREE and available for new guests.
 */
export async function markTableCleaned(
  supabase: SupabaseClient,
  tableId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: row, error: fetchErr } = await supabase
    .from("restaurant_tables")
    .select("id, status, current_session_id")
    .eq("id", tableId)
    .maybeSingle()

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? "Table introuvable" }
  }

  const status = String((row as { status?: string }).status ?? "")
  if (!isNeedsCleaningStatus(status)) {
    return { ok: false, error: "La table n'est pas en attente de nettoyage" }
  }

  const now = new Date().toISOString()
  const { error: upErr } = await supabase
    .from("restaurant_tables")
    .update({
      status: "FREE",
      cleaning_since: null,
      current_session_id: null,
      last_activity: now,
    })
    .eq("id", tableId)

  if (upErr) return { ok: false, error: upErr.message }
  return { ok: true }
}

export function elapsedCleaningWait(cleaningSince: string | null | undefined, nowMs = Date.now()): number {
  if (!cleaningSince) return 0
  const start = Date.parse(cleaningSince)
  if (!Number.isFinite(start)) return 0
  return Math.max(0, Math.floor((nowMs - start) / 1000))
}

export function formatCleaningElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
