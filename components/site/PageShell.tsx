"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useAdminPortalOptional } from "@/components/admin/admin-portal-context"

type PageShellProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  grain?: boolean
}

/**
 * Conteneur racine pour les pages publiques.
 * - mesh-page-bg : fond doux à dégradés multiples
 * - grain-overlay : grain subtil
 * - id="main-content" : ancre pour le skip-link a11y du Header
 *
 * Dans le portail admin, le chrome externe est fourni par `AdminPortalShell` :
 * on rend un conteneur léger pour éviter double fond / double min-height.
 */
export function PageShell({ children, className, contentClassName, grain = true }: PageShellProps) {
  const portal = useAdminPortalOptional()

  if (portal?.suppressPageChrome) {
    return (
      <div className={cn("w-full max-w-full", className)} id="main-content">
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative min-h-screen min-h-dvh mesh-page-bg overflow-x-hidden",
        grain && "grain-overlay",
        className,
      )}
    >
      <div
        id="main-content"
        tabIndex={-1}
        className={cn(
          "relative z-[2] flex min-h-screen min-h-dvh flex-col scroll-mt-24 focus:outline-none",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
