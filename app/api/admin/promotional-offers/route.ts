import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const ADMIN_STAFF_CASHIER = ["ADMIN", "STAFF", "CASHIER"] as const

export async function GET() {
  const guard = await requireRoles(ADMIN_STAFF_CASHIER)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ offers: [], disabled: true })

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("promotional_offers")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = data ?? []
  const offers = rows.filter((r: { archived_at?: unknown }) => !r.archived_at)
  return NextResponse.json({ offers })
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : ""
  const offer_type = typeof body.offer_type === "string" ? body.offer_type.trim().slice(0, 40) : ""
  const value_num = body.value_num != null ? Number(body.value_num) : null

  if (!name || !offer_type) {
    return NextResponse.json({ error: "name et offer_type requis" }, { status: 400 })
  }

  const promo_code =
    typeof body.promo_code === "string" && body.promo_code.trim() ? body.promo_code.trim().slice(0, 64) : null
  const min_order_amount = body.min_order_amount != null ? Number(body.min_order_amount) : null
  const usage_limit = body.usage_limit != null ? Number(body.usage_limit) : null
  const starts_at = typeof body.starts_at === "string" ? body.starts_at : null
  const ends_at = typeof body.ends_at === "string" ? body.ends_at : null
  const active = body.active !== false
  const product_ids = Array.isArray(body.product_ids) ? body.product_ids.filter((x: unknown) => typeof x === "string") : []
  const category_keys = Array.isArray(body.category_keys)
    ? body.category_keys.filter((x: unknown) => typeof x === "string").map(String)
    : []

  const description = typeof body.description === "string" ? body.description.trim().slice(0, 8000) : null
  const short_label =
    typeof body.short_label === "string" && body.short_label.trim()
      ? body.short_label.trim().slice(0, 160)
      : null
  const auto_apply = body.auto_apply === true
  const stackable = body.stackable === true
  const visibility =
    typeof body.visibility === "string" && body.visibility.trim()
      ? body.visibility.trim().slice(0, 32)
      : "all"
  const image_url =
    typeof body.image_url === "string" && body.image_url.trim() ? body.image_url.trim().slice(0, 2048) : null
  const conditions_text =
    typeof body.conditions_text === "string" && body.conditions_text.trim()
      ? body.conditions_text.trim().slice(0, 4000)
      : null
  const max_redemptions_per_user =
    body.max_redemptions_per_user != null ? Number(body.max_redemptions_per_user) : null

  const meta = typeof body.meta === "object" && body.meta ? (body.meta as Record<string, unknown>) : {}

  const supabase = createServiceRoleClient()

  const payload: Record<string, unknown> = {
    name,
    offer_type,
    value_num,
    promo_code,
    product_ids,
    category_keys,
    min_order_amount,
    usage_limit,
    starts_at,
    ends_at,
    active,
    created_by: guard.user.id,
    meta,
  }

  payload.description = description
  payload.short_label = short_label
  payload.auto_apply = auto_apply
  payload.stackable = stackable
  payload.visibility = visibility
  payload.image_url = image_url
  payload.conditions_text = conditions_text
  if (max_redemptions_per_user != null && Number.isFinite(max_redemptions_per_user) && max_redemptions_per_user >= 0) {
    payload.max_redemptions_per_user = Math.floor(max_redemptions_per_user)
  }

  const { data: row, error } = await supabase.from("promotional_offers").insert(payload).select("*").maybeSingle()

  if (error || !row) return NextResponse.json({ error: error?.message ?? "Insert échoué" }, { status: 500 })
  return NextResponse.json({ ok: true, offer: row })
}
