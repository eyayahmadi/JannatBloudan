import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type VatScope = "online_only" | "online_plus_cash_declared"

/** Réglages TVA configurables — réservés ADMIN (ex. base online seule vs + partie cash déclaré). */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ vat_rate: 0.19, vat_scope: "online_only", source: "default" })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.from("finance_tax_settings").select("*").eq("id", 1).maybeSingle()

    if (error) {
      console.error(error)
      return NextResponse.json(
        {
          vat_rate: 0.19,
          vat_scope: "online_only" as VatScope,
          source: "fallback",
          error: error.message,
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ ...data, source: "supabase" })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv())
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const vat_rate = typeof body.vat_rate === "number" ? body.vat_rate : undefined
  const vat_scope = typeof body.vat_scope === "string" ? body.vat_scope : undefined

  if (vat_scope !== undefined && !["online_only", "online_plus_cash_declared"].includes(vat_scope)) {
    return NextResponse.json({ error: "vat_scope invalide" }, { status: 400 })
  }
  if (vat_rate !== undefined && (!Number.isFinite(vat_rate) || vat_rate <= 0 || vat_rate > 1))
    return NextResponse.json({ error: "vat_rate doit etre une fraction (ex. 0.19)" }, { status: 400 })

  try {
    const supabase = createServiceRoleClient()
    const { data: curr } = await supabase.from("finance_tax_settings").select("*").eq("id", 1).maybeSingle()
    const row: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: guard.user.id }
    if (vat_rate !== undefined) row.vat_rate = vat_rate
    if (vat_scope !== undefined) row.vat_scope = vat_scope

    const merged = {
      id: 1,
      vat_rate: vat_rate !== undefined ? vat_rate : Number(curr?.vat_rate ?? 0.19),
      vat_scope:
        vat_scope !== undefined
          ? vat_scope
          : String(curr?.vat_scope ?? "online_only"),
      ...row,
    }

    const { data, error } = await supabase.from("finance_tax_settings").upsert(merged).select("*").maybeSingle()

    if (error) return NextResponse.json({ error: error.message, hint: "Migration 14" }, { status: 500 })

    return NextResponse.json({ ok: true, settings: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
