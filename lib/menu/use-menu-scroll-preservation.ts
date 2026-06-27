"use client"

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react"

const RESTORE_THRESHOLD_PX = 20
/** Delayed passes cover mobile image decode / lazy load after silent polling. */
const RESTORE_PASSES_MS = [0, 50, 150, 350, 700, 1200, 2000] as const
const GUARD_MS = 2500

type ScrollAnchor = {
  productId: string
  offsetTop: number
}

function getScrollTop(): number {
  return window.scrollY || document.documentElement.scrollTop || 0
}

function findViewportAnchor(): ScrollAnchor | null {
  const nodes = document.querySelectorAll<HTMLElement>("[data-menu-product-id]")
  const vh = window.visualViewport?.height ?? window.innerHeight
  for (const node of nodes) {
    const rect = node.getBoundingClientRect()
    if (rect.bottom <= 0 || rect.top >= vh) continue
    const id = node.getAttribute("data-menu-product-id")
    if (id) return { productId: id, offsetTop: rect.top }
  }
  return null
}

function restoreFromAnchor(anchor: ScrollAnchor): boolean {
  const el = document.querySelector<HTMLElement>(
    `[data-menu-product-id="${CSS.escape(anchor.productId)}"]`,
  )
  if (!el) return false
  const drift = el.getBoundingClientRect().top - anchor.offsetTop
  if (Math.abs(drift) <= RESTORE_THRESHOLD_PX) return false
  window.scrollBy({ top: drift, left: 0, behavior: "auto" })
  return true
}

/**
 * Preserves window scroll during silent menu polling (mobile Safari / Chrome).
 * Uses element anchor + scrollY with multi-pass restore for async image loads.
 */
export function useMenuScrollPreservation() {
  const pendingScrollYRef = useRef<number | null>(null)
  const anchorRef = useRef<ScrollAnchor | null>(null)
  const silentRefreshPendingRef = useRef(false)
  const guardUntilRef = useRef(0)
  const restoreTimersRef = useRef<number[]>([])

  const clearRestoreTimers = useCallback(() => {
    for (const id of restoreTimersRef.current) window.clearTimeout(id)
    restoreTimersRef.current = []
  }, [])

  const isGuardActive = useCallback(() => Date.now() <= guardUntilRef.current, [])

  const runRestore = useCallback(() => {
    if (!isGuardActive() && !silentRefreshPendingRef.current) return false

    const saved = pendingScrollYRef.current
    const anchor = anchorRef.current
    let restored = false

    if (anchor) {
      restored = restoreFromAnchor(anchor)
    }

    if (!restored && saved != null) {
      const current = getScrollTop()
      if (saved > 200 && current < 80) {
        window.scrollTo({ top: saved, left: 0, behavior: "auto" })
        restored = true
      } else if (Math.abs(current - saved) > RESTORE_THRESHOLD_PX) {
        window.scrollTo({ top: saved, left: 0, behavior: "auto" })
        restored = true
      }
    }

    return restored
  }, [isGuardActive])

  const captureScrollForSilentRefresh = useCallback(() => {
    pendingScrollYRef.current = getScrollTop()
    anchorRef.current = findViewportAnchor()
    silentRefreshPendingRef.current = true
    guardUntilRef.current = Date.now() + GUARD_MS
  }, [])

  const scrollToNavIfNeeded = useCallback((navEl: HTMLElement | null) => {
    if (isGuardActive()) return
    if (!navEl) return
    const navTop = navEl.getBoundingClientRect().top + getScrollTop()
    if (getScrollTop() > navTop + 4) {
      window.scrollTo({ top: navTop, behavior: "smooth" })
    }
  }, [isGuardActive])

  const scheduleRestorePasses = useCallback(() => {
    clearRestoreTimers()

    const attempt = () => {
      runRestore()
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(attempt)
    })

    for (const delay of RESTORE_PASSES_MS) {
      if (delay === 0) continue
      restoreTimersRef.current.push(window.setTimeout(attempt, delay))
    }

    restoreTimersRef.current.push(
      window.setTimeout(() => {
        silentRefreshPendingRef.current = false
        pendingScrollYRef.current = null
        anchorRef.current = null
      }, GUARD_MS),
    )
  }, [clearRestoreTimers, runRestore])

  const consumeSilentScrollRestore = useCallback(() => {
    if (!silentRefreshPendingRef.current) return
    scheduleRestorePasses()
  }, [scheduleRestorePasses])

  /** Call when an image or skeleton finishes loading and may shift layout. */
  const notifyLayoutShift = useCallback(() => {
    if (!isGuardActive()) return
    runRestore()
  }, [isGuardActive, runRestore])

  useEffect(() => {
    const onScroll = () => {
      if (!isGuardActive()) return
      const saved = pendingScrollYRef.current
      if (saved == null || saved < 200) return
      if (getScrollTop() < 80) {
        window.scrollTo({ top: saved, left: 0, behavior: "auto" })
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isGuardActive])

  useEffect(() => {
    const prev = history.scrollRestoration
    history.scrollRestoration = "manual"
    return () => {
      history.scrollRestoration = prev
    }
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      if (!isGuardActive()) return
      runRestore()
    }
    vv.addEventListener("resize", onResize)
    vv.addEventListener("scroll", onResize)
    return () => {
      vv.removeEventListener("resize", onResize)
      vv.removeEventListener("scroll", onResize)
    }
  }, [isGuardActive, runRestore])

  useEffect(() => () => clearRestoreTimers(), [clearRestoreTimers])

  return {
    captureScrollForSilentRefresh,
    scrollToNavIfNeeded,
    consumeSilentScrollRestore,
    notifyLayoutShift,
    silentRefreshPendingRef,
  }
}

/** Restore scroll after React commits silent menu data (layout effect). */
export function useSilentScrollRestore(
  listVersion: unknown,
  consumeSilentScrollRestore: () => void,
  silentRefreshPendingRef: MutableRefObject<boolean>,
) {
  useLayoutEffect(() => {
    if (!silentRefreshPendingRef.current) return
    consumeSilentScrollRestore()
  }, [listVersion, consumeSilentScrollRestore, silentRefreshPendingRef])
}

const MenuScrollGuardContext = createContext<(() => void) | null>(null)

export function MenuScrollGuardProvider({
  notifyLayoutShift,
  children,
}: {
  notifyLayoutShift: () => void
  children: ReactNode
}) {
  return createElement(MenuScrollGuardContext.Provider, { value: notifyLayoutShift }, children)
}

export function useMenuScrollGuardNotify(): (() => void) | null {
  return useContext(MenuScrollGuardContext)
}
