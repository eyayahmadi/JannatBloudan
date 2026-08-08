"use client"

import { memo, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AlertCircle } from "lucide-react"

/** Fixed-position toast — portal, no enter animation on parent rerender. */
export const StationBoardToast = memo(function StationBoardToast({
  message,
}: {
  message: string | null
}) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPortalRoot(document.body)
  }, [])

  if (!portalRoot || !message) return null

  return createPortal(
    <div
      className="pointer-events-none fixed end-4 top-20 z-toast-layer w-[min(20rem,calc(100%-2rem))] rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 shadow-lg dark:border-amber-700 dark:bg-amber-950"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
        <span className="min-w-0">{message}</span>
      </div>
    </div>,
    portalRoot,
  )
})
