import type { Locale } from "@/lib/i18n/config"

/** Resolve QR printed-menu category label for the active locale. */
export function resolveQrCategoryLabel(
  slug: string,
  locale: Locale,
  t: (path: string) => string,
  fallbackDe: string,
  fallbackAr?: string,
): { primary: string; secondary?: string } {
  const key = `menu.qrCategory.${slug}`
  const translated = t(key)
  const primary = translated !== key ? translated : fallbackDe

  if (locale === "ar" && fallbackAr) {
    return { primary: fallbackAr, secondary: undefined }
  }

  if (locale === "de") {
    return { primary, secondary: fallbackAr }
  }

  return { primary, secondary: fallbackAr }
}
