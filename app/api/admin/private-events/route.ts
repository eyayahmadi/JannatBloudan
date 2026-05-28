/**
 * Liste admin des demandes événements privés (mois ISO + paquets).
 * Service role après garde ADMIN / staff équivalent.
 */
import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { requestMatchesFilter } from "@/lib/events/private-event-filters"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STAFF_ROLES = ["ADMIN", "SERVER", "CASHIER", "KITCHEN", "BAR", "SHISHA"] as const

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}

function monthBounds(ym: string): { ok: false; msg: string } | { ok: true; start: string; end: string; label: string } {
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim())
  if (!m) return { ok: false, msg: "month must be YYYY-MM" }
  const y = Number(m[1])
  const mo = Number(m[2])
  if (mo < 1 || mo > 12) return { ok: false, msg: "invalid month" }
  const last = new Date(y, mo, 0).getDate()
  const start = `${y}-${pad2(mo)}-01`
  const end = `${y}-${pad2(mo)}-${pad2(last)}`
  return { ok: true, start, end, label: `${y}-${pad2(mo)}` }
}

export async function GET(req: NextRequest) {
  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      ok: false,
      requests: [],
      packages: [],
      month: null,
      source: "disabled",
      message: "Supabase absent",
    })
  }

  const { searchParams } = new URL(req.url)
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
  const monthParam = searchParams.get("month") ?? defaultMonth
  const bounds = monthBounds(monthParam)
  if (!bounds.ok) {
    return NextResponse.json({ ok: false, error: bounds.msg }, { status: 400 })
  }

  const statusFilter = (searchParams.get("status") ?? "all").toLowerCase()

  try {
    const supabase = createServiceRoleClient()
    let q = supabase
      .from("event_requests")
      .select(
        `
        *,
        package:event_packages(*),
        quotes:event_quotes(id,status,total,deposit_amount,deposit_paid,created_at)
      `,
      )
      .gte("event_date", bounds.start)
      .lte("event_date", bounds.end)
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true, nullsFirst: false })

    if (statusFilter !== "all" && statusFilter !== "quoted") {
      q = q.eq("status", statusFilter)
    }

    const { data: rows, error } = await q
    if (error) {
      console.error("[admin/private-events]", error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    let requests = rows ?? []
    if (statusFilter === "quoted") {
      requests = requests.filter((r) =>
        requestMatchesFilter(r as { status: string; quotes?: Array<{ status?: string | null }> | null }, "quoted"),
      )
    }

    const { data: packages } = await supabase
      .from("event_packages")
      .select("*")
      .eq("active", true)
      .order("base_price", { ascending: true })

    return NextResponse.json({
      ok: true,
      source: "supabase",
      month: bounds.label,
      range: { start: bounds.start, end: bounds.end },
      statusFilter,
      requests,
      packages: packages ?? [],
    })
  } catch (e) {
    console.error("[admin/private-events]", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
