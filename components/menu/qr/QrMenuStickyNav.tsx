"use client"

import {
  useLayoutEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
  type Ref,
} from "react"
import { cn } from "@/lib/utils"

type QrMenuStickyNavProps = {
  search: ReactNode
  className?: string
  navRef?: Ref<HTMLDivElement>
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return
  if (typeof ref === "function") {
    ref(value)
    return
  }
  ;(ref as MutableRefObject<T | null>).current = value
}

/** Sticky search bar — sits below hero, never overlaps logo/title. */
export function QrMenuStickyNav({ search, className, navRef }: QrMenuStickyNavProps) {
  const stackRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = stackRef.current
    if (!root) return

    const setVars = () => {
      const searchH = searchRef.current?.offsetHeight ?? 0
      root.style.setProperty("--menu-sticky-search-h", `${searchH}px`)
      root.style.setProperty("--menu-sticky-total-h", `${searchH}px`)
      document.documentElement.style.setProperty("--menu-sticky-total-h", `${searchH}px`)
    }

    setVars()

    const ro = new ResizeObserver(setVars)
    if (searchRef.current) ro.observe(searchRef.current)
    window.addEventListener("resize", setVars, { passive: true })

    return () => {
      ro.disconnect()
      window.removeEventListener("resize", setVars)
      document.documentElement.style.removeProperty("--menu-sticky-total-h")
    }
  }, [])

  const setStackRef = (el: HTMLDivElement | null) => {
    stackRef.current = el
    assignRef(navRef, el)
  }

  return (
    <div ref={setStackRef} data-menu-sticky-nav className={cn("menu-sticky-stack menu-sticky-stack--search-only", className)}>
      <div ref={searchRef} data-menu-sticky-search className="menu-sticky-stack__row menu-sticky-stack__search">
        <div className="menu-sticky-stack__inner">{search}</div>
      </div>
    </div>
  )
}
