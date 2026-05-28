"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const btnClass = cn(
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--lux-gold)]/25 bg-white/90 text-amber-900 shadow-sm",
  "outline-none transition hover:border-[color:var(--lux-gold)]/45 hover:bg-white hover:shadow-md",
  "focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-cream)]",
  "dark:border-[color:var(--lux-gold)]/30 dark:bg-zinc-900/90 dark:text-amber-100 dark:hover:bg-zinc-900",
  "dark:focus-visible:ring-offset-zinc-950",
)

/** Basculer thème — une seule icône visible (soleil ou lune). */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div
        className={cn(btnClass, "pointer-events-none opacity-60", className)}
        aria-hidden
      />
    )
  }

  const dark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(btnClass, className)}
    >
      {dark ? (
        <Moon className="h-4 w-4" aria-hidden />
      ) : (
        <Sun className="h-4 w-4" aria-hidden />
      )}
    </button>
  )
}
