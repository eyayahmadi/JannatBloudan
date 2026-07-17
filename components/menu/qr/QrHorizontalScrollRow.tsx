"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type QrHorizontalScrollRowProps = {
  children: ReactNode
  className?: string
  trackClassName?: string
  ariaLabel?: string
  /** Pull track to screen edges on mobile (default true). */
  bleed?: boolean
  "data-qr-category-carousel"?: boolean
}

/** Single-row horizontal carousel — never wraps to a grid. */
export function QrHorizontalScrollRow({
  children,
  className,
  trackClassName,
  ariaLabel,
  bleed = true,
  "data-qr-category-carousel": dataQrCategoryCarousel,
}: QrHorizontalScrollRowProps) {
  return (
    <section
      className={cn("w-full min-w-0 max-w-full", className)}
      aria-label={ariaLabel}
      {...(dataQrCategoryCarousel ? { "data-qr-category-carousel": true } : {})}
    >
      <div className={cn("w-full min-w-0", bleed && "-mx-4 overflow-hidden sm:mx-0")}>
        <div
          data-qr-scroll-track
          className={cn(
            "flex flex-row flex-nowrap items-stretch gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-2 snap-x snap-mandatory touch-pan-x",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            bleed && "px-4 sm:px-0",
            trackClassName,
          )}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </div>
    </section>
  )
}

type QrHorizontalScrollItemProps = {
  children: ReactNode
  className?: string
}

export function QrHorizontalScrollItem({ children, className }: QrHorizontalScrollItemProps) {
  return (
    <div
      data-qr-scroll-item
      className={cn("flex shrink-0 grow-0 basis-auto snap-start", className)}
    >
      {children}
    </div>
  )
}
