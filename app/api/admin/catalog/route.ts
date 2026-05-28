import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

/**
 * Données complètes pour Admin > Gestion du menu (tous produits, recettes liées).
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const supabase = createServiceRoleClient()
  const [cat, prod, ing] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("products")
      .select(
        `*, categories ( id, name, slug ), product_ingredients ( quantity, ingredients ( id, name, unit, stock_quantity ) )`,
      )
      .order("name"),
    supabase.from("ingredients").select("id, name, unit, stock_quantity").order("name"),
  ])

  if (cat.error) return NextResponse.json({ error: cat.error.message }, { status: 500 })
  if (prod.error) return NextResponse.json({ error: prod.error.message }, { status: 500 })
  if (ing.error) return NextResponse.json({ error: ing.error.message }, { status: 500 })

  return NextResponse.json({
    categories: cat.data ?? [],
    products: prod.data ?? [],
    ingredients: ing.data ?? [],
  })
}
