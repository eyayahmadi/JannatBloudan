import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { filterPublicPromotions, type PromoChannel } from "@/lib/promotions/filter-active"

/**
 * Liste des promotions visibles pour le site / livraison / QR — sans données sensibles.
 * Query: ?context=delivery | dine_in | qr_table | takeaway | catering | vip | all
 */
export async function GET(request: Request) {
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ promos: [], disabled: true })
  }

  const { searchParams } = new URL(request.url)
  const raw = searchParams.get("context") ?? "all"
  const allowed: PromoChannel[] = [
    "all",
    "delivery",
    "dine_in",
    "qr_table",
    "takeaway",
    "catering",
    "vip",
  ]
  const context = (allowed.includes(raw as PromoChannel) ? raw : "all") as PromoChannel

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("promotional_offers")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as Record<string, unknown>[]
  const archivedFiltered = rows.filter((r) => !r.archived_at)
  const promos = filterPublicPromotions(archivedFiltered, { context })
  return NextResponse.json({ promos })
}
