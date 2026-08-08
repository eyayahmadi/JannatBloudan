"use client"

import { dispatchRealtimeRefresh } from "@/lib/realtime/bus"

const MENU_LS_KEYS = ["jb-menu-cache", "jb-delivery-menu", "jb-qr-menu-prefs"]

/** Côté client : purge caches locaux + bus realtime après mutation Admin. */
export function invalidateMenuCacheClient(): void {
  if (typeof window === "undefined") return

  for (const key of MENU_LS_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }

  dispatchRealtimeRefresh("menu")
}
