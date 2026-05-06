import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const ALLOW = ["ADMIN", "CASHIER"] as const

/**
 * Avance salarié → mouvement de caisse (sortie) + ligne RH avec traçabilité.
 */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv())
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const staff_id = typeof body.staff_id === "string" ? body.staff_id : ""
  const amount = Number(body.amount)
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""

  const advance_date =
    typeof body.advance_date === "string"
      ? body.advance_date.slice(0, 10)
      : new Date().toISOString().slice(0, 10)

  if (!staff_id || !Number.isFinite(amount) || amount <= 0 || !reason) {
    return NextResponse.json({ error: "staff_id, amount, reason requis" }, { status: 400 })
  }

  try {
    const supabase = createServiceRoleClient()

    const movIns = await supabase
      .from("cash_register_movements")
      .insert({
        kind: "avance_salaire",
        amount,
        currency: "EUR",
        description: `Avance salaire — ${reason}`,
        validated_by: guard.user.id,
        performed_by: guard.user.id,
        meta: {
          advance_date,
          staff_id,
          created_from: "/api/caisse/employee-advance",
          role: guard.role,
        },
      })
      .select("id")
      .single()

    if (movIns.error || !movIns.data) {
      return NextResponse.json(
        { error: movIns.error?.message ?? "Mouvement", hint: "Migration 13+14 (kind avance_salaire)" },
        { status: 500 },
      )
    }

    const advanceIns = await supabase
      .from("employee_advances")
      .insert({
        staff_id,
        amount,
        reason,
        advance_date,
        status: guard.role === "ADMIN" ? "approved" : "approved",
        approved_by: guard.user.id,
        approved_at: new Date().toISOString(),
        cash_movement_id: movIns.data.id,
        notes: "",
        created_by: guard.user.id,
      })
      .select("*")
      .single()

    if (advanceIns.error) {
      await supabase.from("cash_register_movements").delete().eq("id", movIns.data.id)
      return NextResponse.json({ error: advanceIns.error.message, hint: "Migration 14" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, advance: advanceIns.data, movement_id: movIns.data.id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
