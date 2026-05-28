import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type Ctx = { params: Promise<{ id: string }> }

/** Duplique une offre (usage remis à zéro, code promo effacé pour éviter conflit UNIQUE). */
export async function POST(_request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const { id } = await ctx.params
  const supabase = createServiceRoleClient()

  const { data: src, error: fErr } = await supabase.from("promotional_offers").select("*").eq("id", id).maybeSingle()
  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 })
  if (!src) return NextResponse.json({ error: "Offre source introuvable" }, { status: 404 })

  const s = src as Record<string, unknown>
  const insertPayload: Record<string, unknown> = {
    name: `${String(s.name ?? "Offre").slice(0, 160)} — copie`,
    offer_type: s.offer_type,
    value_num: s.value_num,
    promo_code: null,
    product_ids: s.product_ids,
    category_keys: s.category_keys,
    min_order_amount: s.min_order_amount,
    usage_limit: s.usage_limit,
    usage_count: 0,
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    active: false,
    created_by: guard.user.id,
    meta: typeof s.meta === "object" && s.meta ? s.meta : {},
    description: s.description ?? null,
    short_label: s.short_label ?? null,
    auto_apply: s.auto_apply === true,
    stackable: s.stackable === true,
    visibility: typeof s.visibility === "string" ? s.visibility : "all",
    image_url: s.image_url ?? null,
    conditions_text: s.conditions_text ?? null,
    max_redemptions_per_user: s.max_redemptions_per_user ?? null,
  }

  const { data: row, error: iErr } = await supabase
    .from("promotional_offers")
    .insert(insertPayload)
    .select("*")
    .maybeSingle()

  if (iErr || !row) return NextResponse.json({ error: iErr?.message ?? "Duplication échouée" }, { status: 500 })
  return NextResponse.json({ ok: true, offer: row })
}
