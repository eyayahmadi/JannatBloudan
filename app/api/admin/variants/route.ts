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
  const [groups, vars] = await Promise.all([
    supabase.from("product_variant_groups").select("*, products(id, name)").order("display_order"),
    supabase.from("product_variants").select("*").order("display_order"),
  ])

  if (groups.error) return NextResponse.json({ error: groups.error.message }, { status: 500 })
  if (vars.error) return NextResponse.json({ error: vars.error.message }, { status: 500 })

  return NextResponse.json({ groups: groups.data ?? [], variants: vars.data ?? [] })
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
  const price = Number(body.price)
  if (!productId || !nameDe || !Number.isFinite(price)) {
    return NextResponse.json({ error: "product_id, name_de, price requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  let groupId = body.group_id ? String(body.group_id) : null

  if (!groupId) {
    const { data: g, error: gErr } = await supabase
      .from("product_variant_groups")
      .insert({
        product_id: productId,
        name_de: "Größe",
        name_ar: "الحجم",
        min_selections: 1,
        max_selections: 1,
        display_order: 0,
      })
      .select()
      .single()
    if (gErr || !g) return NextResponse.json({ error: gErr?.message ?? "Groupe variantes" }, { status: 500 })
    groupId = g.id
  }

  const slug = body.slug ? String(body.slug) : slugify(nameDe)
  const { data, error } = await supabase
    .from("product_variants")
    .insert({
      group_id: groupId,
      slug,
      name_de: nameDe,
      name_ar: body.name_ar ?? null,
      price,
      display_order: Number(body.display_order) || 0,
      is_available: body.is_available !== false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ variant: data }, { status: 201 })
}
