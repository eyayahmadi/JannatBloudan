import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
}

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const supabase = createServiceRoleClient()
  const [groups, mods] = await Promise.all([
    supabase.from("product_modifier_groups").select("*, products(id, name)").order("display_order"),
    supabase.from("product_modifiers").select("*").order("display_order"),
  ])

  if (groups.error) return NextResponse.json({ error: groups.error.message }, { status: 500 })
  if (mods.error) return NextResponse.json({ error: mods.error.message }, { status: 500 })

  return NextResponse.json({
    groups: groups.data ?? [],
    modifiers: mods.data ?? [],
  })
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json()
  const productId = String(body.product_id ?? "")
  const nameDe = String(body.name_de ?? "").trim()
  if (!productId || !nameDe) {
    return NextResponse.json({ error: "product_id et name_de requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  let groupId = body.group_id ? String(body.group_id) : null

  if (!groupId) {
    const { data: g, error: gErr } = await supabase
      .from("product_modifier_groups")
      .insert({
        product_id: productId,
        name_de: "Extras",
        name_ar: "إضافات",
        min_selections: 0,
        max_selections: 12,
        display_order: 0,
      })
      .select()
      .single()
    if (gErr || !g) return NextResponse.json({ error: gErr?.message ?? "Groupe extras" }, { status: 500 })
    groupId = g.id
  }

  const slug = body.slug ? String(body.slug) : slugify(nameDe)
  const { data, error } = await supabase
    .from("product_modifiers")
    .insert({
      group_id: groupId,
      slug,
      name_de: nameDe,
      name_ar: body.name_ar ?? null,
      price: Number(body.price) || 0,
      display_order: Number(body.display_order) || 0,
      is_available: body.is_available !== false,
      image_url: body.image_url ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ modifier: data }, { status: 201 })
}
