import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

import { invalidateMenuCache } from "@/lib/menu/menu-catalog-service"

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json()
  const items = Array.isArray(body.items) ? body.items : []
  if (items.length === 0) {
    return NextResponse.json({ error: "items requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  for (const row of items) {
    const id = String(row.id ?? "")
    const display_order = Number(row.display_order)
    if (!id || !Number.isFinite(display_order)) continue
    await supabase.from("products").update({ display_order }).eq("id", id)
  }

  invalidateMenuCache()
  return NextResponse.json({ ok: true })
}
