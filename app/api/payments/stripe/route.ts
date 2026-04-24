import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

type CreatePaymentBody = {
  amount: number
  currency?: string
  description?: string
}

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json({ error: "Stripe n'est pas configuré côté serveur." }, { status: 500 })
    }

    const body = (await request.json()) as CreatePaymentBody
    const amount = Math.round(Number(body.amount || 0))
    const currency = body.currency || "eur"

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Montant invalide pour le paiement." }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      description: body.description ?? "Commande livraison",
      metadata: { origin: "delivery-checkout" },
    })

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: "Impossible de générer un client_secret Stripe." }, { status: 500 })
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error("[stripe] PaymentIntent error", error)
    const message = error instanceof Error ? error.message : "Erreur Stripe lors de la création du paiement."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
