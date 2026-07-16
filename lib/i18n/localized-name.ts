import type { Locale } from "@/lib/i18n/config"

type LocalizedEntity = {
  name?: string | null
  name_de?: string | null
  name_fr?: string | null
  name_en?: string | null
  name_ar?: string | null
  label?: string | null
  label_de?: string | null
  label_fr?: string | null
  label_en?: string | null
  label_ar?: string | null
  title?: string | null
  title_de?: string | null
  title_fr?: string | null
  title_en?: string | null
  title_ar?: string | null
}

const LOCALE_FIELD: Record<Locale, "de" | "fr" | "en" | "ar"> = {
  fr: "fr",
  en: "en",
  de: "de",
  ar: "ar",
}

function pickField(
  entity: LocalizedEntity,
  prefix: "name" | "label" | "title",
  locale: Locale,
): string | null {
  const code = LOCALE_FIELD[locale]
  const localized = entity[`${prefix}_${code}` as keyof LocalizedEntity]
  if (typeof localized === "string" && localized.trim()) return localized.trim()
  return null
}

/** Resolve localized display name from DB fields (name_de, name_fr, name_ar, name_en). */
export function resolveLocalizedName(
  entity: LocalizedEntity | null | undefined,
  locale: Locale,
  fallback = "",
): string {
  if (!entity) return fallback
  for (const prefix of ["name", "label", "title"] as const) {
    const localized = pickField(entity, prefix, locale)
    if (localized) return localized
  }
  const generic =
    (typeof entity.name === "string" && entity.name.trim()) ||
    (typeof entity.label === "string" && entity.label.trim()) ||
    (typeof entity.title === "string" && entity.title.trim()) ||
    (typeof entity.name_de === "string" && entity.name_de.trim()) ||
    ""
  return generic || fallback
}
