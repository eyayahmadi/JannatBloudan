import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STAFF_ROLES = ["ADMIN", "SERVER", "CASHIER", "KITCHEN", "BAR", "SHISHA"] as const

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

/** Réservations / événements confirmés ou à traiter sous 14 jours. */
export async function GET() {
  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ ok: true, upcoming: [], source: "disabled" })
  }

  const today = new Date()
  const until = new Date(today)
  until.setDate(until.getDate() + 14)
  const start = isoDate(today)
  const end = isoDate(until)

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from("event_requests")
      .select(
        `
        id, guest_name, status, event_date, event_time, guests_count, event_type, package_id,
        special_requests,
        package:event_packages(name),
        quotes:event_quotes(status,deposit_paid,total,deposit_amount)
      `,
      )
      .gte("event_date", start)
      .lte("event_date", end)
      .in("status", ["pending", "reviewing", "confirmed", "in_progress"])
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true, nullsFirst: false })
      .limit(80)

    if (error) {
      console.error("[admin/private-events/upcoming]", error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, upcoming: data ?? [], range: { start, end }, source: "supabase" })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
