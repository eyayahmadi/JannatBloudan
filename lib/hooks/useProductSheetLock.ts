"use client"

import { useLayoutEffect } from "react"
import {
  getSavedProductSheetScroll,
  restoreProductSheetScroll,
} from "@/lib/menu/product-sheet-scroll"

/**
 * Android-safe full-viewport sheet lock.
 * Portal sheet must use fixed inset-0 + 100dvh; background must not scroll or repaint.
 */
export function useProductSheetLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked || typeof document === "undefined") return

    const scrollY = getSavedProductSheetScroll() || window.scrollY
    const { body, documentElement: html } = document

    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
      bodyTouchAction: body.style.touchAction,
      htmlOverflow: html.style.overflow,
    }

    html.classList.add("menu-modal-open", "menu-product-sheet-open")
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"
    body.style.height = "100%"
    body.style.touchAction = "none"

    return () => {
      html.classList.remove("menu-modal-open", "menu-product-sheet-open")
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      body.style.position = prev.bodyPosition
      body.style.top = prev.bodyTop
      body.style.left = prev.bodyLeft
      body.style.right = prev.bodyRight
      body.style.width = prev.bodyWidth
      body.style.height = prev.bodyHeight
      body.style.touchAction = prev.bodyTouchAction
      restoreProductSheetScroll()
    }
  }, [locked])
}
