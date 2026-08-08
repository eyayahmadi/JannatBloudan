"use client"

import { dispatchRealtimeRefresh } from "@/lib/realtime/bus"

const MENU_LS_KEYS = ["jb-menu-cache", "jb-delivery-menu", "jb-qr-menu-prefs"]

function purgeMenuLocalStorage(): void {
  for (const key of MENU_LS_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith("jb-menu") || key?.startsWith("jb-delivery-menu")) {
        localStorage.removeItem(key)
      }
    }
  } catch {
    /* ignore */
  }
}

/** Côté client : purge caches locaux + bus realtime après mutation Admin. */
export function invalidateMenuCacheClient(): void {
  if (typeof window === "undefined") return

  purgeMenuLocalStorage()
  dispatchRealtimeRefresh("menu")
}
