import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { normalizeProductTags, syncLegacyFieldsFromTags } from "@/lib/menu/product-attributes"
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

function buildProductRow(body: Record<string, unknown>, name: string, slug?: string) {
  const tags = normalizeProductTags(body.tags)
  const legacy = syncLegacyFieldsFromTags(tags)
  return {
    name,
    slug: slug ?? slugify(name) + "-" + Date.now().toString(36),
    description: body.description ?? null,
    description_ar: body.description_ar ?? null,
    price: Number(body.price) || 0,
    category_id: body.category_id ?? null,
    image_url: body.image_url ?? null,
    stock_quantity: Number(body.stock_quantity) || 0,
    is_available: body.is_available !== false,
    is_archived: !!body.is_archived,
    display_order: Number(body.display_order) || 0,
    name_ar: body.name_ar ?? null,
    station: body.station ?? "KITCHEN",
    ...legacy,
  }
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

  const row = buildProductRow(body, name, body.slug ? String(body.slug) : undefined)
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.from("products").insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  invalidateMenuCache()
  return NextResponse.json({ product: data }, { status: 201 })
}
