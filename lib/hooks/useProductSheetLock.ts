"use client"

import { useLayoutEffect } from "react"
import {
  getSavedProductSheetScroll,
  restoreProductSheetScroll,
} from "@/lib/menu/product-sheet-scroll"
import { acquireBodyScrollLock } from "@/lib/mobile/body-scroll-lock"

/**
 * Full-viewport product sheet lock — fixed body, restores scroll via product-sheet-scroll helper.
 */
export function useProductSheetLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked) return

    const scrollY = getSavedProductSheetScroll() || window.scrollY
    window.scrollTo(0, scrollY)

    const handle = acquireBodyScrollLock({
      mode: "fixed",
      htmlClass: ["menu-modal-open", "menu-product-sheet-open"],
      blockTouch: true,
    })

    return () => {
      handle.release()
      restoreProductSheetScroll()
    }
  }, [locked])
}
