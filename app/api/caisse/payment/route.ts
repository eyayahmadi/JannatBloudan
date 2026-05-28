import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { processInvoicePayment } from "@/lib/caisse/process-payment"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Valide encaissement : espèces / carte / online / wallet / hospitality (total 0) */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const invoiceId = typeof body.invoice_id === "string" ? body.invoice_id.trim() : ""

  let parts: Array<{ method: string; amount: number; guest_session_id?: string | null }> = []
  if (Array.isArray(body.payments) && body.payments.length > 0) {
    parts = body.payments.map((p: { method?: string; amount?: unknown; guest_session_id?: string | null }) => ({
      method: String(p.method ?? "").toLowerCase(),
      amount: Number(p.amount),
      guest_session_id: typeof p.guest_session_id === "string" ? p.guest_session_id : null,
    }))
  } else if (body.method != null && body.amount != null) {
    parts = [
      {
        method: String(body.method).toLowerCase(),
        amount: Number(body.amount),
        guest_session_id: typeof body.guest_session_id === "string" ? body.guest_session_id : null,
      },
    ]
  }

  if (!invoiceId || parts.length === 0) {
    return NextResponse.json({ error: "invoice_id et payments requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const result = await processInvoicePayment(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    role: guard.role,
  }, invoiceId, parts)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    ok: true,
    invoice: result.invoice,
    payment_stage: result.payment_stage,
    split: result.split,
  })
}
