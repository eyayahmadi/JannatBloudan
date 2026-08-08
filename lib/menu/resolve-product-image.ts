import { isPlaceholderImage } from "@/lib/menu/menu-display"

/** Prefer Admin CMS image_url — no local/static product image fallback. */
export function resolveMenuProductImageUrl(
  imageUrl: string | null | undefined,
  _categorySlug: string,
  _productSlug: string,
): string | null {
  if (imageUrl && !isPlaceholderImage(imageUrl)) return imageUrl
  return imageUrl ?? null
}
