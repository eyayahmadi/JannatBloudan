"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-10 w-10 shrink-0 rounded-full bg-white/60 dark:bg-zinc-900/50",
          className,
        )}
        aria-hidden
      />
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-xl",
        "transition-[box-shadow,background-color,border-color,color,transform] duration-300 ease-out",
        "border-[color:var(--lux-gold)]/30 bg-gradient-to-b from-white/98 to-[color:var(--lux-cream)]/90 text-amber-950",
        "shadow-[0_4px_18px_-6px_rgba(110,29,43,0.22),inset_0_1px_0_0_rgba(255,253,247,0.85)]",
        "hover:-translate-y-0.5 hover:border-[color:var(--lux-gold)]/50 hover:shadow-[0_10px_28px_-12px_rgba(201,162,76,0.45)] hover:scale-[1.03]",
        "motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        "active:scale-[0.98]",
        "dark:border-[color:var(--lux-gold)]/38 dark:bg-gradient-to-b dark:from-zinc-900/98 dark:to-zinc-950/95 dark:text-amber-100",
        "dark:shadow-[0_6px_24px_-8px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(217,183,106,0.12)]",
        "dark:hover:border-[color:var(--lux-gold)]/58 dark:hover:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.75)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/50",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-cream)] dark:focus-visible:ring-offset-zinc-950",
        className,
      )}
    >
      <Sun className="relative z-[1] h-[1.125rem] w-[1.125rem] rotate-0 scale-100 text-amber-700 transition-transform duration-300 dark:-rotate-90 dark:scale-0 dark:text-amber-200" />
      <Moon className="absolute z-[1] h-[1.125rem] w-[1.125rem] rotate-90 scale-0 text-indigo-200 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
    </button>
  )
}
