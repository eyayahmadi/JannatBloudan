"use client"

import { cn } from "@/lib/utils"

type MenuSubcategoryHeaderProps = {
  icon: string
  labelDe: string
  labelAr: string
  variant?: "table" | "default"
  drink?: boolean
  sweet?: boolean
  premium?: boolean
}

export function MenuSubcategoryHeader({
  icon,
  labelDe,
  labelAr,
  variant = "default",
  drink,
  sweet,
  premium,
}: MenuSubcategoryHeaderProps) {
  const isTable = variant === "table"

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
            : drink
              ? "h-9 w-9 bg-cyan-100"
              : sweet
                ? "h-9 w-9 bg-rose-100"
                : "h-9 w-9 bg-muted",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h3
          className={cn(
            "font-semibold tracking-wide",
            isTable
              ? premium
                ? "text-base text-amber-950 dark:text-white"
                : "text-sm text-amber-950 dark:text-white"
              : drink
                ? "text-sm text-cyan-900"
                : sweet
                  ? "text-sm text-rose-900"
                  : "text-sm text-foreground",
          )}
        >
          {labelDe}
        </h3>
        <p className="text-xs text-muted-foreground" dir="rtl">
          {labelAr}
        </p>
      </div>
    </div>
  )
}
