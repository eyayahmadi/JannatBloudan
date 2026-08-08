"use client"

import { useLayoutEffect, useRef } from "react"
import { acquireBodyScrollLock, type BodyScrollLockMode } from "@/lib/mobile/body-scroll-lock"

export type UseBodyScrollLockOptions = {
  /** `fixed` restores scroll position; `overflow` only hides scrollbars (portaled UI stays tappable). */
  mode?: BodyScrollLockMode
  htmlClass?: string | string[]
  blockTouch?: boolean
}

/**
 * Locks document scroll while a modal/drawer is open.
 * Reference-counted — safe with multiple overlays.
 */
export function useBodyScrollLock(locked: boolean, options: UseBodyScrollLockOptions = {}) {
  const optionsRef = useRef(options)
  optionsRef.current = options

  useLayoutEffect(() => {
    if (!locked) return

    const handle = acquireBodyScrollLock({
      mode: optionsRef.current.mode ?? "fixed",
      htmlClass: optionsRef.current.htmlClass ?? "menu-modal-open",
      blockTouch: optionsRef.current.blockTouch,
    })

    return () => handle.release()
  }, [locked])
}
