"use client"

import { cn } from "@/lib/utils"

type AdminMenuSectionHeaderProps = {
  icon: string
  labelDe: string
  labelAr: string
  className?: string
}

export function AdminMenuSectionHeader({
  icon,
  labelDe,
  labelAr,
  className,
}: AdminMenuSectionHeaderProps) {
  return (
    <div
      className={cn(
        "col-span-full flex items-center gap-3 border-b-2 border-amber-200/80 pb-3 pt-8 first:pt-2 dark:border-amber-800/50",
        className,
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-900/40">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight text-amber-950 dark:text-amber-50">{labelDe}</h2>
        <p className="text-xs text-slate-500" dir="rtl">
          {labelAr}
        </p>
      </div>
    </div>
  )
}
