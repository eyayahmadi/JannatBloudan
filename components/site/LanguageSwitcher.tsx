"use client"

import { useState, useRef, useEffect } from "react"
import { Globe, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n()
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

  /** Drapeau émoji = souvent 2 carrés F+R (indicateurs régionaux) + code = doublon visuel. Un seul code 2 lettres. */
  const code = locale.toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "btn-ghost btn-toolbar",
          compact ? "gap-1 px-1.5 py-1" : "gap-1.5 px-2.5 py-1.5",
          open && "bg-white/90 ring-1 ring-[color:var(--lux-gold)]/30 dark:bg-slate-800/90",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={languagePickerAria}
        title={current.nativeLabel}
      >
        <Globe className={cn("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
        <span
          className={cn(
            "min-w-[1.5rem] text-center font-bold leading-none tabular-nums text-amber-950 dark:text-slate-200",
            compact ? "text-[10px]" : "text-xs",
          )}
        >
          {code}
        </span>
      </button>

      {open && (
        <div
          className="absolute end-0 mt-2 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          role="listbox"
        >
          {LOCALES.map((code) => {
            const meta = LOCALE_META[code as Locale]
            const active = code === locale
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLocale(code as Locale)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-sm transition",
                  active
                    ? "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
                role="option"
                aria-selected={active}
              >
                <span className="text-lg leading-none">{meta.flag}</span>
                <span className="flex-1 text-start">
                  <span className="block font-medium">{meta.nativeLabel}</span>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-500">
                    {meta.label}
                  </span>
                </span>
                {active && <Check className="h-4 w-4 text-amber-600" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
