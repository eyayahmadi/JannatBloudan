import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { processInvoicePayment, type PayPart } from "@/lib/caisse/process-payment"
import { friendlyPaymentError } from "@/lib/caisse/friendly-payment-error"

const ALLOW = ["ADMIN", "CASHIER"] as const

type Settlement = { invoice_id: string; payments: PayPart[] }

/** Paiement groupé (ex. « tout payer ensemble ») — même payment_batch_id sur chaque ligne payments. */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const batchId = typeof body.payment_batch_id === "string" && body.payment_batch_id.trim() ? body.payment_batch_id.trim() : randomUUID()
  const settlements = body.settlements as Settlement[] | undefined

  if (!Array.isArray(settlements) || settlements.length === 0) {
    return NextResponse.json({ error: "settlements[] requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const ctx = { userId: guard.user.id, userEmail: guard.user.email ?? null, role: guard.role }
  const done: Record<string, unknown>[] = []

  for (const s of settlements) {
    const invoiceId = typeof s.invoice_id === "string" ? s.invoice_id.trim() : ""
    const parts = Array.isArray(s.payments) ? s.payments : []
    if (!invoiceId || !parts.length) {
      return NextResponse.json({ error: "Chaque settlement nécessite invoice_id et payments", partial: done }, { status: 400 })
    }
    const r = await processInvoicePayment(supabase, ctx, invoiceId, parts, { payment_batch_id: batchId })
    if (!r.ok) {
      return NextResponse.json({ error: friendlyPaymentError(r.error), partial: done, payment_batch_id: batchId }, { status: r.status })
    }
    done.push(r.invoice)
  }

  return NextResponse.json({ ok: true, payment_batch_id: batchId, invoices: done })
}
