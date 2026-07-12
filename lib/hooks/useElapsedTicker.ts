"use client"

import { useEffect, useState } from "react"

/** Re-renders every second so service-request timers stay live on floor plans. */
export function useElapsedTicker(enabled = true, intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [enabled, intervalMs])

  return now
}
