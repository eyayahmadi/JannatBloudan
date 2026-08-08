"use client"

import { Wind } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  isShishaCategorySlug,
  resolveCategoryDisplayIcon,
} from "@/lib/menu/category-display-icon"

type MenuSubcategoryHeaderProps = {
  icon: string
  labelDe: string
  labelAr: string
  subtitle?: string
  variant?: "table" | "default"
  drink?: boolean
  sweet?: boolean
  premium?: boolean
  categorySlug?: string
}

export function MenuSubcategoryHeader({
  icon,
  labelDe,
  labelAr,
  subtitle,
  variant = "default",
  drink,
  sweet,
  premium,
  categorySlug,
}: MenuSubcategoryHeaderProps) {
  const isTable = variant === "table"
  const displayIcon = categorySlug
    ? resolveCategoryDisplayIcon(categorySlug, icon)
    : icon
  const shisha = categorySlug != null && isShishaCategorySlug(categorySlug)

  return (
    <div
      className={cn(
        "col-span-full flex items-center gap-3",
        isTable
          ? premium
            ? "border-b border-amber-200/50 pb-4 dark:border-amber-900/35"
            : "border-b border-amber-200/40 py-1 pb-3 dark:border-amber-900/30"
          : "border-b border-border/50 py-1 pb-3",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full text-lg",
          isTable
            ? premium
              ? "h-10 w-10 bg-gradient-to-br from-amber-100 to-amber-50 shadow-sm dark:from-amber-900/40 dark:to-amber-950/40"
              : "h-9 w-9 bg-amber-100 dark:bg-amber-900/30"
            : "h-9 w-9 bg-muted",
        )}
        aria-hidden
      >
        {shisha ? (
          <Wind className="h-5 w-5 stroke-[1.75] text-sky-300" aria-hidden />
        ) : (
          displayIcon
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3
            className={cn(
              "font-semibold tracking-tight",
              isTable ? "text-base text-amber-950 dark:text-white" : "text-lg",
              drink && "text-cyan-900 dark:text-cyan-100",
              sweet && "text-rose-900 dark:text-rose-100",
            )}
            dir="ltr"
          >
            {labelDe}
          </h3>
          <span
            className={cn(
              "text-sm text-muted-foreground",
              isTable && "text-amber-800/55 dark:text-amber-300/55",
            )}
            dir="rtl"
          >
            {labelAr}
          </span>
        </div>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}
