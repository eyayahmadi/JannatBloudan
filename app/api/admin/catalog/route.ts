import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { getAdminMenuCatalog } from "@/lib/menu/menu-catalog-service"
import { sortByMenuCardOrder } from "@/lib/menu/menu-order"

export const dynamic = "force-dynamic"

/**
 * Données complètes pour Admin > Menu Management.
 * Categories + products via menu-catalog-service (same Supabase tables as /api/menu).
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const supabase = createServiceRoleClient()
  const { categories, products, error: catalogErr } = await getAdminMenuCatalog(supabase)
  if (catalogErr) {
    return NextResponse.json({ error: catalogErr }, { status: 500 })
  }

  const [ing, recs, modGroups, mods, varGroups, vars] = await Promise.all([
    supabase.from("ingredients").select("id, name, unit, stock_quantity").order("name"),
    supabase
      .from("product_recommendations")
      .select("id, product_id, recommended_product_id, display_order")
      .order("display_order"),
    supabase.from("product_modifier_groups").select("*").order("display_order"),
    supabase.from("product_modifiers").select("*").order("display_order"),
    supabase.from("product_variant_groups").select("*").order("display_order"),
    supabase.from("product_variants").select("*").order("display_order"),
  ])

  if (ing.error) return NextResponse.json({ error: ing.error.message }, { status: 500 })

  const recommendations: Record<string, string[]> = {}
  if (!recs.error) {
    for (const r of recs.data ?? []) {
      const pid = String(r.product_id)
      if (!recommendations[pid]) recommendations[pid] = []
      recommendations[pid].push(String(r.recommended_product_id))
    }
  }

  return NextResponse.json(
    {
      categories,
      products: sortByMenuCardOrder(
        products.map((p: Record<string, unknown> & { categories?: { display_order?: number } | null }) => ({
          ...p,
          category_display_order: p.categories?.display_order ?? 0,
          display_order: Number(p.display_order) || 0,
          id: String(p.id ?? ""),
        })),
      ),
      ingredients: ing.data ?? [],
      recommendations,
      modifier_groups: modGroups.data ?? [],
      modifiers: mods.data ?? [],
      variant_groups: varGroups.data ?? [],
      variants: vars.data ?? [],
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  )
}
