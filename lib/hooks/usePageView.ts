"use client"

import { useEffect } from "react"
import { track } from "./useTrack"

function getDeviceType() {
  if (typeof window === "undefined") return "unknown"
  const w = window.innerWidth
  if (w < 768) return "mobile"
  if (w < 1024) return "tablet"
  return "desktop"
}

export function usePageView(pageName: string) {
  useEffect(() => {
    track("page_view", {
      page: pageName,
      device: getDeviceType(),
      referrer: document.referrer || "direct",
    })
  }, [pageName])
}
