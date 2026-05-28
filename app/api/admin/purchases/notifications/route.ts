/**
 * GET  /api/admin/purchases/notifications
 *   Retourne ce que le rôle courant doit annoncer aujourd'hui (et n'a pas
 *   encore été marqué « vu »). On regroupe les recos ouvertes par niveau.
 *
 * POST /api/admin/purchases/notifications
 *   Body: { digest_keys: string[] } — marque ces digests comme vus.
 *
 * La table `purchase_notification_seen` agit comme « anti-spam » : tant que
 * la même journée + rôle + digest existe, on ne renvoie pas de duplicate.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { todayDigestKey } from "@/lib/purchases/rules"
import type { PurchaseUrgency } from "@/lib/purchases/types"

const ALLOW = ["ADMIN", "CASHIER"] as const

export async function GET() {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ digests: [], source: "default" })
  }

  const today = new Date().toISOString().slice(0, 10)
  const supabase = createServiceRoleClient()

  // Compter les recos ouvertes par niveau
  const { data: rows, error } = await supabase
    .from("v_purchase_recommendations")
    .select("urgency,is_open")
    .eq("is_open", true)
  if (error) {
    return NextResponse.json({ digests: [], error: error.message }, { status: 500 })
  }

  const counts: Record<PurchaseUrgency, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
  for (const r of rows ?? []) {
    const u = String((r as { urgency?: string }).urgency ?? "") as PurchaseUrgency
    if (u in counts) counts[u] += 1
  }

  const role = guard.role
  // Récupère les digests déjà vus aujourd'hui pour ce rôle
  const { data: seen } = await supabase
    .from("purchase_notification_seen")
    .select("digest_key")
    .eq("business_date", today)
    .eq("audience_role", role)
  const seenSet = new Set((seen ?? []).map((r) => String((r as { digest_key?: string }).digest_key ?? "")))

  const digests: Array<{
    digest_key: string
    urgency: PurchaseUrgency
    count: number
    seen: boolean
  }> = []
  for (const level of ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const) {
    if (counts[level] === 0) continue
    const key = todayDigestKey(level, today)
    digests.push({
      digest_key: key,
      urgency: level,
      count: counts[level],
      seen: seenSet.has(key),
    })
  }

  return NextResponse.json({
    business_date: today,
    role,
    digests,
    source: "supabase",
  })
}

export async function POST(request: NextRequest) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ ok: true })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const keys = Array.isArray(body.digest_keys)
    ? (body.digest_keys as unknown[]).filter((k): k is string => typeof k === "string")
    : []
  if (keys.length === 0) {
    return NextResponse.json({ ok: true, marked: 0 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const supabase = createServiceRoleClient()

  const rows = keys.map((digest_key) => ({
    business_date: today,
    audience_role: guard.role,
    digest_key,
    seen_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from("purchase_notification_seen")
    .upsert(rows, { onConflict: "business_date,audience_role,digest_key" })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, marked: rows.length })
}
