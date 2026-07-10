"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
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

type AdminConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirming?: boolean
  destructive?: boolean
  children?: ReactNode
}

export function AdminConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  confirming = false,
  destructive = false,
  children,
}: AdminConfirmDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useLockBodyScroll(open)

  const requestClose = useCallback(() => {
    if (confirming) return
    onClose()
  }, [confirming, onClose])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, requestClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="admin-confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            onClick={requestClose}
          />

          <motion.div
            key="admin-confirm-panel"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn(
              "fixed z-[201] flex w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900",
              "left-1/2 top-1/2 max-h-[min(90dvh,640px)] -translate-x-1/2 -translate-y-1/2",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
              <h2 id="admin-confirm-title" className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              <button
                type="button"
                onClick={requestClose}
                disabled={confirming}
                aria-label="Schließen"
                className="shrink-0 rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain px-5 py-5">
              {children}
              {description ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
              ) : null}
            </div>

            <div className="flex gap-2 border-t px-5 py-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={confirming}
                onClick={requestClose}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                className={cn("flex-1", destructive && "bg-red-600 hover:bg-red-700")}
                disabled={confirming}
                onClick={onConfirm}
              >
                {confirming ? "…" : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
