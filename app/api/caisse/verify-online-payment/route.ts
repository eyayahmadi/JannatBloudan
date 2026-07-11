import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { friendlyPaymentError } from "@/lib/caisse/friendly-payment-error"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { isOnlinePaymentProviderConfigured } from "@/lib/payments/online-provider"
import { stripe } from "@/lib/stripe"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Vérifie les paiements en ligne (Stripe) liés à une facture. */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Service temporairement indisponible." }, { status: 503 })
  }
  if (!isOnlinePaymentProviderConfigured() || !stripe) {
    return NextResponse.json({ error: "Paiement en ligne non configuré." }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const invoiceId = typeof body.invoice_id === "string" ? body.invoice_id.trim() : ""
  if (!invoiceId) {
    return NextResponse.json({ error: "Numéro de facture requis." }, { status: 400 })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data: rows, error } = await supabase
      .from("payments")
      .select("id, status, method, provider, provider_ref, amount, created_at")
      .eq("invoice_id", invoiceId)
      .eq("method", "online")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: friendlyPaymentError(error.message) }, { status: 500 })
    }

    const payments = rows ?? []
    if (payments.length === 0) {
      return NextResponse.json({
        ok: true,
        verified: false,
        message: "Aucun paiement en ligne enregistré pour cette facture.",
      })
    }

    let succeeded = 0
    let pending = 0
    let failed = 0

    for (const p of payments) {
      const st = String((p as { status?: string }).status ?? "").toLowerCase()
      const ref = String((p as { provider_ref?: string }).provider_ref ?? "").trim()
      if (st === "succeeded") {
        succeeded += 1
        continue
      }
      if (ref.startsWith("pi_")) {
        try {
          const intent = await stripe.paymentIntents.retrieve(ref)
          if (intent.status === "succeeded") succeeded += 1
          else if (intent.status === "processing" || intent.status === "requires_capture") pending += 1
          else failed += 1
        } catch {
          failed += 1
        }
      } else if (st === "pending") {
        pending += 1
      } else {
        failed += 1
      }
    }

    if (succeeded > 0 && pending === 0 && failed === 0) {
      return NextResponse.json({
        ok: true,
        verified: true,
        message: "Paiement en ligne confirmé par le prestataire.",
      })
    }
    if (pending > 0) {
      return NextResponse.json({
        ok: true,
        verified: false,
        message: "Paiement en ligne en cours de traitement — réessayez dans quelques instants.",
      })
    }
    return NextResponse.json({
      ok: true,
      verified: false,
      message: "Aucun paiement en ligne validé pour cette facture.",
    })
  } catch (e) {
    console.error("[verify-online-payment]", e)
    return NextResponse.json(
      { error: "La vérification du paiement en ligne a échoué." },
      { status: 500 },
    )
  }
}
