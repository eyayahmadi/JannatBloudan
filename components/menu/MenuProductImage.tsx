"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { categoryPlaceholderEmoji, isPlaceholderImage } from "@/lib/menu/menu-display"
import { logMenuTelemetry } from "@/lib/menu/menu-telemetry"
import { useMenuScrollGuardNotify } from "@/lib/menu/use-menu-scroll-preservation"
import { cn } from "@/lib/utils"

const FALLBACK_SRC = "/placeholder.svg"

type MenuProductImageProps = {
  src: string | null | undefined
  alt: string
  section?: string
  category?: string
  className?: string
  imgClassName?: string
  loading?: "lazy" | "eager"
  /** Show emoji instead of placeholder.svg when no real image */
  emojiFallback?: boolean
}

function resolveSrc(src: string | null | undefined): string | null {
  if (!src || isPlaceholderImage(src)) return null
  return src
}

function MenuProductImageInner({
  src,
  alt,
  section = "food",
  category,
  className,
  imgClassName,
  loading = "lazy",
  emojiFallback = false,
}: MenuProductImageProps) {
  const notifyLayoutShift = useMenuScrollGuardNotify()
  const originalSrc = resolveSrc(src)
  const [displaySrc, setDisplaySrc] = useState<string>(() => originalSrc ?? FALLBACK_SRC)
  const [loaded, setLoaded] = useState(() => !originalSrc)
  const retriedRef = useRef(false)
  const lastLoadedSrcRef = useRef<string | null>(originalSrc ? originalSrc : FALLBACK_SRC)

  useEffect(() => {
    const next = originalSrc ?? FALLBACK_SRC
    if (lastLoadedSrcRef.current === next) return
    retriedRef.current = false
    setDisplaySrc(next)
    setLoaded(!originalSrc)
    if (!originalSrc) lastLoadedSrcRef.current = FALLBACK_SRC
  }, [originalSrc])

  const handleLoad = useCallback(() => {
    setLoaded(true)
    lastLoadedSrcRef.current = displaySrc
    notifyLayoutShift?.()
  }, [displaySrc, notifyLayoutShift])

  const handleError = useCallback(() => {
    if (displaySrc === FALLBACK_SRC) {
      setLoaded(true)
      notifyLayoutShift?.()
      return
    }
    if (originalSrc && !retriedRef.current) {
      retriedRef.current = true
      const retryUrl = `${originalSrc}${originalSrc.includes("?") ? "&" : "?"}_retry=${Date.now()}`
      window.setTimeout(() => {
        setDisplaySrc(retryUrl)
        setLoaded(false)
      }, 1200)
      return
    }
    setDisplaySrc(FALLBACK_SRC)
    setLoaded(true)
    lastLoadedSrcRef.current = FALLBACK_SRC
    notifyLayoutShift?.()
    logMenuTelemetry("image_load_failed", { src: originalSrc ?? displaySrc, retried: retriedRef.current })
  }, [displaySrc, originalSrc, notifyLayoutShift])

  const neverHadImage = !originalSrc
  const showEmoji = emojiFallback && neverHadImage && displaySrc === FALLBACK_SRC
  const emoji = categoryPlaceholderEmoji(section, category)

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gradient-to-br from-amber-50 to-stone-100 dark:from-neutral-800 dark:to-neutral-900",
        className,
      )}
    >
      {!showEmoji && !loaded ? (
        <div
          className="absolute inset-0 z-[1] bg-amber-100/80 dark:bg-neutral-800"
          aria-hidden
        />
      ) : null}
      {showEmoji ? (
        <div className="flex h-full min-h-[1px] w-full items-center justify-center text-5xl opacity-90" aria-hidden>
          {emoji}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displaySrc}
          alt={alt}
          loading={loading}
          decoding="async"
          dir="ltr"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "absolute inset-0 z-[2] h-full w-full object-cover",
            loaded ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      )}
    </div>
  )
}

export const MenuProductImage = memo(MenuProductImageInner)
