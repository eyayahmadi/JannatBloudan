import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

/**
 * Liste des ingrédients (sélection / matching factures).
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ ingredients: [], source: "mock" })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from("ingredients")
      .select("id, name, unit, stock_quantity")
      .order("name")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ingredients: data ?? [], source: "supabase" })
  } catch (e) {
    console.error("[admin/ingredients] GET", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
