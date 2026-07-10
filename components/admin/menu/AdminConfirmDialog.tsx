"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const scrollY = window.scrollY
    const html = document.documentElement
    const body = document.body

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
    }

    const scrollbarWidth = window.innerWidth - html.clientWidth

    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.width = "100%"
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      body.style.position = prev.bodyPosition
      body.style.top = prev.bodyTop
      body.style.width = prev.bodyWidth
      body.style.paddingRight = prev.bodyPaddingRight
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}

/**
 * Confirmation admin — portal body + flex center (pas de translate/animation).
 * Corrige le cas « overlay visible mais panneau invisible ».
 */
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

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: "fixed" }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Schließen"
        onClick={requestClose}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className={cn(
          "relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900",
          "max-h-[min(90dvh,640px)]",
        )}
        style={{ opacity: 1, transform: "none" }}
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
          <Button type="button" variant="outline" className="flex-1" disabled={confirming} onClick={requestClose}>
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
      </div>
    </div>,
    document.body,
  )
}
