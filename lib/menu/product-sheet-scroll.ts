/** Saved list scroll when a product sheet opens (restore on X close). */
let savedScrollY = 0
let savedPathname: string | null = null

export function captureProductSheetScroll() {
  if (typeof window === "undefined") return
  savedScrollY = window.scrollY
  savedPathname = window.location.pathname
}

export function getSavedProductSheetScroll(): number {
  return savedScrollY
}

export function restoreProductSheetScroll() {
  if (typeof window === "undefined") return
  const y = savedScrollY
  const restore = () => {
    window.scrollTo(0, y)
  }
  restore()
  requestAnimationFrame(() => {
    restore()
    requestAnimationFrame(restore)
  })
}

export function clearProductSheetScrollCapture() {
  savedScrollY = 0
  savedPathname = null
}

export function getSavedProductSheetPathname(): string | null {
  return savedPathname
}
