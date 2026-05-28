import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { recordCreditPayment } from "@/lib/credit/process-credit"
import { CREDIT_PAYMENT_METHODS } from "@/lib/credit/types"
import type { CreditPaymentMethod } from "@/lib/credit/types"

const ALLOW = ["ADMIN", "CASHIER"] as const

const METHODS = new Set(CREDIT_PAYMENT_METHODS as readonly string[])

/** Encaisse un règlement ultérieur sur une facture crédit. */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const invoiceId = typeof body.invoice_id === "string" ? body.invoice_id.trim() : ""
  const amount = Number(body.amount)
  const method = String(body.method ?? "").toLowerCase()
  if (!invoiceId) {
    return NextResponse.json({ error: "invoice_id requis" }, { status: 400 })
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount invalide" }, { status: 400 })
  }
  if (!METHODS.has(method)) {
    return NextResponse.json({ error: "method invalide" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const result = await recordCreditPayment(
    supabase,
    {
      userId: guard.user.id,
      userEmail: guard.user.email ?? null,
      role: guard.role,
    },
    {
      invoiceId,
      amount,
      method: method as CreditPaymentMethod,
      note: typeof body.note === "string" ? body.note : null,
    },
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    ok: true,
    invoice: result.invoice,
    payment_state: result.payment_state,
    remaining: result.remaining,
  })
}
