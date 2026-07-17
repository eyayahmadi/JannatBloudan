import { isPlaceholderImage } from "@/lib/menu/menu-display"

/** Categories whose product photos are served from /public/images/menu/{category}/. */
const LOCAL_MENU_IMAGE_CATEGORIES = new Set(["tajine", "hauptgerichte"])

/**
 * Prefer a real menu photo over /placeholder.svg.
 * Tajine + Hauptgerichte ship WebP assets in public/images/menu/ until Storage upload completes.
 */
export function resolveMenuProductImageUrl(
  imageUrl: string | null | undefined,
  categorySlug: string,
  productSlug: string,
): string | null {
  if (imageUrl && !isPlaceholderImage(imageUrl)) return imageUrl
  if (productSlug && LOCAL_MENU_IMAGE_CATEGORIES.has(categorySlug)) {
    return `/images/menu/${categorySlug}/${productSlug}.webp`
  }
  return imageUrl ?? null
}
