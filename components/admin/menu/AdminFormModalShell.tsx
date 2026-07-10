"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
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

function useIsMobileSheet() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return isMobile
}

type AdminFormModalShellProps = {
  open: boolean
  onClose: () => void
  title: string
  titleId: string
  subtitle?: string
  /** Product editor: ~1050px desktop. Category editor: narrower. */
  size?: "lg" | "xl"
  headerExtra?: ReactNode
  footer?: ReactNode
  children: ReactNode
  isDirty?: boolean
  dirtyMessage?: string
}

export function AdminFormModalShell({
  open,
  onClose,
  title,
  titleId,
  subtitle,
  size = "xl",
  headerExtra,
  footer,
  children,
  isDirty = false,
  dirtyMessage = "Nicht gespeicherte Änderungen verwerfen?",
}: AdminFormModalShellProps) {
  const [mounted, setMounted] = useState(false)
  const isMobileSheet = useIsMobileSheet()

  useEffect(() => {
    setMounted(true)
  }, [])

  useLockBodyScroll(open)

  const requestClose = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm(dirtyMessage)
      if (!ok) return
    }
    onClose()
  }, [dirtyMessage, isDirty, onClose])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, requestClose])

  const panelMotion = isMobileSheet
    ? {
        initial: { y: "100%", opacity: 1 },
        animate: { y: 0, opacity: 1 },
        exit: { y: "100%", opacity: 1 },
        transition: { type: "spring" as const, damping: 28, stiffness: 320 },
      }
    : {
        initial: { opacity: 0, y: 16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 12, scale: 0.98 },
        transition: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] as const },
      }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="admin-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            onClick={requestClose}
          />

          <motion.div
            key="admin-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            {...panelMotion}
            className={cn(
              "fixed z-[201] flex max-h-[90vh] flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900",
              "inset-x-0 bottom-0 w-full rounded-t-2xl",
              "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[90vw] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
              size === "xl" ? "sm:max-w-[1050px]" : "sm:max-w-lg",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b bg-white shadow-sm dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0 pr-2">
                  <h2 id={titleId} className="text-lg font-bold">
                    {title}
                  </h2>
                  {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={requestClose}
                  aria-label="Schließen"
                  className="shrink-0 rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {headerExtra ? (
                <div className="border-t bg-white/95 backdrop-blur-sm dark:bg-slate-900/95">{headerExtra}</div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">{children}</div>

            {footer ? (
              <div className="shrink-0 border-t bg-white px-5 py-4 shadow-[0_-6px_24px_-10px_rgba(0,0,0,0.12)] dark:bg-slate-900">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
