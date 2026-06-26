"use client"

import {
  attributeBadgeClassName,
  attributeBadgeLabel,
  visibleProductTags,
} from "@/lib/menu/product-attributes"
import { cn } from "@/lib/utils"

type ProductAttributeBadgesProps = {
  tags: string[] | null | undefined
  locale?: "de" | "ar" | "en" | "fr"
  max?: number
  size?: "xs" | "sm"
  className?: string
}

export function ProductAttributeBadges({
  tags,
  locale = "de",
  max,
  size = "sm",
  className,
}: ProductAttributeBadgesProps) {
  const visible = visibleProductTags(tags)
  const list = max != null ? visible.slice(0, max) : visible
  if (list.length === 0) return null

  const textSize = size === "xs" ? "text-[9px]" : "text-[11px]"
  const pad = size === "xs" ? "px-1.5 py-0.5" : "px-2.5 py-0.5"

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {list.map((tag) => {
        const lbl = attributeBadgeLabel(tag)
        const text = locale === "ar" ? lbl?.ar ?? tag : lbl?.de ?? tag
        return (
          <span
            key={tag}
            className={cn("rounded-full font-medium", textSize, pad, attributeBadgeClassName(tag))}
          >
            {text}
          </span>
        )
      })}
    </div>
  )
}
