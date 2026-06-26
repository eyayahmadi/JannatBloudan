import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

/**
 * Données complètes pour Admin > Menu Management.
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const supabase = createServiceRoleClient()
  const [cat, prod, ing, recs, modGroups, mods, varGroups, vars] = await Promise.all([
    supabase.from("categories").select("*").order("display_order").order("name"),
    supabase
      .from("products")
      .select(
        `*, categories ( id, name, slug, section ), product_ingredients ( quantity, ingredients ( id, name, unit, stock_quantity ) )`,
      )
      .order("display_order")
      .order("name"),
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

  if (cat.error) return NextResponse.json({ error: cat.error.message }, { status: 500 })
  if (prod.error) return NextResponse.json({ error: prod.error.message }, { status: 500 })
  if (ing.error) return NextResponse.json({ error: ing.error.message }, { status: 500 })

  const recommendations: Record<string, string[]> = {}
  if (!recs.error) {
    for (const r of recs.data ?? []) {
      const pid = String(r.product_id)
      if (!recommendations[pid]) recommendations[pid] = []
      recommendations[pid].push(String(r.recommended_product_id))
    }
  }

  return NextResponse.json({
    categories: cat.data ?? [],
    products: prod.data ?? [],
    ingredients: ing.data ?? [],
    recommendations,
    modifier_groups: modGroups.data ?? [],
    modifiers: mods.data ?? [],
    variant_groups: varGroups.data ?? [],
    variants: vars.data ?? [],
  })
}
