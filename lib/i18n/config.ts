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
 * Côté client : si 1/true, charge les traductions via `/api/i18n/translate` (Google)
 * à partir du référentiel FR, puis mise en cache localStorage.
 * `NEXT_PUBLIC_AUTO_TRANSLATION` est un alias équivalent.
 * Nécessite `GOOGLE_TRANSLATE_API_KEY` côté serveur.
 */
function readAutoTranslationEnv(): boolean {
  const keys = ["NEXT_PUBLIC_I18N_AUTO", "NEXT_PUBLIC_AUTO_TRANSLATION"]
  for (const k of keys) {
    const v = typeof process.env[k] === "string" ? process.env[k]!.trim().toLowerCase() : ""
    if (["1", "true", "yes"].includes(v)) return true
  }
  return false
}

export const I18N_AUTO_ENABLED: boolean = readAutoTranslationEnv()
