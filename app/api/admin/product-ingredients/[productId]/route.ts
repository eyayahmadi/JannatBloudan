import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type Ctx = { params: Promise<{ productId: string }> }

/**
 * Remplace les lignes de recette (product_ingredients) pour un produit.
 * Body: { lines: { ingredient_id: string, quantity: number }[] }
 */
export async function PUT(request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }
  const { productId } = await ctx.params
  const body = await request.json()
  const lines = Array.isArray(body.lines) ? body.lines : []
  const supabase = createServiceRoleClient()

  const { error: delErr } = await supabase.from("product_ingredients").delete().eq("product_id", productId)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  if (lines.length === 0) {
    return NextResponse.json({ success: true, count: 0 })
  }

  const rows = lines
    .filter((l: { ingredient_id?: string; quantity?: number }) => l.ingredient_id)
    .map((l: { ingredient_id: string; quantity: number }) => ({
      product_id: productId,
      ingredient_id: l.ingredient_id,
      quantity: Math.max(0, Number(l.quantity) || 0),
    }))

  const { error: insErr } = await supabase.from("product_ingredients").insert(rows)
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ success: true, count: rows.length })
}
