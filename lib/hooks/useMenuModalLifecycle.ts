"use client"

import { useEffect } from "react"
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock"
import { registerMenuModalOpen } from "@/lib/menu/menu-modal-guard"

/** Portal modals: lock scroll + pause menu background refresh. */
export function useMenuModalLifecycle(open: boolean) {
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    return registerMenuModalOpen()
  }, [open])
}
