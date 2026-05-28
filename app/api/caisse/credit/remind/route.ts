import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { recordCreditReminder } from "@/lib/credit/process-credit"

const ALLOW = ["ADMIN", "CASHIER"] as const
const CHANNELS = new Set(["manual", "email", "sms", "whatsapp", "phone"])

/** Enregistre un rappel envoyé pour une dette client. */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const channel = String(body.channel ?? "manual").toLowerCase()
  if (!CHANNELS.has(channel)) {
    return NextResponse.json({ error: "channel invalide" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const result = await recordCreditReminder(
    supabase,
    {
      userId: guard.user.id,
      userEmail: guard.user.email ?? null,
      role: guard.role,
    },
    {
      invoiceId: typeof body.invoice_id === "string" ? body.invoice_id : null,
      clientId: typeof body.client_id === "string" ? body.client_id : null,
      channel: channel as "manual" | "email" | "sms" | "whatsapp" | "phone",
      message: typeof body.message === "string" ? body.message : null,
    },
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ ok: true, id: result.id })
}
