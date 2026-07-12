import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { markInvoiceAsCredit } from "@/lib/credit/process-credit"
import { CREDIT_PAYMENT_METHODS, CREDIT_REASONS } from "@/lib/credit/types"
import type { CreditPaymentMethod, CreditReason } from "@/lib/credit/types"
import { friendlyPaymentError } from "@/lib/caisse/friendly-payment-error"
import { staffPaymentCtxFromAuth } from "@/lib/caisse/resolve-staff-user-id"

const ALLOW = ["ADMIN", "CASHIER", "SERVER"] as const

const METHODS = new Set(CREDIT_PAYMENT_METHODS as readonly string[])
const REASONS = new Set(CREDIT_REASONS as readonly string[])

/** Marque une facture comme crédit (kridi) — flow caisse. */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const invoiceId = typeof body.invoice_id === "string" ? body.invoice_id.trim() : ""
  const reasonRaw = typeof body.reason === "string" ? body.reason.trim() : ""
  if (!invoiceId) {
    return NextResponse.json({ error: "invoice_id requis" }, { status: 400 })
  }
  if (!REASONS.has(reasonRaw)) {
    return NextResponse.json({ error: "reason invalide" }, { status: 400 })
  }

  const partials = Array.isArray(body.partial_payments)
    ? (body.partial_payments as Array<{ method?: string; amount?: number }>)
        .filter((p) => METHODS.has(String(p.method ?? "").toLowerCase()) && Number(p.amount) > 0)
        .map((p) => ({
          method: String(p.method).toLowerCase() as CreditPaymentMethod,
          amount: Number(p.amount),
        }))
    : []

  const supabase = createServiceRoleClient()
  const result = await markInvoiceAsCredit(
    supabase,
    staffPaymentCtxFromAuth(guard.user, guard.role),
    {
      invoiceId,
      partialPayments: partials,
      customerId: typeof body.customer_id === "string" ? body.customer_id : null,
      customerName: typeof body.customer_name === "string" ? body.customer_name : null,
      customerEmail: typeof body.customer_email === "string" ? body.customer_email : null,
      customerPhone: typeof body.customer_phone === "string" ? body.customer_phone : null,
      reason: reasonRaw as CreditReason,
      note: typeof body.note === "string" ? body.note : null,
      dueAt: typeof body.due_at === "string" ? body.due_at : null,
    },
  )

  if (!result.ok) {
    return NextResponse.json({ error: friendlyPaymentError(result.error) }, { status: result.status })
  }

  return NextResponse.json({
    ok: true,
    invoice: result.invoice,
    payment_state: result.payment_state,
    remaining: result.remaining,
  })
}
