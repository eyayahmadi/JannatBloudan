/** Types partagés — catalogue menu canonique (Supabase). */

export type MenuSection = "food" | "desserts" | "drinks" | "special"

export type MenuNavGroup = "hot-drinks" | "cold-drinks" | "desserts" | null

export type MenuCategoryRow = {
  id: string
  name: string
  slug: string
  section?: MenuSection | string | null
  display_order?: number
  icon_emoji?: string | null
  name_ar?: string | null
  description?: string | null
  is_active?: boolean | null
  deleted_at?: string | null
  nav_group?: MenuNavGroup | string | null
  card_gradient?: string | null
}

export type MenuCatalogLoadOptions = {
  /** Admin : inclure archivés / inactifs */
  includeInactive?: boolean
  /** Admin : inclure soft-deleted */
  includeDeleted?: boolean
}

export type SafeDeleteResult =
  | { ok: true; mode: "deleted" }
  | { ok: true; mode: "archived" }
  | { ok: false; error: string; code?: string }
