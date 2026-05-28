import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { buildDailyBreakdown, breakdownToCsv } from "@/lib/revenue/daily-breakdown"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Rapport journalier détaillé (stations + paiement + plateformes + crédit). */
export async function GET(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date invalide (YYYY-MM-DD)" }, { status: 400 })
  }
  const format = (searchParams.get("format") ?? "json").toLowerCase()

  const supabase = createServiceRoleClient()
  let breakdown
  try {
    breakdown = await buildDailyBreakdown(supabase, date)
  } catch (e) {
    console.error("[revenue/daily]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  if (format === "csv") {
    const csv = breakdownToCsv(breakdown)
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rapport-${date}.csv"`,
      },
    })
  }

  return NextResponse.json({ ok: true, breakdown })
}
