import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"

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
  const base = slugify(name) + "-" + Date.now().toString(36)
  const supabase = createServiceRoleClient()

  const row = {
    name,
    slug: body.slug ? String(body.slug) : base,
    description: body.description ?? null,
    price: Number(body.price) || 0,
    category_id: body.category_id ?? null,
    image_url: body.image_url ?? null,
    stock_quantity: Number(body.stock_quantity) || 0,
    is_available: body.is_available !== false,
    is_popular: !!body.is_popular,
    is_new: !!body.is_new,
    is_vegetarian: !!body.is_vegetarian,
    is_chef_choice: !!body.is_chef_choice,
    is_recommended: !!body.is_recommended,
    spice_level: body.spice_level ?? null,
    name_ar: body.name_ar ?? null,
    station: body.station ?? "KITCHEN",
    tags: Array.isArray(body.tags) ? body.tags : [],
  }

  const { data, error } = await supabase.from("products").insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const actorEmail = typeof guard.user.email === "string" ? guard.user.email.trim() || null : null
  await insertCaisseAudit(supabase, {
    userId: guard.user.id ?? null,
    userEmail: actorEmail,
    action: "create",
    entityType: "products",
    entityId: String(data.id),
    oldValues: null,
    newValues: JSON.parse(JSON.stringify(data)) as Record<string, unknown>,
    metadata: { source: "api/admin/products POST" },
  })

  return NextResponse.json({ product: data }, { status: 201 })
}
