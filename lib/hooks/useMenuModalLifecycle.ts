"use client"

import { useEffect } from "react"
import { useProductSheetLock } from "@/lib/hooks/useProductSheetLock"
import { registerMenuModalOpen } from "@/lib/menu/menu-modal-guard"

/** Portal product sheets: lock scroll + pause menu background refresh. */
export function useMenuModalLifecycle(open: boolean) {
  useProductSheetLock(open)

  useEffect(() => {
    if (!open) return
    return registerMenuModalOpen()
  }, [open])
}
