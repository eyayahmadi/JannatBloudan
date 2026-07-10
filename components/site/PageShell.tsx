"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useAdminPortalOptional } from "@/components/admin/admin-portal-context"

type PageShellProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  grain?: boolean
  /**
   * Menu / QR pages: plain document scroll for all phones (Moto, generic Android, iOS).
   * Avoids flex + min-h-dvh traps that freeze scroll on budget WebViews.
   */
  stableViewport?: boolean
}

export function PageShell({
  children,
  className,
  contentClassName,
  grain = true,
  stableViewport = false,
}: PageShellProps) {
  const portal = useAdminPortalOptional()

  if (portal?.suppressPageChrome) {
    return (
      <div className={cn("w-full max-w-full", className)} id="main-content">
        {children}
      </div>
    )
  }

  /** Menu routes: single block wrapper — native window scroll only. */
  if (stableViewport) {
    return (
      <div
        id="main-content"
        tabIndex={-1}
        className={cn(
          "menu-page-root relative scroll-mt-24 bg-[color:var(--lux-cream)] focus:outline-none dark:bg-neutral-950",
          className,
          contentClassName,
        )}
      >
        {children}
      </div>
    )
  }

  const minH = "min-h-screen min-h-dvh"

  return (
    <div
      className={cn(
        "relative mesh-page-bg overflow-x-hidden",
        minH,
        grain && "grain-overlay",
        className,
      )}
    >
      <div
        id="main-content"
        tabIndex={-1}
        className={cn(
          "relative z-[2] flex flex-col scroll-mt-24 focus:outline-none",
          minH,
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
