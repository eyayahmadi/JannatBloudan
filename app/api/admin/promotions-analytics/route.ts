import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

/** ADMIN + STAFF : synthèse des redemptions pour le dashboard promotions. */
const ALLOW = ["ADMIN", "STAFF"] as const

export async function GET() {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ byOffer: [], totals: { redemptions: 0, savingsEur: 0 }, disabled: true })
  }

  const supabase = createServiceRoleClient()

  const { data: reds, error: rErr } = await supabase
    .from("invoice_offer_redemptions")
    .select("offer_id, amount_saved, created_at")

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

  const { data: offers } = await supabase
    .from("promotional_offers")
    .select("id, name, offer_type, promo_code, usage_limit, usage_count, active")

  const names = new Map<string, Record<string, unknown>>()
  for (const o of offers ?? []) {
    names.set(String((o as { id: string }).id), o as Record<string, unknown>)
  }

  type Agg = { offer_id: string; count: number; savings: number }
  const map = new Map<string, Agg>()
  for (const row of reds ?? []) {
    const oid = String((row as { offer_id?: string }).offer_id ?? "")
    if (!oid) continue
    const amt = Number((row as { amount_saved?: unknown }).amount_saved ?? 0)
    const cur = map.get(oid) ?? { offer_id: oid, count: 0, savings: 0 }
    cur.count += 1
    cur.savings += Number.isFinite(amt) ? amt : 0
    map.set(oid, cur)
  }

  let totalRed = 0
  let totalSav = 0
  const byOffer = [...map.entries()].map(([id, agg]) => {
    totalRed += agg.count
    totalSav += agg.savings
    const off = names.get(id)
    const usageCount = Number(off?.usage_count ?? agg.count)
    const limit =
      off?.usage_limit != null && typeof off.usage_limit !== "undefined" ? Number(off.usage_limit) : null
    const conversionHint =
      limit != null && limit > 0 ? Math.round((usageCount / limit) * 1000) / 10 : null
    return {
      offer_id: id,
      name: String(off?.name ?? "Offre"),
      offer_type: String(off?.offer_type ?? ""),
      promo_code: off?.promo_code != null ? String(off.promo_code) : null,
      redemptions: agg.count,
      savings_attributed_eur: Math.round(agg.savings * 100) / 100,
      usage_count_catalog: usageCount,
      usage_limit: limit,
      /** Part des usages catalogue consommés si limite renseignée (proxy conversion). */
      usage_vs_limit_pct: conversionHint,
      active: off?.active === true,
    }
  })

  byOffer.sort((a, b) => b.redemptions - a.redemptions)

  /** Recommandations simples « type IA » (heuristiques), sans LLM. */
  const recommendations: string[] = []
  const top = byOffer[0]
  if (top) {
    recommendations.push(
      `${top.name} est votre offre la plus appliquée (${top.redemptions} fois) — envisagez d’étendre sa fenêtre ou de la dupliquer sur un créneau complémentaire.`,
    )
  }
  const dormant = offers?.filter((o) => Number((o as { usage_count?: unknown }).usage_count ?? 0) === 0) ?? []
  if (dormant.length >= 2) {
    recommendations.push(
      `${dormant.length} offres n’ont jamais été utilisées : vérifiez la visibilité, le code promo ou un pourcent équivalent renseigné pour la caisse.`,
    )
  }
  const happy = byOffer.filter((x) => x.offer_type.toLowerCase() === "happy_hour")
  if (happy.length === 0) {
    recommendations.push(
      "Aucune happy hour en tête du classement : testez une promo horaire courte (17h–19h) sur les boissons pour augmenter le panier moyen.",
    )
  }

  return NextResponse.json({
    byOffer,
    totals: {
      redemptions: totalRed,
      savingsEur: Math.round(totalSav * 100) / 100,
    },
    recommendations,
  })
}
