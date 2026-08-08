import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { deleteCategorySafe, invalidateMenuCache } from "@/lib/menu/menu-catalog-service"

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
  const update: Record<string, unknown> = {}
  for (const k of [
    "name",
    "slug",
    "description",
    "section",
    "display_order",
    "is_active",
    "name_ar",
    "icon_emoji",
    "nav_group",
    "card_gradient",
  ] as const) {
    if (body[k] !== undefined) update[k] = body[k]
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 })
  }
  const { data, error } = await supabase.from("categories").update(update).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  invalidateMenuCache()
  return NextResponse.json({ category: data })
}

export async function DELETE(request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }
  const { id } = await ctx.params
  const body = await request.json().catch(() => ({}))
  const archiveProducts = body.archiveProducts === true
  const supabase = createServiceRoleClient()
  const result = await deleteCategorySafe(supabase, id, { archiveProducts })
  if (!result.ok) {
    const status = result.code === "NOT_FOUND" ? 404 : result.code === "HAS_ACTIVE_PRODUCTS" ? 409 : 500
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }
  invalidateMenuCache()
  return NextResponse.json({ success: true, mode: result.mode })
}
