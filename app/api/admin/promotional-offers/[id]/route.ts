import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { parsePromotionalOfferBody } from "@/lib/promotions/admin-payload"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const { id } = await ctx.params
  const body = await request.json().catch(() => ({}))
  const parsed = parsePromotionalOfferBody(body as Record<string, unknown>)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const supabase = createServiceRoleClient()
  let patch = parsed.patch

  if (patch.meta != null && typeof patch.meta === "object") {
    const { data: prev } = await supabase.from("promotional_offers").select("meta").eq("id", id).maybeSingle()
    const base =
      typeof (prev as { meta?: unknown } | null)?.meta === "object" && (prev as { meta: object }).meta
        ? ({ ...(prev as { meta: Record<string, unknown> }).meta })
        : {}
    patch = { ...patch, meta: { ...base, ...(patch.meta as Record<string, unknown>) } }
  }

  const { data: row, error } = await supabase.from("promotional_offers").update(patch).eq("id", id).select("*").maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: "Offre introuvable" }, { status: 404 })
  return NextResponse.json({ ok: true, offer: row })
}

/** Archive (soft delete) pour conserver l’historique des redemptions. */
export async function DELETE(_request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const { id } = await ctx.params
  const supabase = createServiceRoleClient()
  const nowIso = new Date().toISOString()
  const { data: row, error } = await supabase
    .from("promotional_offers")
    .update({ archived_at: nowIso, active: false })
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: "Offre introuvable" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
