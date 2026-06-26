import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type Ctx = { params: Promise<{ productId: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const { productId } = await ctx.params
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("product_recommendations")
    .select("id, recommended_product_id, display_order")
    .eq("product_id", productId)
    .order("display_order")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    recommended_product_ids: (data ?? []).map((r) => r.recommended_product_id),
  })
}

export async function PUT(request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const { productId } = await ctx.params
  const body = await request.json()
  const ids = Array.isArray(body.recommended_product_ids)
    ? body.recommended_product_ids.map(String)
    : []

  const supabase = createServiceRoleClient()
  await supabase.from("product_recommendations").delete().eq("product_id", productId)

  if (ids.length > 0) {
    const rows = ids
      .filter((rid: string) => rid !== productId)
      .map((recommended_product_id: string, i: number) => ({
        product_id: productId,
        recommended_product_id,
        display_order: i,
      }))
    const { error } = await supabase.from("product_recommendations").insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, recommended_product_ids: ids })
}
