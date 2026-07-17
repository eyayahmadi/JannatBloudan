"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft } from "lucide-react"
import { QrMenuSearch } from "@/components/menu/qr/QrMenuSearch"
import { QrTableMenuProductGrid } from "@/components/menu/qr/QrTableMenuProductGrid"
import { useQrTableMenu } from "@/components/menu/qr/QrTableMenuProvider"
import { matchesProductNameSearch } from "@/lib/menu/menu-display"
import { sortByMenuCardOrder } from "@/lib/menu/menu-order"
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock"

type QrMenuSearchOverlayProps = {
  open: boolean
  onClose: () => void
}

/** Full-screen product search — homepage only, preserves cart/session underneath. */
export function QrMenuSearchOverlay({ open, onClose }: QrMenuSearchOverlayProps) {
  const { menuItems } = useQrTableMenu()
  const [query, setQuery] = useState("")
  const inputWrapRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    return sortByMenuCardOrder(menuItems.filter((item) => matchesProductNameSearch(item, q)))
  }, [menuItems, query])

  const handleClose = useCallback(() => {
    setQuery("")
    onClose()
  }, [onClose])

  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      const input = inputWrapRef.current?.querySelector("input")
      input?.focus({ preventScroll: true })
    }, 50)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, handleClose])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#faf6f0] dark:bg-neutral-950"
      role="dialog"
      aria-modal="true"
      aria-label="Produktsuche"
    >
      <header className="shrink-0 border-b border-amber-200/60 bg-[#faf6f0]/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md dark:border-amber-900/40 dark:bg-neutral-950/95">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full bg-amber-100/80 px-3 text-sm font-medium text-amber-950 transition active:scale-[0.98] dark:bg-amber-900/30 dark:text-amber-100"
            aria-label="Zurück zur Startseite"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Zurück</span>
          </button>
          <div ref={inputWrapRef} className="min-w-0 flex-1">
            <QrMenuSearch value={query} onChange={setQuery} resultCount={results.length} />
          </div>
        </div>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 [-webkit-overflow-scrolling:touch]"
        style={{ overflowAnchor: "none" }}
      >
        <div className="mx-auto max-w-2xl pb-28">
          {!query.trim() ? (
            <p className="px-1 text-center text-sm text-amber-800/55 dark:text-amber-300/55">
              Produktname auf Deutsch oder عربي eingeben
            </p>
          ) : results.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-base font-medium text-amber-950 dark:text-white">Keine Produkte gefunden</p>
              <p className="mt-1 text-sm text-amber-800/55 dark:text-amber-300/55" dir="rtl">
                لم يتم العثور على منتجات
              </p>
            </div>
          ) : (
            <QrTableMenuProductGrid items={results} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
