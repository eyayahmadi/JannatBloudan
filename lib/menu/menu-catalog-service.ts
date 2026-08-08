import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import type {
  MenuCatalogLoadOptions,
  MenuCategoryRow,
  SafeDeleteResult,
} from "@/lib/menu/menu-catalog-types"
import { filterVisibleCategories, isProductListedInCatalog } from "@/lib/menu/menu-visibility"

export const MENU_CATALOG_CACHE_TAG = "menu-catalog"

function isMissingColumnError(msg: string | undefined): boolean {
  if (!msg) return false
  const m = msg.toLowerCase()
  return m.includes("does not exist") || m.includes("column ") || m.includes("unknown")
}

function normalizeCategory(c: Record<string, unknown>): MenuCategoryRow {
  return {
    id: String(c.id),
    name: String(c.name ?? ""),
    slug: String(c.slug ?? ""),
    section: typeof c.section === "string" ? c.section : "food",
    display_order: Number(c.display_order) || 0,
    icon_emoji: c.icon_emoji != null ? String(c.icon_emoji) : null,
    name_ar: c.name_ar != null ? String(c.name_ar) : null,
    description: c.description != null ? String(c.description) : null,
    is_active: c.is_active !== false,
    deleted_at: c.deleted_at != null ? String(c.deleted_at) : null,
    nav_group: c.nav_group != null ? String(c.nav_group) : null,
    card_gradient: c.card_gradient != null ? String(c.card_gradient) : null,
  }
}

const CATEGORY_SELECT_FULL =
  "id, name, slug, section, display_order, icon_emoji, name_ar, description, is_active, deleted_at, nav_group, card_gradient"

const CATEGORY_SELECT_MINIMAL = "id, name, slug, section, display_order, icon_emoji, name_ar, description, is_active"

/** Charge les catégories — source unique Admin + menus client. */
export async function getActiveCategories(
  supabase: SupabaseClient,
  options: MenuCatalogLoadOptions = {},
): Promise<{ rows: MenuCategoryRow[]; error: string | null }> {
  const { includeInactive = false, includeDeleted = false } = options

  let query = supabase
    .from("categories")
    .select(CATEGORY_SELECT_FULL)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })

  if (!includeInactive) query = query.eq("is_active", true)
  if (!includeDeleted) query = query.is("deleted_at", null)

  const full = await query

  if (!full.error) {
    const rows = (full.data ?? []).map((c) => normalizeCategory(c as Record<string, unknown>))
    return {
      rows: includeInactive || includeDeleted ? rows : filterVisibleCategories(rows),
      error: null,
    }
  }

  if (!isMissingColumnError(full.error.message)) {
    return { rows: [], error: full.error.message }
  }

  let fallback = supabase
    .from("categories")
    .select(CATEGORY_SELECT_MINIMAL)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })

  if (!includeInactive) fallback = fallback.eq("is_active", true)

  const res = await fallback
  if (res.error) return { rows: [], error: res.error.message }

  const rows = (res.data ?? []).map((c) => normalizeCategory(c as Record<string, unknown>))
  return {
    rows: includeInactive ? rows : filterVisibleCategories(rows),
    error: null,
  }
}

export const MENU_PRODUCTS_SELECT = `id, name, name_ar, slug, description, description_ar, price, image_url, is_available, is_popular, is_new,
  is_chef_choice, is_recommended, is_vegetarian, spice_level, stock_quantity, tags, station, display_order, created_at,
  is_archived, deleted_at,
  categories ( id, name, slug, section, display_order, is_active, deleted_at ),
  product_ingredients ( quantity, ingredients ( id, name, unit, stock_quantity, threshold_low, threshold_critical ) )`

/** Charge les produits bruts — filtrage visibilité via isProductListedInCatalog. */
export async function getActiveProducts(
  supabase: SupabaseClient,
  options: MenuCatalogLoadOptions = {},
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const { includeInactive = false, includeDeleted = false } = options

  let query = supabase
    .from("products")
    .select(MENU_PRODUCTS_SELECT)
    .order("display_order")
    .order("name")

  if (!includeDeleted) query = query.is("deleted_at", null)
  if (!includeInactive) query = query.eq("is_archived", false)

  const res = await query
  if (res.error) return { rows: [], error: res.error.message }

  let rows = (res.data ?? []) as Record<string, unknown>[]
  if (!includeInactive && !includeDeleted) {
    rows = rows.filter((r) =>
      isProductListedInCatalog(
        r as {
          is_archived?: boolean
          deleted_at?: string | null
          categories?: { is_active?: boolean; deleted_at?: string | null } | null
        },
      ),
    )
  }

  return { rows, error: null }
}

