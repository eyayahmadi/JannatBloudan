/** Emoji that look like cigarettes/cigars — never use for Shisha in client menus. */
const CIGARETTE_LIKE_ICONS = new Set(["🚬", "🚭"])

const SHISHA_CATEGORY_SLUGS = new Set(["shisha", "imperator"])

/** Neutral smoke icon for hookah / shisha categories (display layer only). */
export const SHISHA_CATEGORY_ICON = "💨"

/**
 * Resolve category icon for menus (QR, site, POS, delivery).
 * Replaces cigarette/cigar-style icons on shisha categories without changing DB data.
 */
export function resolveCategoryDisplayIcon(
  categorySlug: string | null | undefined,
  iconEmoji?: string | null,
  fallback = "🍽️",
): string {
  const slug = categorySlug?.trim().toLowerCase() ?? ""
  const raw = iconEmoji?.trim()

  if (SHISHA_CATEGORY_SLUGS.has(slug)) {
    if (!raw || CIGARETTE_LIKE_ICONS.has(raw)) return SHISHA_CATEGORY_ICON
    return raw
  }

  if (raw && CIGARETTE_LIKE_ICONS.has(raw)) return SHISHA_CATEGORY_ICON
  return raw || fallback
}
