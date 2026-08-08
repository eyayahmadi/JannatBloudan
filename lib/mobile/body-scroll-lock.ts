/**
 * Shared body scroll lock — reference-counted, restores exact scroll position.
 * Supports multiple simultaneous overlays without premature unlock.
 */

export type BodyScrollLockMode = "fixed" | "overflow"

export type BodyScrollLockHandle = {
  release: () => void
}

type LockEntry = {
  mode: BodyScrollLockMode
  htmlClasses: string[]
  blockTouch: boolean
}

const locks: LockEntry[] = []
const htmlClassCounts = new Map<string, number>()

let savedScrollY = 0
let stylesSaved = false

const prev = {
  htmlOverflow: "",
  bodyOverflow: "",
  bodyPosition: "",
  bodyTop: "",
  bodyLeft: "",
  bodyRight: "",
  bodyWidth: "",
  bodyHeight: "",
  bodyTouchAction: "",
}

function saveStylesOnce() {
  if (stylesSaved || typeof document === "undefined") return
  savedScrollY = window.scrollY
  const { body, documentElement: html } = document
  prev.htmlOverflow = html.style.overflow
  prev.bodyOverflow = body.style.overflow
  prev.bodyPosition = body.style.position
  prev.bodyTop = body.style.top
  prev.bodyLeft = body.style.left
  prev.bodyRight = body.style.right
  prev.bodyWidth = body.style.width
  prev.bodyHeight = body.style.height
  prev.bodyTouchAction = body.style.touchAction
  stylesSaved = true
}

function addHtmlClasses(classes: string[]) {
  const html = document.documentElement
  for (const cls of classes) {
    if (!cls) continue
    htmlClassCounts.set(cls, (htmlClassCounts.get(cls) ?? 0) + 1)
    html.classList.add(cls)
  }
}

function removeHtmlClasses(classes: string[]) {
  const html = document.documentElement
  for (const cls of classes) {
    if (!cls) continue
    const next = (htmlClassCounts.get(cls) ?? 0) - 1
    if (next <= 0) {
      htmlClassCounts.delete(cls)
      html.classList.remove(cls)
    } else {
      htmlClassCounts.set(cls, next)
    }
  }
}

function applyActiveLocks() {
  if (typeof document === "undefined") return
  const { body, documentElement: html } = document

  if (locks.length === 0) {
    html.style.overflow = prev.htmlOverflow
    body.style.overflow = prev.bodyOverflow
    body.style.position = prev.bodyPosition || ""
    body.style.top = prev.bodyTop
    body.style.left = prev.bodyLeft
    body.style.right = prev.bodyRight
    body.style.width = prev.bodyWidth
    body.style.height = prev.bodyHeight
    body.style.touchAction = prev.bodyTouchAction || ""
    stylesSaved = false
    window.scrollTo(0, savedScrollY)
    return
  }

  saveStylesOnce()

  const useFixed = locks.some((l) => l.mode === "fixed")
  const blockTouch = locks.some((l) => l.blockTouch)

  html.style.overflow = "hidden"
  body.style.overflow = "hidden"

  if (useFixed) {
    body.style.position = "fixed"
    body.style.top = `-${savedScrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"
    body.style.height = "100%"
    body.style.touchAction = blockTouch ? "none" : ""
  } else {
    body.style.position = ""
    body.style.top = ""
    body.style.left = ""
    body.style.right = ""
    body.style.width = ""
    body.style.height = ""
    body.style.touchAction = ""
  }
}

/** Acquire a scroll lock. Call `release()` on close/unmount. */
export function acquireBodyScrollLock(options: {
  mode?: BodyScrollLockMode
  htmlClass?: string | string[]
  blockTouch?: boolean
} = {}): BodyScrollLockHandle {
  const entry: LockEntry = {
    mode: options.mode ?? "fixed",
    htmlClasses: Array.isArray(options.htmlClass)
      ? options.htmlClass
      : options.htmlClass
        ? [options.htmlClass]
        : [],
    blockTouch: options.blockTouch ?? (options.mode ?? "fixed") === "fixed",
  }

  locks.push(entry)
  addHtmlClasses(entry.htmlClasses)
  applyActiveLocks()

  let released = false
  return {
    release: () => {
      if (released) return
      released = true
      const idx = locks.indexOf(entry)
      if (idx >= 0) locks.splice(idx, 1)
      removeHtmlClasses(entry.htmlClasses)
      applyActiveLocks()
    },
  }
}

/** Test helper — force reset (Playwright / error recovery). */
export function resetBodyScrollLockForTests(): void {
  locks.length = 0
  htmlClassCounts.clear()
  stylesSaved = false
  if (typeof document === "undefined") return
  const { body, documentElement: html } = document
  html.style.overflow = ""
  body.style.overflow = ""
  body.style.position = ""
  body.style.top = ""
  body.style.left = ""
  body.style.right = ""
  body.style.width = ""
  body.style.height = ""
  body.style.touchAction = ""
  for (const cls of [...html.classList]) {
    if (cls.includes("modal") || cls.includes("sheet") || cls.includes("menu-modal")) {
      html.classList.remove(cls)
    }
  }
}
