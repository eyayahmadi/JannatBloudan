/** Lightweight menu telemetry — never throws, never blocks UX. */
export type MenuTelemetryEvent =
  | "image_load_failed"
  | "menu_poll_failed"
  | "menu_fetch_failed"
  | "recommendation_lookup_failed"

export function logMenuTelemetry(
  event: MenuTelemetryEvent,
  detail?: Record<string, unknown>,
): void {
  try {
    const payload = { event, ts: new Date().toISOString(), ...detail }
    if (typeof window !== "undefined") {
      console.warn("[menu]", payload)
    } else {
      console.warn("[menu]", JSON.stringify(payload))
    }
  } catch {
    /* ignore logging failures */
  }
}
