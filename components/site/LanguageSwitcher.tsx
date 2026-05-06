"use client"

import { useState, useRef, useEffect } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Globe, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [open])

  const current = LOCALE_META[locale]
  const languagePickerAria = `Choisir la langue: ${LOCALES.map((c) => LOCALE_META[c].nativeLabel).join(", ")}`

  const code = locale.toUpperCase()

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={reduceMotion ? undefined : { scale: 1.04 }}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        className={cn(
          "group relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border backdrop-blur-xl outline-none",
          "transition-colors duration-300 ease-out",
          compact ? "h-9 gap-1.5 px-2.5 py-2" : "h-10 gap-2 px-4 py-2",
          open
            ? "border-[color:var(--lux-gold)]/55 bg-[color:var(--lux-cream)]/95 shadow-[0_12px_32px_-14px_rgba(201,162,76,0.45)] ring-2 ring-[color:var(--lux-gold)]/25 dark:bg-zinc-900/92"
            : cn(
                "border-[color:var(--lux-gold)]/30 bg-gradient-to-b from-white/98 to-[color:var(--lux-cream)]/88 dark:from-zinc-900/95 dark:to-zinc-950/90",
                "shadow-[0_6px_20px_-10px_rgba(110,29,43,0.22),inset_0_1px_0_0_rgba(255,253,247,0.9)] dark:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.55)]",
                "hover:border-[color:var(--lux-gold)]/48 hover:shadow-[0_12px_36px_-16px_rgba(201,162,76,0.38)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
              ),
          "focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-cream)] dark:focus-visible:ring-offset-zinc-950",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={languagePickerAria}
        title={`${current.nativeLabel} (${code})`}
      >
        {/* 🌍 décoratif ; Globe complète le repère luxe */}
        <span className={cn("select-none leading-none", compact ? "text-base" : "text-[1.1rem]")} aria-hidden>
          🌍
        </span>
        <Globe
          className={cn(
            "shrink-0 text-amber-800/85 opacity-[0.88] transition group-hover:opacity-100 dark:text-amber-200/95",
            compact ? "h-3 w-3" : "h-4 w-4",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "min-w-[1.75rem] text-center font-bold tabular-nums tracking-tight text-amber-950 dark:text-slate-100",
            compact ? "text-[10px]" : "text-[11px] sm:text-xs",
          )}
        >
          {code}
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={
              reduceMotion
                ? { duration: 0.1 }
                : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
            }
            className={cn(
              "absolute end-0 z-[55] mt-3 min-w-[11.5rem] overflow-hidden rounded-2xl",
              "border border-[color:var(--lux-gold)]/28 bg-[color:var(--lux-cream)]/96 p-2 shadow-[0_28px_70px_-24px_rgba(26,20,16,0.52)] backdrop-blur-2xl",
              "dark:border-[color:var(--lux-gold)]/22 dark:bg-zinc-950/94 dark:shadow-[0_32px_64px_-20px_rgba(0,0,0,0.88)]",
            )}
            role="listbox"
          >
            <p className="mb-2 border-b border-[color:var(--lux-gold)]/15 px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-800/65 dark:text-amber-200/70">
              {t("common.language")}
            </p>
            {LOCALES.map((loc) => {
              const meta = LOCALE_META[loc as Locale]
              const active = loc === locale
              return (
                <motion.button
                  key={loc}
                  layout={!reduceMotion}
                  type="button"
                  onClick={() => {
                    setLocale(loc as Locale)
                    setOpen(false)
                  }}
                  whileHover={reduceMotion ? undefined : { x: 2 }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-200",
                    "focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/35 focus-visible:ring-inset",
                    active
                      ? "bg-gradient-to-r from-[color:var(--lux-gold)]/22 to-amber-100/85 text-amber-950 dark:from-[color:var(--lux-gold)]/18 dark:to-amber-950/55 dark:text-amber-50"
                      : "text-amber-950 hover:bg-[color:var(--lux-gold)]/12 dark:text-slate-200 dark:hover:bg-zinc-800/95",
                  )}
                  role="option"
                  aria-selected={active}
                >
                  <span className="text-xl leading-none drop-shadow-sm">{meta.flag}</span>
                  <span className="min-w-0 flex-1 text-start">
                    <span className="block font-semibold">{meta.nativeLabel}</span>
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {meta.label}
                    </span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
