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
  categoryNav?: ReactNode
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

/** Sticky toolbar: search + category navigation. */
export function QrMenuStickyNav({ search, categoryNav, className, navRef }: QrMenuStickyNavProps) {
  const stackRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = stackRef.current
    if (!root) return

    const setVars = () => {
      const searchH = searchRef.current?.offsetHeight ?? 0
      const catH = catRef.current?.offsetHeight ?? 0
      const total = searchH + catH

      root.style.setProperty("--menu-sticky-search-h", `${searchH}px`)
      root.style.setProperty("--menu-sticky-cat-h", `${catH}px`)
      root.style.setProperty("--menu-sticky-total-h", `${total}px`)
      document.documentElement.style.setProperty("--menu-sticky-total-h", `${total}px`)
    }

    setVars()

    const ro = new ResizeObserver(setVars)
    for (const ref of [searchRef, catRef]) {
      if (ref.current) ro.observe(ref.current)
    }
    window.addEventListener("resize", setVars, { passive: true })

    return () => {
      ro.disconnect()
      window.removeEventListener("resize", setVars)
      document.documentElement.style.removeProperty("--menu-sticky-total-h")
    }
  }, [categoryNav])

  const setStackRef = (el: HTMLDivElement | null) => {
    stackRef.current = el
    assignRef(navRef, el)
  }

  return (
    <div
      ref={setStackRef}
      data-menu-sticky-nav
      className={cn("menu-sticky-stack", !categoryNav && "menu-sticky-stack--search-only", className)}
    >
      <div ref={searchRef} data-menu-sticky-search className="menu-sticky-stack__row menu-sticky-stack__search">
        <div className="menu-sticky-stack__inner">{search}</div>
      </div>
      {categoryNav ? (
        <div ref={catRef} data-menu-sticky-cat className="menu-sticky-stack__row menu-sticky-stack__cat">
          <div className="menu-sticky-stack__inner menu-sticky-stack__inner--cat">{categoryNav}</div>
        </div>
      ) : null}
    </div>
  )
}
