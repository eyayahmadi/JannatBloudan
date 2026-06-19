"use client"

/**
 * FloatingLanguagePill
 * --------------------
 * Sélecteur de langue compact, positionné en absolu en haut à droite du
 * viewport. Conçu pour les pages SANS site-header (parcours QR, addition,
 * commande client), afin que les visiteurs scannant un QR puissent changer
 * de langue à tout moment.
 *
 * - Détection automatique de la langue navigateur déjà gérée par I18nProvider.
 * - Persiste dans localStorage + cookie via `setLocale`.
 * - Aucun appel réseau supplémentaire : déclenche un re-render React qui fait
 *   réagir `AutoTranslateDom` et `MachineTranslateProvider`.
 */

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

const LOCALE_ORDER: Locale[] = ["fr", "ar", "de", "en"]

type Props = {
  /** Décalage par rapport au bord supérieur (px). Défaut 16. */
  topOffset?: number
  /** Décalage par rapport au bord latéral droit (px). Défaut 16. */
  sideOffset?: number
  className?: string
}

export function FloatingLanguagePill({ topOffset = 16, sideOffset = 16, className }: Props) {
  const { locale, setLocale, t, dir } = useI18n()
  const code = locale.toUpperCase()
  const isRtl = dir === "rtl"
  const positionStyle: React.CSSProperties = {
    top: topOffset,
    ...(isRtl ? { left: sideOffset } : { right: sideOffset }),
  }

  return (
    <div
      className={cn("fixed z-50 print:hidden", className)}
      style={positionStyle}
      data-no-translate
      translate="no"
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--lux-gold)]/30",
            "bg-white/90 px-3 text-xs font-semibold text-amber-950 shadow-md backdrop-blur",
            "transition hover:border-[color:var(--lux-gold)]/55 hover:bg-white hover:shadow-lg",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40",
            "dark:border-[color:var(--lux-gold)]/30 dark:bg-zinc-900/90 dark:text-amber-50",
          )}
          aria-label={t("common.language", "Langue")}
        >
          <Globe className="h-3.5 w-3.5 text-amber-800/90 dark:text-amber-200/90" aria-hidden />
          <span className="tabular-nums tracking-wider">{code}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={isRtl ? "start" : "end"}
          sideOffset={8}
          className={cn(
            "z-[200] min-w-[10rem] rounded-xl border border-[color:var(--lux-gold)]/20",
            "bg-[color:var(--lux-cream)]/98 p-1 shadow-xl",
            "dark:border-[color:var(--lux-gold)]/25 dark:bg-zinc-950/98",
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
    </div>
  )
}
