/** Emoji that look like cigarettes/cigars — never use for Shisha in client menus. */
const CIGARETTE_LIKE_ICONS = new Set(["🚬", "🚭", "🪝"])

const SHISHA_CATEGORY_SLUGS = new Set(["shisha", "imperator", "chicha", "hookah"])

/** Neutral smoke icon for hookah / shisha categories (display layer only). */
export const SHISHA_CATEGORY_ICON = "💨"

export function isShishaCategorySlug(categorySlug: string | null | undefined): boolean {
  const slug = categorySlug?.trim().toLowerCase() ?? ""
  return SHISHA_CATEGORY_SLUGS.has(slug) || slug.includes("shisha") || slug.includes("hookah")
}

/**
 * Resolve category icon for menus (QR, site, POS, delivery).
 * Shisha categories ALWAYS use smoke icon — never cigar/cigarette from DB.
 */
export function resolveCategoryDisplayIcon(
  categorySlug: string | null | undefined,
  iconEmoji?: string | null,
  fallback = "🍽️",
): string {
  const slug = categorySlug?.trim().toLowerCase() ?? ""
  const raw = iconEmoji?.trim()

  if (isShishaCategorySlug(slug)) {
    return SHISHA_CATEGORY_ICON
  }

  if (raw && CIGARETTE_LIKE_ICONS.has(raw)) return SHISHA_CATEGORY_ICON
  return raw || fallback
}
