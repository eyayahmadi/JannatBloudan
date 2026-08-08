import type { MenuCategoryRow } from "@/lib/menu/menu-catalog-types"

type ProductLike = {
  is_available?: boolean | null
  is_archived?: boolean | null
  deleted_at?: string | null
  categories?: { is_active?: boolean | null; deleted_at?: string | null } | null
}

/** Catégorie visible dans les menus client (QR, site, POS, serveur). */
export function isCategoryVisibleForMenu(c: MenuCategoryRow): boolean {
  if (c.is_active === false) return false
  if (c.deleted_at) return false
  if (!c.slug?.trim()) return false
  return true
}

/** Produit visible dans les menus client actifs. */
export function isProductVisibleForMenu(p: ProductLike): boolean {
  if (p.is_archived) return false
  if (p.deleted_at) return false
  if (p.is_available === false) return false
  const cat = p.categories
  if (cat) {
    if (cat.is_active === false) return false
    if (cat.deleted_at) return false
  }
  return true
}

/** Produit commandable (peut encore apparaître grisé si stock/ station — géré en enrich). */
export function isProductListedInCatalog(p: ProductLike): boolean {
  if (p.is_archived) return false
  if (p.deleted_at) return false
  const cat = p.categories
  if (cat) {
    if (cat.is_active === false) return false
    if (cat.deleted_at) return false
  }
  return true
}

export function filterVisibleCategories(rows: MenuCategoryRow[]): MenuCategoryRow[] {
  return rows.filter(isCategoryVisibleForMenu)
}

export function filterListedProducts<T extends ProductLike>(rows: T[]): T[] {
  return rows.filter(isProductListedInCatalog)
}
