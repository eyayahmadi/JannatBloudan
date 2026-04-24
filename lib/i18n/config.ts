/**
 * i18n configuration
 * ------------------
 * Multilingue FR / EN / DE / AR, RTL pour l'arabe.
 * Option : NEXT_PUBLIC_I18N_AUTO + GOOGLE_TRANSLATE_API_KEY pour traduire
 * automatiquement depuis le referentiel FR (route /api/i18n/translate).
 */

export type Locale = "fr" | "en" | "ar" | "de"

export const LOCALES: Locale[] = ["fr", "en", "de", "ar"]

export const DEFAULT_LOCALE: Locale = "fr"

export const LOCALE_META: Record<
  Locale,
  { label: string; nativeLabel: string; flag: string; dir: "ltr" | "rtl" }
> = {
  fr: { label: "French", nativeLabel: "Français", flag: "🇫🇷", dir: "ltr" },
  en: { label: "English", nativeLabel: "English", flag: "🇬🇧", dir: "ltr" },
  de: { label: "German", nativeLabel: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  ar: { label: "Arabic", nativeLabel: "العربية", flag: "🇹🇳", dir: "rtl" },
}

export const COOKIE_KEY = "locale"
export const STORAGE_KEY = "app_locale"

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as string[]).includes(v)
}

/**
 * Côté client : si 1, charge les traductions via /api/i18n/translate (Google) à partir du français.
 * Nécessite GOOGLE_TRANSLATE_API_KEY côté serveur (.env.local).
 */
export const I18N_AUTO_ENABLED: boolean =
  process.env.NEXT_PUBLIC_I18N_AUTO === "1" ||
  process.env.NEXT_PUBLIC_I18N_AUTO === "true"
