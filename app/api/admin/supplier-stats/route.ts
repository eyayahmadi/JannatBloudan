/**
 * Synthèse rapide factures fournisseurs (ERP) — ADMIN.
 */
import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ ok: false, disabled: true, invoices: [] })
  }

  const supabase = createServiceRoleClient()

  try {
    const { data: rows, error } = await supabase
      .from("supplier_invoices")
      .select("id, status, total_ttc, supplier_name_raw, invoice_date, created_at, supplier_id")
      .order("created_at", { ascending: false })
      .limit(400)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const list = rows ?? []
    const byStatus: Record<string, number> = {}
    let sumTtc = 0
    for (const r of list) {
      const st = String((r as { status?: string }).status ?? "unknown")
      byStatus[st] = (byStatus[st] ?? 0) + 1
      sumTtc += Number((r as { total_ttc?: unknown }).total_ttc ?? 0)
    }

    const recent = list.slice(0, 8).map((r) => ({
      id: (r as { id: string }).id,
      status: (r as { status?: string }).status,
      total_ttc: Number((r as { total_ttc?: unknown }).total_ttc ?? 0),
      supplier_name_raw: (r as { supplier_name_raw?: string | null }).supplier_name_raw ?? null,
      invoice_date: (r as { invoice_date?: string | null }).invoice_date ?? null,
    }))

    return NextResponse.json({
      ok: true,
      totals: {
        count: list.length,
        sum_ttc_sample: Math.round(sumTtc * 100) / 100,
        by_status: byStatus,
      },
      recent,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
