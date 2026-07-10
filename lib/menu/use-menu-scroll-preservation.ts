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

/**
 * Menu scroll helper — polling skip is handled in loadMenu/load.
 * No programmatic scroll on touch devices (fixes frozen screen on Moto / generic Android).
 */
export function useMenuScrollPreservation() {
  const silentRefreshPendingRef = useRef(false)

  const captureScrollForSilentRefresh = useCallback(() => {
    silentRefreshPendingRef.current = true
  }, [])

  const scrollToNavIfNeeded = useCallback((navEl: HTMLElement | null) => {
    if (!navEl) return
    requestAnimationFrame(() => {
      const y = window.scrollY || document.documentElement.scrollTop || 0
      const navTop = navEl.getBoundingClientRect().top + y
      if (y > navTop + 4) {
        window.scrollTo(0, navTop)
      }
    })
  }, [])

  const consumeSilentScrollRestore = useCallback(() => {
    silentRefreshPendingRef.current = false
  }, [])

  const notifyLayoutShift = useCallback(() => {
    /* intentionally empty — never fight native scroll */
  }, [])

  useEffect(() => {
    document.documentElement.classList.add("menu-stable-scroll")
    return () => document.documentElement.classList.remove("menu-stable-scroll")
  }, [])

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