export async function getProductsByCategoryId(
  supabase: SupabaseClient,
  categoryId: string,
  options?: MenuCatalogLoadOptions,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const { rows, error } = await getActiveProducts(supabase, options)
  if (error) return { rows: [], error }
  return {
    rows: rows.filter((r) => {
      const cat = r.categories as { id?: string } | null
      return cat?.id === categoryId
    }),
    error: null,
  }
}

async function categoryHasOrderHistory(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<boolean> {
  const { data: products } = await supabase.from("products").select("id").eq("category_id", categoryId)
  const ids = (products ?? []).map((p) => String(p.id))
  if (ids.length === 0) return false

  const { count } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .in("product_id", ids)
    .limit(1)

  return (count ?? 0) > 0
}

async function productHasOrderHistory(supabase: SupabaseClient, productId: string): Promise<boolean> {
  const { count } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId)
    .limit(1)
  return (count ?? 0) > 0
}

/** Suppression sûre catégorie — archive si historique commandes. */
export async function deleteCategorySafe(
  supabase: SupabaseClient,
  categoryId: string,
  opts?: { archiveProducts?: boolean },
): Promise<SafeDeleteResult> {
  const { data: cat } = await supabase.from("categories").select("id, name").eq("id", categoryId).maybeSingle()
  if (!cat) return { ok: false, error: "Catégorie introuvable", code: "NOT_FOUND" }

  const { count: liveProducts } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .is("deleted_at", null)
    .eq("is_archived", false)

  if ((liveProducts ?? 0) > 0 && !opts?.archiveProducts) {
    return {
      ok: false,
      error: "Cette catégorie contient encore des produits actifs. Déplacez-les ou archivez-les d'abord.",
      code: "HAS_ACTIVE_PRODUCTS",
    }
  }

  const hasHistory = await categoryHasOrderHistory(supabase, categoryId)
  const now = new Date().toISOString()

  if (hasHistory) {
    await supabase
      .from("products")
      .update({ is_archived: true, is_available: false, deleted_at: now })
      .eq("category_id", categoryId)

    const { error } = await supabase
      .from("categories")
      .update({ is_active: false, deleted_at: now })
      .eq("id", categoryId)

    if (error) return { ok: false, error: error.message }
    return { ok: true, mode: "archived" }
  }

  await supabase.from("products").delete().eq("category_id", categoryId)
  const { error } = await supabase.from("categories").delete().eq("id", categoryId)
  if (error) return { ok: false, error: error.message }
  return { ok: true, mode: "deleted" }
}

/** Suppression sûre produit — archive si référencé par order_items. */
export async function deleteProductSafe(
  supabase: SupabaseClient,
  productId: string,
): Promise<SafeDeleteResult> {
  const { data: prod } = await supabase.from("products").select("id").eq("id", productId).maybeSingle()
  if (!prod) return { ok: false, error: "Produit introuvable", code: "NOT_FOUND" }

  const hasHistory = await productHasOrderHistory(supabase, productId)
  const now = new Date().toISOString()

  if (hasHistory) {
    const { error } = await supabase
      .from("products")
      .update({ is_archived: true, is_available: false, deleted_at: now })
      .eq("id", productId)
    if (error) return { ok: false, error: error.message }
    return { ok: true, mode: "archived" }
  }

  const { error } = await supabase.from("products").delete().eq("id", productId)
  if (error) return { ok: false, error: error.message }
  return { ok: true, mode: "deleted" }
}

/** Invalide caches Next.js après mutation Admin — pas de redeploy requis. */
export function invalidateMenuCache(): void {
  revalidatePath("/api/menu")
  revalidatePath("/menu")
  revalidatePath("/table", "layout")
  revalidatePath("/server", "layout")
  revalidatePath("/pos")
  revalidatePath("/delivery")
}
