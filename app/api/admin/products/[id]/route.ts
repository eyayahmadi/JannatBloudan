import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { normalizeProductTags, syncLegacyFieldsFromTags } from "@/lib/menu/product-attributes"
import { deleteProductSafe, invalidateMenuCache } from "@/lib/menu/menu-catalog-service"

type Ctx = { params: Promise<{ id: string }> }

function serializeRow<R extends Record<string, unknown>>(row: R): Record<string, unknown> {
  return JSON.parse(JSON.stringify(row)) as Record<string, unknown>
}

const ALLOWED = [
  "name",
  "slug",
  "description",
  "description_ar",
  "price",
  "category_id",
  "image_url",
  "stock_quantity",
  "is_available",
  "is_archived",
  "display_order",
  "is_popular",
  "is_new",
  "is_vegetarian",
  "is_vegan",
  "is_halal",
  "is_gluten_free",
  "is_chef_choice",
  "is_recommended",
  "spice_level",
  "name_ar",
  "station",
  "tags",
] as const

export async function PATCH(request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }
  const { id } = await ctx.params
  const body = await request.json()
  const supabase = createServiceRoleClient()

  const { data: before, error: beforeErr } = await supabase.from("products").select("*").eq("id", id).maybeSingle()
  if (beforeErr || !before) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  }

  const update: Record<string, unknown> = {}
  if (body.tags !== undefined) {
    const tags = normalizeProductTags(body.tags)
    Object.assign(update, syncLegacyFieldsFromTags(tags))
  }
  for (const k of ALLOWED) {
    if (body[k] !== undefined && k !== "tags") update[k] = body[k]
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 })
  }

  const { data, error } = await supabase.from("products").update(update).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const actorEmail = typeof guard.user.email === "string" ? guard.user.email.trim() || null : null
  await insertCaisseAudit(supabase, {
    userId: guard.user.id ?? null,
    userEmail: actorEmail,
    action: "update",
    entityType: "products",
    entityId: id,
    oldValues: serializeRow(before as Record<string, unknown>),
    newValues: serializeRow(data as Record<string, unknown>),
    metadata: { source: "api/admin/products PATCH" },
  })

  invalidateMenuCache()
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

  const { data: before, error: beforeErr } = await supabase.from("products").select("*").eq("id", id).maybeSingle()
  if (beforeErr || !before) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  }

  const result = await deleteProductSafe(supabase, id)
  if (!result.ok) {
    const status = result.code === "NOT_FOUND" ? 404 : 500
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }

  const actorEmail = typeof guard.user.email === "string" ? guard.user.email.trim() || null : null
  await insertCaisseAudit(supabase, {
    userId: guard.user.id ?? null,
    userEmail: actorEmail,
    action: result.mode === "archived" ? "archive" : "delete",
    entityType: "products",
    entityId: id,
    oldValues: serializeRow(before as Record<string, unknown>),
    newValues: null,
    metadata: { source: "api/admin/products DELETE", mode: result.mode },
  })

  invalidateMenuCache()
  return NextResponse.json({ success: true, mode: result.mode })
}
