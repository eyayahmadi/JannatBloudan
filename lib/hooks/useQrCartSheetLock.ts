"use client"

import { useLayoutEffect } from "react"
import { acquireBodyScrollLock } from "@/lib/mobile/body-scroll-lock"

/**
 * QR cart sheet: overflow-only lock — background does not scroll,
 * but portaled sheet buttons remain tappable (no body touch-action:none).
 */
export function useQrCartSheetLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked) return

    const handle = acquireBodyScrollLock({
      mode: "overflow",
      htmlClass: "qr-cart-sheet-open",
      blockTouch: false,
    })

    return () => handle.release()
  }, [locked])
}
