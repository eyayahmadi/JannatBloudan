import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type Ctx = { params: Promise<{ id: string }> }

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
}

export async function POST(_request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const { id } = await ctx.params
  const supabase = createServiceRoleClient()
  const { data: src, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle()
  if (error || !src) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

  const copyName = `${src.name} (Kopie)`
  const { id: _id, created_at: _ca, updated_at: _ua, slug: _slug, ...rest } = src as Record<string, unknown>
  const { data: created, error: insErr } = await supabase
    .from("products")
    .insert({
      ...rest,
      name: copyName,
      slug: slugify(copyName) + "-" + Date.now().toString(36),
      is_archived: false,
    })
    .select()
    .single()
  if (insErr || !created) return NextResponse.json({ error: insErr?.message ?? "Duplication échouée" }, { status: 500 })

  const newId = String(created.id)

  const [modGroups, varGroups, recs] = await Promise.all([
    supabase.from("product_modifier_groups").select("*").eq("product_id", id),
    supabase.from("product_variant_groups").select("*").eq("product_id", id),
    supabase.from("product_recommendations").select("*").eq("product_id", id),
  ])

  for (const g of modGroups.data ?? []) {
    const { id: gid, product_id: _p, created_at: _c, ...gRest } = g as Record<string, unknown>
    const { data: newG } = await supabase
      .from("product_modifier_groups")
      .insert({ ...gRest, product_id: newId })
      .select()
      .single()
    if (!newG) continue
    const { data: mods } = await supabase.from("product_modifiers").select("*").eq("group_id", gid)
    for (const m of mods ?? []) {
      const { id: _mid, group_id: _g, created_at: _mc, ...mRest } = m as Record<string, unknown>
      await supabase.from("product_modifiers").insert({ ...mRest, group_id: newG.id })
    }
  }

  for (const g of varGroups.data ?? []) {
    const { id: gid, product_id: _p, created_at: _c, ...gRest } = g as Record<string, unknown>
    const { data: newG } = await supabase
      .from("product_variant_groups")
      .insert({ ...gRest, product_id: newId })
      .select()
      .single()
    if (!newG) continue
    const { data: vars } = await supabase.from("product_variants").select("*").eq("group_id", gid)
    for (const v of vars ?? []) {
      const { id: _vid, group_id: _g, created_at: _vc, ...vRest } = v as Record<string, unknown>
      await supabase.from("product_variants").insert({ ...vRest, group_id: newG.id })
    }
  }

  for (const r of recs.data ?? []) {
    const { id: _rid, product_id: _p, created_at: _rc, ...rRest } = r as Record<string, unknown>
    await supabase.from("product_recommendations").insert({ ...rRest, product_id: newId })
  }

  return NextResponse.json({ product: created }, { status: 201 })
}
