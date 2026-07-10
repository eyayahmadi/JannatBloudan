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

const RESTORE_THRESHOLD_PX = 24
/** Covers slow image decode on budget Android devices. */
const RESTORE_PASSES_MS = [0, 80, 200, 500, 1000, 1800, 2800] as const
const GUARD_MS = 2800
const USER_SCROLL_COOLDOWN_MS = 450
const JUMP_TO_TOP_DELTA_PX = 280

type ScrollAnchor = {
  productId: string
  offsetTop: number
}

/** Cross-browser scroll position (iOS Safari, Android Chrome, Samsung Internet, WebViews). */
function getScrollTop(): number {
  const vv = window.visualViewport
  if (vv && typeof vv.pageTop === "number" && !Number.isNaN(vv.pageTop)) {
    return vv.pageTop
  }
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
  window.scrollTo({ top: y, left: 0, behavior: "auto" })
  if (Math.abs(getScrollTop() - y) > 3) {
    document.documentElement.scrollTop = y
    document.body.scrollTop = y
  }
  requestAnimationFrame(() => {
    if (Math.abs(getScrollTop() - y) > 4) {
      window.scrollTo({ top: y, left: 0, behavior: "auto" })
    }
  })
}

function getVisibleViewport(): { top: number; height: number } {
  const vv = window.visualViewport
  if (vv) {
    return { top: vv.offsetTop, height: vv.height }
  }
  return { top: 0, height: window.innerHeight }
}

