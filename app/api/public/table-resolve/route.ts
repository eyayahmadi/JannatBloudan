import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { resolveRestaurantTableFromRef } from "@/lib/restaurant/resolve-table"

/**
 * Résout une table pour le parcours client QR : /table/{ref}
 * ref = id numérique, table_number, ou table_code (ex. t5, vip-1).
 */
export async function GET(request: Request) {
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "configuration" }, { status: 503 })
  }

  const ref = new URL(request.url).searchParams.get("ref")?.trim() ?? ""
  if (!ref) return NextResponse.json({ error: "ref requis" }, { status: 400 })

  const supabase = createServiceRoleClient()
  const resolved = await resolveRestaurantTableFromRef(supabase, ref)
  if (!resolved) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const { data: row } = await supabase.from("restaurant_tables").select("*").eq("id", resolved.id).maybeSingle()
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 })

  return NextResponse.json({ ok: true, table: row })
}
