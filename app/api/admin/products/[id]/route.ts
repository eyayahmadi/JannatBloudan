import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }
  const { id } = await ctx.params
  const body = await request.json()
  const supabase = createServiceRoleClient()
  const allowed = [
    "name",
    "slug",
    "description",
    "price",
    "category_id",
    "image_url",
    "stock_quantity",
    "is_available",
    "is_popular",
    "is_new",
    "is_vegetarian",
    "is_chef_choice",
    "is_recommended",
    "spice_level",
    "name_ar",
    "station",
    "tags",
  ] as const
  const update: Record<string, unknown> = {}
  for (const k of allowed) {
    if (body[k] !== undefined) update[k] = body[k]
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 })
  }
  const { data, error } = await supabase.from("products").update(update).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data })
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }
  const { id } = await ctx.params
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
