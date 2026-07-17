"use client"

import { useLayoutEffect } from "react"

/**
 * Locks document scroll while a modal/sheet is open.
 * Restores scroll position on close (required for Android Chrome).
 */
export function useBodyScrollLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked || typeof document === "undefined") return

    const scrollY = window.scrollY
    const { body, documentElement: html } = document

    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyTouchAction: body.style.touchAction,
      htmlOverflow: html.style.overflow,
    }

    html.classList.add("menu-modal-open")
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.width = "100%"
    body.style.touchAction = "none"

    return () => {
      html.classList.remove("menu-modal-open")
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      body.style.position = prev.bodyPosition || "static"
      body.style.top = prev.bodyTop
      body.style.width = prev.bodyWidth
      body.style.touchAction = prev.bodyTouchAction || "auto"
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}
