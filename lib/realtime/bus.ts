/** Bus léger pour synchroniser les hooks après événements Supabase Realtime. */

export type RealtimeScope = "orders" | "tables" | "stations" | "menu" | "alerts" | "all"

export const REALTIME_REFRESH = "jb:realtime:refresh"
export const REALTIME_STATUS = "jb:realtime:status"

export type RealtimeConnectionStatus = "connecting" | "live" | "polling"

let currentStatus: RealtimeConnectionStatus = "connecting"

export function setRealtimeStatus(status: RealtimeConnectionStatus) {
  if (typeof window === "undefined") return
  currentStatus = status
  window.dispatchEvent(new CustomEvent(REALTIME_STATUS, { detail: { status } }))
}

export function getRealtimeStatus(): RealtimeConnectionStatus {
  return currentStatus
}

export function onRealtimeStatus(
  handler: (status: RealtimeConnectionStatus) => void,
): () => void {
  if (typeof window === "undefined") return () => {}
  const listener = (e: Event) => {
    const status = (e as CustomEvent<{ status?: RealtimeConnectionStatus }>).detail?.status
    if (status) handler(status)
  }
  window.addEventListener(REALTIME_STATUS, listener)
  return () => window.removeEventListener(REALTIME_STATUS, listener)
}

export function dispatchRealtimeRefresh(scope: RealtimeScope = "all") {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(REALTIME_REFRESH, { detail: { scope } }))
}

export function onRealtimeRefresh(
  handler: (scope: RealtimeScope) => void,
): () => void {
  if (typeof window === "undefined") return () => {}
  const listener = (e: Event) => {
    const scope = (e as CustomEvent<{ scope?: RealtimeScope }>).detail?.scope ?? "all"
    handler(scope)
  }
  window.addEventListener(REALTIME_REFRESH, listener)
  return () => window.removeEventListener(REALTIME_REFRESH, listener)
}

export function scopeMatches(wanted: RealtimeScope | RealtimeScope[], incoming: RealtimeScope) {
  if (incoming === "all") return true
  const list = Array.isArray(wanted) ? wanted : [wanted]
  return list.includes(incoming) || list.includes("all")
}
