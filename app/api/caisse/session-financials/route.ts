import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { buildSessionFinancials } from "@/lib/caisse/session-financials"

const ALLOW = ["ADMIN", "CASHIER", "SERVER"] as const

/** Agrégats table + invités (totaux, payé, restant, hospitalité). */
export async function GET(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")?.trim()
  if (!sessionId) {
    return NextResponse.json({ error: "session_id requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const out = await buildSessionFinancials(supabase, sessionId)
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 500 })
  return NextResponse.json(out)
}
