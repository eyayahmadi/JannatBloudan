/**
 * GET /api/caisse/urgent-purchases
 *
 * Liste des achats urgents (HIGH + CRITICAL, ouverts) à afficher dans le
 * panneau « Achats urgents » côté CAISSE / ADMIN.
 *
 * Réponse : { recommendations: PurchaseRecommendation[], counts: { HIGH, CRITICAL } }
 */

import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import type { PurchaseRecommendation } from "@/lib/purchases/types"

const ALLOW = ["ADMIN", "CASHIER"] as const

export async function GET() {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      recommendations: [],
      counts: { HIGH: 0, CRITICAL: 0 },
      source: "default",
    })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("v_urgent_purchases")
    .select("*")
    .order("urgency_rank", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as PurchaseRecommendation[]
  const counts = { HIGH: 0, CRITICAL: 0 }
  for (const r of rows) {
    if (r.urgency === "HIGH") counts.HIGH += 1
    else if (r.urgency === "CRITICAL") counts.CRITICAL += 1
  }
  return NextResponse.json({ recommendations: rows, counts, source: "supabase" })
}
