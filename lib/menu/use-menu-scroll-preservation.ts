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

const ANCHOR_DRIFT_PX = 32
/** Only recover when the page jumped to the top by accident (not slow user scroll-up). */
const JUMP_TO_TOP_MIN_SAVED = 180
const JUMP_TO_TOP_MAX_CURRENT = 120

type ScrollAnchor = {
  productId: string
  offsetTop: number
}

function getScrollTop(): number {
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  )
}

function setScrollTop(top: number): void {
  const y = Math.max(0, Math.round(top))
  try {
    window.scrollTo(0, y)
  } catch {
    document.documentElement.scrollTop = y
    document.body.scrollTop = y
  }
}

function findViewportAnchor(): ScrollAnchor | null {
  const nodes = document.querySelectorAll<HTMLElement>("[data-menu-product-id]")
  const vh = window.innerHeight
  const anchorLine = vh * 0.3

  let best: ScrollAnchor | null = null
  let bestDist = Infinity

  for (const node of nodes) {
    const rect = node.getBoundingClientRect()
    if (rect.bottom <= 0 || rect.top >= vh) continue
    const id = node.getAttribute("data-menu-product-id")
    if (!id) continue
    const mid = rect.top + rect.height * 0.35
    const dist = Math.abs(mid - anchorLine)
    if (dist < bestDist) {
      bestDist = dist
      best = { productId: id, offsetTop: rect.top }
    }
  }
  return best
}

function restoreFromAnchor(anchor: ScrollAnchor): boolean {
  const el = document.querySelector<HTMLElement>(
    `[data-menu-product-id="${CSS.escape(anchor.productId)}"]`,
  )
  if (!el) return false
  const drift = el.getBoundingClientRect().top - anchor.offsetTop
  if (Math.abs(drift) <= ANCHOR_DRIFT_PX) return false
  setScrollTop(getScrollTop() + drift)
  return true
}

/**
 * Minimal scroll preservation for silent menu polling.
 * Never fights user touch scroll — only fixes accidental jump-to-top after data refresh.
 */
export function useMenuScrollPreservation() {
  const pendingRef = useRef<{ scrollY: number; anchor: ScrollAnchor | null } | null>(null)
  const silentRefreshPendingRef = useRef(false)
  const layoutShiftTimerRef = useRef<number>(0)

  const clearPending = useCallback(() => {
    pendingRef.current = null
    silentRefreshPendingRef.current = false
    window.clearTimeout(layoutShiftTimerRef.current)
  }, [])

  const captureScrollForSilentRefresh = useCallback(() => {
    pendingRef.current = {
      scrollY: getScrollTop(),
      anchor: findViewportAnchor(),
    }
    silentRefreshPendingRef.current = true
  }, [])

  const runOneRestore = useCallback(() => {
    const saved = pendingRef.current
    if (!saved) return

    const current = getScrollTop()
    const jumpedToTop =
      saved.scrollY >= JUMP_TO_TOP_MIN_SAVED && current <= JUMP_TO_TOP_MAX_CURRENT

    if (jumpedToTop) {
      setScrollTop(saved.scrollY)
      clearPending()
      return
    }

    if (saved.anchor && restoreFromAnchor(saved.anchor)) {
      clearPending()
    }
  }, [clearPending])

  const consumeSilentScrollRestore = useCallback(() => {
    if (!silentRefreshPendingRef.current || !pendingRef.current) return
    requestAnimationFrame(() => {
      runOneRestore()
      window.setTimeout(() => {
        if (silentRefreshPendingRef.current) runOneRestore()
        clearPending()
      }, 120)
    })
  }, [runOneRestore, clearPending])

  const scrollToNavIfNeeded = useCallback((navEl: HTMLElement | null) => {
    if (!navEl || silentRefreshPendingRef.current) return
    requestAnimationFrame(() => {
      const navTop = navEl.getBoundingClientRect().top + getScrollTop()
      if (getScrollTop() > navTop + 4) setScrollTop(navTop)
    })
  }, [])

  /** Debounced — only during pending silent refresh, never blocks user scroll. */
  const notifyLayoutShift = useCallback(() => {
    if (!pendingRef.current) return
    window.clearTimeout(layoutShiftTimerRef.current)
    layoutShiftTimerRef.current = window.setTimeout(() => {
      runOneRestore()
    }, 80)
  }, [runOneRestore])

  useEffect(() => {
    document.documentElement.classList.add("menu-stable-scroll")
    return () => document.documentElement.classList.remove("menu-stable-scroll")
  }, [])

  /** Any touch = user owns scroll; cancel all programmatic restore. */
  useEffect(() => {
    const opts = { passive: true } as const
    const onUserScroll = () => clearPending()
    window.addEventListener("touchstart", onUserScroll, opts)
    window.addEventListener("touchmove", onUserScroll, opts)
    window.addEventListener("wheel", onUserScroll, opts)
    return () => {
      window.removeEventListener("touchstart", onUserScroll)
      window.removeEventListener("touchmove", onUserScroll)
      window.removeEventListener("wheel", onUserScroll)
      window.clearTimeout(layoutShiftTimerRef.current)
    }
  }, [clearPending])

  return {
    captureScrollForSilentRefresh,
    scrollToNavIfNeeded,
    consumeSilentScrollRestore,
    notifyLayoutShift,
    silentRefreshPendingRef,
  }
}

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