/** Pick the product card closest to upper-third of visible viewport — stable across phone heights. */
function findViewportAnchor(): ScrollAnchor | null {
  const nodes = document.querySelectorAll<HTMLElement>("[data-menu-product-id]")
  const { top: vvTop, height: vh } = getVisibleViewport()
  const anchorLine = vvTop + vh * 0.28

  let best: ScrollAnchor | null = null
  let bestDist = Infinity

  for (const node of nodes) {
    const rect = node.getBoundingClientRect()
    if (rect.bottom <= vvTop || rect.top >= vvTop + vh) continue
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
  if (Math.abs(drift) <= RESTORE_THRESHOLD_PX) return false
  setScrollTop(getScrollTop() + drift)
  return true
}

/**
 * Preserves window scroll during silent menu polling — all mobile browsers.
 * Anchor + scrollY with multi-pass restore for async image loads and URL bar resize.
 */
export function useMenuScrollPreservation() {
  const pendingScrollYRef = useRef<number | null>(null)
  const anchorRef = useRef<ScrollAnchor | null>(null)
  const silentRefreshPendingRef = useRef(false)
  const guardUntilRef = useRef(0)
  const restoreTimersRef = useRef<number[]>([])
  const userScrollingRef = useRef(false)
  const userScrollTimerRef = useRef<number>(0)
  const lastScrollYRef = useRef(0)
  const layoutShiftRafRef = useRef(0)
  const pointerActiveRef = useRef(false)

  const clearRestoreTimers = useCallback(() => {
    for (const id of restoreTimersRef.current) window.clearTimeout(id)
    restoreTimersRef.current = []
  }, [])

  const isGuardActive = useCallback(() => Date.now() <= guardUntilRef.current, [])

  const markUserScrolling = useCallback(() => {
    userScrollingRef.current = true
    window.clearTimeout(userScrollTimerRef.current)
    userScrollTimerRef.current = window.setTimeout(() => {
      if (!pointerActiveRef.current) userScrollingRef.current = false
    }, USER_SCROLL_COOLDOWN_MS)
  }, [])

  const runRestore = useCallback(
    (options?: { force?: boolean }) => {
      if (!options?.force && (userScrollingRef.current || pointerActiveRef.current)) return false
      if (!isGuardActive() && !silentRefreshPendingRef.current) return false

      const saved = pendingScrollYRef.current
      const anchor = anchorRef.current
      let restored = false

      if (anchor) {
        restored = restoreFromAnchor(anchor)
      }

      if (!restored && saved != null) {
        const current = getScrollTop()
        const last = lastScrollYRef.current
        const suddenJumpToTop =
          saved > 160 && current < 96 && last > saved - 160 && last - current >= JUMP_TO_TOP_DELTA_PX

        if (suddenJumpToTop) {
          setScrollTop(saved)
          restored = true
        } else if (Math.abs(current - saved) > RESTORE_THRESHOLD_PX && !userScrollingRef.current) {
          setScrollTop(saved)
          restored = true
        }
      }

      return restored
    },
    [isGuardActive],
  )

  const captureScrollForSilentRefresh = useCallback(() => {
    pendingScrollYRef.current = getScrollTop()
    lastScrollYRef.current = pendingScrollYRef.current
    anchorRef.current = findViewportAnchor()
    silentRefreshPendingRef.current = true
    guardUntilRef.current = Date.now() + GUARD_MS
  }, [])

  const scrollToNavIfNeeded = useCallback(
    (navEl: HTMLElement | null) => {
      if (isGuardActive() || silentRefreshPendingRef.current) return
      if (!navEl) return
      requestAnimationFrame(() => {
        if (isGuardActive() || silentRefreshPendingRef.current) return
        const navTop = navEl.getBoundingClientRect().top + getScrollTop()
        if (getScrollTop() > navTop + 4) setScrollTop(navTop)
      })
    },
    [isGuardActive],
  )

  const scheduleRestorePasses = useCallback(() => {
    clearRestoreTimers()

    const attempt = () => runRestore()

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

  const notifyLayoutShift = useCallback(() => {
    if (!isGuardActive()) return
    if (userScrollingRef.current || pointerActiveRef.current) return
    window.cancelAnimationFrame(layoutShiftRafRef.current)
    layoutShiftRafRef.current = window.requestAnimationFrame(() => {
      runRestore()
    })
  }, [isGuardActive, runRestore])

  useEffect(() => {
    document.documentElement.classList.add("menu-stable-scroll")
    return () => document.documentElement.classList.remove("menu-stable-scroll")
  }, [])

  useEffect(() => {
    lastScrollYRef.current = getScrollTop()

    const onScroll = () => {
      const current = getScrollTop()
      const last = lastScrollYRef.current
      if (Math.abs(current - last) > 2) markUserScrolling()
      lastScrollYRef.current = current

      if (!isGuardActive()) return
      const saved = pendingScrollYRef.current
      if (saved == null || saved < 160) return

      if (current < 96 && last > 320 && last - current >= JUMP_TO_TOP_DELTA_PX) {
        setScrollTop(saved)
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isGuardActive, markUserScrolling])

  useEffect(() => {
    const passive = { passive: true } as const
    const onTouch = () => markUserScrolling()

    const onPointerDown = () => {
      pointerActiveRef.current = true
      markUserScrolling()
    }
    const onPointerUp = () => {
      pointerActiveRef.current = false
      markUserScrolling()
    }

    window.addEventListener("touchstart", onTouch, passive)
    window.addEventListener("touchmove", onTouch, passive)
    window.addEventListener("wheel", onTouch, passive)
    window.addEventListener("pointerdown", onPointerDown, passive)
    window.addEventListener("pointerup", onPointerUp, passive)
    window.addEventListener("pointercancel", onPointerUp, passive)

    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
        markUserScrolling()
      }
    }
    window.addEventListener("keydown", onKey)

    const scrollEnd = () => {
      window.setTimeout(() => {
        if (!pointerActiveRef.current) userScrollingRef.current = false
      }, 120)
    }
    window.addEventListener("scrollend", scrollEnd)

    return () => {
      window.removeEventListener("touchstart", onTouch)
      window.removeEventListener("touchmove", onTouch)
      window.removeEventListener("wheel", onTouch)
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("scrollend", scrollEnd)
      window.clearTimeout(userScrollTimerRef.current)
    }
  }, [markUserScrolling])

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
    const onVvChange = () => {
      if (!isGuardActive() || userScrollingRef.current || pointerActiveRef.current) return
      runRestore()
    }
    vv.addEventListener("resize", onVvChange)
    vv.addEventListener("scroll", onVvChange)
    return () => {
      vv.removeEventListener("resize", onVvChange)
      vv.removeEventListener("scroll", onVvChange)
    }
  }, [isGuardActive, runRestore])

  useEffect(() => {
    const targets = document.querySelectorAll("main, [data-menu-scroll-list]")
    if (targets.length === 0 || typeof ResizeObserver === "undefined") return
    let raf = 0
    const ro = new ResizeObserver(() => {
      if (!isGuardActive() || userScrollingRef.current) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => runRestore())
    })
    targets.forEach((el) => ro.observe(el))
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [isGuardActive, runRestore])

  useEffect(
    () => () => {
      clearRestoreTimers()
      window.cancelAnimationFrame(layoutShiftRafRef.current)
    },
    [clearRestoreTimers],
  )

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
