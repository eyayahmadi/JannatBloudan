import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { invalidateMenuCache } from "@/lib/menu/menu-catalog-service"

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json()
  const name = String(body.name ?? "").trim()
  if (!name) return NextResponse.json({ error: "name requis" }, { status: 400 })
  const slug = body.slug ? String(body.slug) : slugify(name) + "-" + Date.now().toString(36)
  const section = (body.section ?? "food") as string
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      description: body.description ?? null,
      section,
      display_order: Number(body.display_order) || 0,
      is_active: body.is_active !== false,
      name_ar: body.name_ar ?? null,
      icon_emoji: body.icon_emoji ?? null,
      nav_group: body.nav_group ?? null,
      card_gradient: body.card_gradient ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  invalidateMenuCache()
  return NextResponse.json({ category: data }, { status: 201 })
}
