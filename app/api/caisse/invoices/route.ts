import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const ROLES = ["ADMIN", "CASHIER"] as const

/** Factures journée (+ lignes) pour caisse — centralisé sécurité service role */
export async function GET(request: Request) {
  const guard = await requireRoles(ROLES)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ invoices: [], disabled: true })
  }

  const { searchParams } = new URL(request.url)
  const day = searchParams.get("date")?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 200)
  const start = `${day}T00:00:00`
  const endIso = `${day}T23:59:59.999Z`

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from("invoices")
      .select(
        "id, order_id, session_id, customer_name, subtotal, tva_rate, tva_amount, discount_amount, total, status, payment_method, payment_stage, paid_at, cashier_id, notes, cancel_reason, payment_split, created_at, invoice_items(*)",
      )
      .gte("created_at", start)
      .lte("created_at", endIso)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[caisse/invoices]", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invoices: data ?? [], date: day, role: guard.role })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
