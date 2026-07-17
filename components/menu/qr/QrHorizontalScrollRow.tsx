"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type QrHorizontalScrollRowProps = {
  children: ReactNode
  className?: string
  trackClassName?: string
  ariaLabel?: string
  bleed?: boolean
  "data-qr-category-carousel"?: boolean
}

/**
 * Single-row horizontal carousel.
 * Viewport scrolls; inner track uses inline-flex + w-max so items never wrap/shrink into a grid.
 */
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
      <div
        data-qr-scroll-viewport
        className={cn(
          "w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth snap-x snap-mandatory touch-pan-x",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          bleed && "-mx-4 px-4 sm:mx-0 sm:px-0",
          trackClassName,
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          data-qr-scroll-track
          className="inline-flex w-max min-w-full flex-row flex-nowrap items-stretch gap-3 pb-2"
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
      className={cn("flex shrink-0 grow-0 snap-start", className)}
    >
      {children}
    </div>
  )
}
