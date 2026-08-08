import { resolveCategoryDisplayIcon } from "@/lib/menu/category-display-icon"
import type { MenuCategoryRow } from "@/lib/menu/menu-catalog-types"
import { isCategoryVisibleForMenu } from "@/lib/menu/menu-visibility"

export function qrSectionDomId(slug: string): string {
  if (slug === "desserts") return "qr-section-desserts"
  if (slug === "hot-drinks") return "qr-section-hot-drinks"
  if (slug === "cold-drinks") return "qr-section-cold-drinks"
  return `qr-cat-${slug}`
}

export type QrCategoryNavItem = {
  slug: string
  id: string
  labelDe: string
  labelAr: string
  icon: string
}

/** Métadonnées des pages nav virtuelles (regroupements boissons/desserts). */
export const QR_VIRTUAL_NAV_GROUPS: Record<
  string,
  { slug: string; labelDe: string; labelAr: string; icon: string; sortOrder: number }
> = {
  "hot-drinks": {
    slug: "hot-drinks",
    labelDe: "Heißgetränke",
    labelAr: "المشروبات الساخنة",
    icon: "☕",
    sortOrder: 900,
  },
  "cold-drinks": {
    slug: "cold-drinks",
    labelDe: "Kalte Getränke",
    labelAr: "المشروبات الباردة",
    icon: "🥤",
    sortOrder: 910,
  },
  desserts: {
    slug: "desserts",
    labelDe: "Desserts",
    labelAr: "الحلويات",
    icon: "🍰",
    sortOrder: 920,
  },
}

const DEFAULT_GRADIENT = "from-stone-800 via-amber-950 to-stone-900"

/** Construit la navigation QR depuis les catégories Supabase (Admin = source de vérité). */
export function buildQrCategoryNavItemsFromDb(
  categories: MenuCategoryRow[],
  productCategorySlugs?: Set<string>,
): QrCategoryNavItem[] {
  const active = categories.filter(isCategoryVisibleForMenu)
  const hasProducts = (slug: string) =>
    !productCategorySlugs || productCategorySlugs.size === 0 || productCategorySlugs.has(slug)

  const standalone = active
    .filter((c) => !c.nav_group?.trim())
    .filter((c) => hasProducts(c.slug))
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name))

  const nav: Array<QrCategoryNavItem & { sortOrder: number }> = standalone.map((c) => ({
    slug: c.slug,
    id: qrSectionDomId(c.slug),
    labelDe: c.name,
    labelAr: c.name_ar?.trim() || c.name,
    icon: resolveCategoryDisplayIcon(c.slug, c.icon_emoji, "🍽"),
    sortOrder: c.display_order ?? 0,
  }))

  for (const [groupKey, meta] of Object.entries(QR_VIRTUAL_NAV_GROUPS)) {
    const members = active.filter((c) => c.nav_group === groupKey)
    if (members.length === 0) continue
    const withProducts = members.filter((c) => hasProducts(c.slug))
    if (productCategorySlugs && productCategorySlugs.size > 0 && withProducts.length === 0) continue
    const minOrder = Math.min(...members.map((m) => m.display_order ?? meta.sortOrder))
    nav.push({
      slug: meta.slug,
      id: qrSectionDomId(meta.slug),
      labelDe: meta.labelDe,
      labelAr: meta.labelAr,
      icon: meta.icon,
      sortOrder: minOrder,
    })
  }

  return nav
    .sort((a, b) => a.sortOrder - b.sortOrder || a.labelDe.localeCompare(b.labelDe))
    .map(({ sortOrder: _, ...item }) => item)
}

export function resolveQrNavCategorySlugFromDb(
  slug: string,
  categories: MenuCategoryRow[],
): string | null {
  if (slug === "bar") return "cold-drinks"

  if (QR_VIRTUAL_NAV_GROUPS[slug]) {
    const active = categories.filter(isCategoryVisibleForMenu)
    if (active.some((c) => c.nav_group === slug)) return slug
    return null
  }

  const active = categories.filter(isCategoryVisibleForMenu)
  if (active.some((c) => c.slug === slug && !c.nav_group?.trim())) return slug
  return null
}

export function categoryCardGradient(c: MenuCategoryRow): string {
  return c.card_gradient?.trim() || DEFAULT_GRADIENT
}

export function categoriesInNavGroup(
  categories: MenuCategoryRow[],
  groupKey: string,
): MenuCategoryRow[] {
  return categories
    .filter(isCategoryVisibleForMenu)
    .filter((c) => c.nav_group === groupKey)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
}

export function standaloneCategories(categories: MenuCategoryRow[]): MenuCategoryRow[] {
  return categories
    .filter(isCategoryVisibleForMenu)
    .filter((c) => !c.nav_group?.trim())
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
}

export type QrCategoryNavCard = {
  slug: string
  icon: string
  labelDe: string
  labelAr: string
  gradient: string
}

const VIRTUAL_GROUP_GRADIENTS: Record<string, string> = {
  "hot-drinks": "from-cyan-900 via-blue-900 to-indigo-900",
  "cold-drinks": "from-sky-900 via-cyan-900 to-teal-800",
  desserts: "from-fuchsia-900 via-rose-900 to-amber-800",
}

/** Cartes catégories QR — ordre et style depuis Supabase. */
export function buildQrCategoryNavCardsFromDb(
  categories: MenuCategoryRow[],
  menuItems: Array<{ category: string }> = [],
): QrCategoryNavCard[] {
  const productSlugs =
    menuItems.length > 0 ? new Set(menuItems.map((i) => i.category)) : undefined
  const nav = buildQrCategoryNavItemsFromDb(categories, productSlugs)
  const catBySlug = new Map(categories.map((c) => [c.slug, c]))

  return nav.map((item) => {
    const virtualGrad = VIRTUAL_GROUP_GRADIENTS[item.slug]
    if (virtualGrad) {
      return {
        slug: item.slug,
        icon: item.icon,
        labelDe: item.labelDe,
        labelAr: item.labelAr,
        gradient: virtualGrad,
      }
    }
    const cat = catBySlug.get(item.slug)
    return {
      slug: item.slug,
      icon: item.icon,
      labelDe: item.labelDe,
      labelAr: item.labelAr,
      gradient: cat ? categoryCardGradient(cat) : DEFAULT_GRADIENT,
    }
  })
}

/** Première catégorie nav active (redirect menu index). */
export function defaultQrCategorySlug(categories: MenuCategoryRow[]): string {
  return buildQrCategoryNavItemsFromDb(categories)[0]?.slug ?? "entrees"
}

export function navMetaFromSlug(
  slug: string,
  categories: MenuCategoryRow[],
): { slug: string; labelDe: string; labelAr: string; icon: string } | undefined {
  const nav = buildQrCategoryNavItemsFromDb(categories).find((n) => n.slug === slug)
  if (!nav) return undefined
  return { slug: nav.slug, labelDe: nav.labelDe, labelAr: nav.labelAr, icon: nav.icon }
}
