"use client"

import { useLayoutEffect } from "react"

/**
 * QR cart sheet: lock background scroll without disabling touch on the portaled sheet.
 * Avoids useBodyScrollLock (body touch-action:none breaks mobile checkout taps).
 */
export function useQrCartSheetLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked || typeof document === "undefined") return

    const { body, documentElement: html } = document
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
    }

    html.classList.add("qr-cart-sheet-open")
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"

    return () => {
      html.classList.remove("qr-cart-sheet-open")
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
    }
  }, [locked])
}
