"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const scrollY = window.scrollY
    const { style: htmlStyle } = document.documentElement
    const { style: bodyStyle } = document.body

    const prev = {
      htmlOverflow: htmlStyle.overflow,
      bodyOverflow: bodyStyle.overflow,
      bodyPosition: bodyStyle.position,
      bodyTop: bodyStyle.top,
      bodyWidth: bodyStyle.width,
      bodyPaddingRight: bodyStyle.paddingRight,
    }

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    htmlStyle.overflow = "hidden"
    bodyStyle.overflow = "hidden"
    bodyStyle.position = "fixed"
    bodyStyle.top = `-${scrollY}px`
    bodyStyle.width = "100%"
    if (scrollbarWidth > 0) {
      bodyStyle.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      htmlStyle.overflow = prev.htmlOverflow
      bodyStyle.overflow = prev.bodyOverflow
      bodyStyle.position = prev.bodyPosition
      bodyStyle.top = prev.bodyTop
      bodyStyle.width = prev.bodyWidth
      bodyStyle.paddingRight = prev.bodyPaddingRight
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}

type AdminFormModalShellProps = {
  open: boolean
  onClose: () => void
  title: string
  titleId: string
  subtitle?: string
  maxWidth?: "lg" | "2xl"
  headerExtra?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export function AdminFormModalShell({
  open,
  onClose,
  title,
  titleId,
  subtitle,
  maxWidth = "2xl",
  headerExtra,
  footer,
  children,
}: AdminFormModalShellProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open || !mounted) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "fixed z-[101] flex max-h-[90vh] w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900",
          "inset-x-0 bottom-0 rounded-t-2xl",
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
          maxWidth === "lg" ? "sm:max-w-lg" : "sm:max-w-2xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 shrink-0 border-b bg-white dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3 px-5 py-4">
            <div className="min-w-0 pr-2">
              <h2 id={titleId} className="text-lg font-bold">
                {title}
              </h2>
              {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Schließen"
              className="shrink-0 rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {headerExtra}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

        {footer ? <div className="shrink-0 border-t bg-white px-5 py-4 dark:bg-slate-900">{footer}</div> : null}
      </div>
    </>,
    document.body,
  )
}
