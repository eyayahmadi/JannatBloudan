"use client"

import { Globe, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { LOCALE_META, type Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

/** Ordre affiché : FR, AR, DE, EN (spec produit). */
const LOCALE_ORDER: Locale[] = ["fr", "ar", "de", "en"]

const navTriggerClass = cn(
  "flex h-9 shrink-0 items-center gap-2 rounded-full border border-[color:var(--lux-gold)]/25 bg-white/90 px-3 text-sm font-medium text-amber-950 shadow-sm",
  "outline-none transition hover:border-[color:var(--lux-gold)]/45 hover:bg-white hover:shadow-md",
  "focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-cream)]",
  "dark:border-[color:var(--lux-gold)]/30 dark:bg-zinc-900/90 dark:text-amber-50 dark:hover:bg-zinc-900",
  "dark:focus-visible:ring-offset-zinc-950",
)

/**
 * Sélecteur de langue : une icône globe, code actif (ex. FR), menu porté (Radix) pour éviter tout clipping.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n()
  const code = locale.toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(navTriggerClass, className)}
        aria-label={t("common.language", "Langue")}
        translate="no"
        data-no-translate
      >
        <Globe className="h-4 w-4 shrink-0 text-amber-800/90 dark:text-amber-200/90" aria-hidden />
        <span
          className="min-w-[1.75rem] tabular-nums tracking-tight"
          translate="no"
          data-no-translate
        >
          {code}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(
          "z-[200] min-w-[11rem] rounded-xl border border-[color:var(--lux-gold)]/20 bg-[color:var(--lux-cream)]/98 p-1 shadow-lg dark:border-[color:var(--lux-gold)]/25 dark:bg-zinc-950/98",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
        )}
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("common.language", "Langue")}
        </DropdownMenuLabel>
        {LOCALE_ORDER.map((loc) => {
          const meta = LOCALE_META[loc]
          const active = loc === locale
          return (
            <DropdownMenuItem
              key={loc}
              className={cn(
                "cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-sm focus:bg-[color:var(--lux-gold)]/12",
                active && "bg-[color:var(--lux-gold)]/10",
              )}
              onSelect={() => setLocale(loc)}
            >
              <span
                className="flex-1 text-start font-medium"
                dir={meta.dir === "rtl" ? "rtl" : undefined}
              >
                {meta.nativeLabel}
              </span>
              {active ? (
                <Check className="h-4 w-4 shrink-0 text-[color:var(--lux-bordeaux)] dark:text-[color:var(--lux-gold)]" />
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
