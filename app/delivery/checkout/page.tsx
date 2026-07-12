"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CreditCard, Truck, Clock, DollarSign, Store, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { loadStripe } from "@stripe/stripe-js"
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderProductName } from "@/components/orders/OrderProductName"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { calculateTaxFromTtc, DEFAULT_VAT_RATE_PERCENT } from "@/lib/tax/calculate-tax"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { cashierAudience, deliveryAudience } from "@/lib/notifications/audience"

type PaymentMethod = "card" | "paypal" | "applepay" | "cash" | "instore"
type CheckoutCartItem = {
  id: number
  name: string
  name_ar?: string | null
  price: number
  quantity: number
  image?: string
  extras?: { name: string; price: number }[]
  size?: string
  serviceType?: string
  notes?: string
}

type StoredCart = {
  items?: CheckoutCartItem[]
  summary?: {
    subtotal: number
    tva: number
    deliveryFee: number
    total: number
    itemsCount?: number
  }
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

function CheckoutContent() {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const [step, setStep] = useState<"address" | "payment" | "confirmed">("address")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    zipCode: "",
    phone: "",
  })

  const [orderItems, setOrderItems] = useState<CheckoutCartItem[]>([])
  const [isPaying, setIsPaying] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const { add: addNotification } = useNotifications()

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedCart = localStorage.getItem("delivery-cart")
    if (!storedCart) return

    try {
      const parsed: StoredCart = JSON.parse(storedCart)
      if (Array.isArray(parsed.items)) {
        setOrderItems(parsed.items)
      }
    } catch (error) {
      console.error("[checkout] Failed to load cart from storage", error)
    }
  }, [])

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = subtotal >= 25 ? 0 : 3.9
  const menuTax = calculateTaxFromTtc(subtotal, DEFAULT_VAT_RATE_PERCENT)
  const tva = menuTax.tva
  const total = menuTax.ttc + deliveryFee
  const hasItems = orderItems.length > 0
  const stripeReady = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

  const handleConfirmAddress = () => {
    setStep("payment")
  }

  const generateOrderId = () => `ORD-${Date.now()}`

  const finalizeOrder = async (orderId: string) => {
    generateInvoicePDF(orderId)

    try {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          customerName: deliveryAddress.street || "Client",
          items: orderItems.map((item) => ({
            name: item.name,
            name_ar: item.name_ar ?? null,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          subtotal,
          paymentMethod,
        }),
      })
    } catch { /* invoice creation is non-blocking */ }

    // Audience : caisse (encaissement) + livraison (préparation tournée) + admin.
    // Le client a son propre suivi (page tracking), il ne reçoit pas de
    // notification staff.
    addNotification({
      type: "payment_received",
      title: "Paiement confirmé",
      message: `Commande ${orderId} payée avec succès`,
      audience: [...new Set([...cashierAudience(), ...deliveryAudience()])],
    })

    router.push(`/delivery/track/${orderId}`)
  }

  const generateInvoicePDF = (orderId: string) => {
    // Simulation de génération de PDF
    const invoiceData = {
      orderId,
      date: new Date().toLocaleDateString("fr-FR"),
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      address: deliveryAddress,
    }

    console.log("[v0] Facture PDF générée:", invoiceData)
    // Dans un vrai système, on appellerait une API pour générer le PDF
  }

  const handleCardPayment = async () => {
    if (!stripe || !elements) {
      setPaymentError("Stripe n'est pas prêt. Vérifiez votre clé publique.")
      return
    }

    setIsPaying(true)
    setPaymentError(null)

    try {
      const response = await fetch("/api/payments/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          currency: "eur",
          description: "Commande livraison",
        }),
      })

      const data = await response.json()
      if (!response.ok || !data?.clientSecret) {
        throw new Error(data?.error ?? "Impossible de créer le paiement Stripe.")
      }

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error("Le champ carte n'est pas disponible.")
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: deliveryAddress.street || "Client",
            phone: deliveryAddress.phone || undefined,
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      if (paymentIntent?.status === "succeeded") {
        finalizeOrder(generateOrderId())
      } else {
        throw new Error("Le paiement n'a pas été confirmé.")
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Erreur lors du paiement.")
    } finally {
      setIsPaying(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!hasItems) return

    if (paymentMethod === "card") {
      await handleCardPayment()
      return
    }

    finalizeOrder(generateOrderId())
  }

  return (
    <PageShell>
      <SiteHeader backHref="/delivery" backLabel="Panier" />
      <div className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Section */}
            <Card className={step === "address" ? "ring-2 ring-blue-500" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step === "address" ? "bg-blue-600 text-white" : "bg-green-600 text-white"
                    }`}
                  >
                    {step === "address" ? "1" : "✓"}
                  </div>
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">Adresse</Label>
                  <Input
                    id="street"
                    placeholder="123 Rue de la République"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                    disabled={step !== "address"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      placeholder="Paris"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      disabled={step !== "address"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">Code postal</Label>
                    <Input
                      id="zipCode"
                      placeholder="75001"
                      value={deliveryAddress.zipCode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zipCode: e.target.value })}
                      disabled={step !== "address"}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    placeholder="06 12 34 56 78"
                    value={deliveryAddress.phone}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                    disabled={step !== "address"}
                  />
                </div>
                {step === "address" && (
                  <Button onClick={handleConfirmAddress} className="w-full">
                    Continuer vers le paiement
                  </Button>
                )}
                {step === "payment" && (
                  <Button onClick={() => setStep("address")} variant="outline" className="w-full">
                    Modifier l'adresse
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card className={step === "payment" ? "ring-2 ring-blue-500" : "opacity-50"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step === "payment" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    2
                  </div>
                  Mode de paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {step === "payment" && (
                  <>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    >
                      <div className="space-y-3">
                        {/* Paiement en ligne */}
                        <div
                          className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => setPaymentMethod("card")}
                        >
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold">Carte bancaire</div>
                              <div className="text-sm text-slate-500">Paiement sécurisé en ligne</div>
                            </div>
                          </Label>
                        </div>

                        <div
                          className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => setPaymentMethod("paypal")}
                        >
                          <RadioGroupItem value="paypal" id="paypal" />
                          <Label htmlFor="paypal" className="flex items-center gap-3 cursor-pointer flex-1">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#003087">
                                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516c-.065.416.23.79.648.79h4.607c.43 0 .794-.31.862-.731l.035-.181.673-4.266.044-.23c.068-.42.432-.73.862-.73h.543c3.753 0 6.693-1.524 7.554-5.934.359-1.844.174-3.381-.791-4.461z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-semibold">PayPal</div>
                              <div className="text-sm text-slate-500">Paiement via PayPal</div>
                            </div>
                          </Label>
                        </div>

                        <div
                          className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => setPaymentMethod("applepay")}
                        >
                          <RadioGroupItem value="applepay" id="applepay" />
                          <Label htmlFor="applepay" className="flex items-center gap-3 cursor-pointer flex-1">
                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-semibold">Apple Pay</div>
                              <div className="text-sm text-slate-500">Paiement rapide avec Apple Pay</div>
                            </div>
                          </Label>
                        </div>

                        {/* Paiement à la livraison */}
                        <div
                          className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => setPaymentMethod("cash")}
                        >
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-semibold">Espèces à la livraison</div>
                              <div className="text-sm text-slate-500">Payez en liquide au livreur</div>
                            </div>
                          </Label>
                        </div>

                        {/* Paiement à la caisse */}
                        <div
                          className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => setPaymentMethod("instore")}
                        >
                          <RadioGroupItem value="instore" id="instore" />
                          <Label htmlFor="instore" className="flex items-center gap-3 cursor-pointer flex-1">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Store className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-semibold">Payer à la caisse du restaurant</div>
                              <div className="text-sm text-slate-500">Payez sur place au retrait</div>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>

                    {paymentMethod === "card" && (
                      <div className="space-y-4 pt-4 border-t">
                        {!stripeReady && (
                          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                            Ajoutez vos clés Stripe dans <code>.env.local</code> pour activer le paiement par carte.
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Carte</Label>
                          <div className="rounded-lg border px-3 py-2 bg-white">
                            <CardElement
                              options={{
                                hidePostalCode: true,
                                style: {
                                  base: {
                                    fontSize: "16px",
                                    color: "#0f172a",
                                    "::placeholder": { color: "#94a3b8" },
                                  },
                                },
                              }}
                            />
                          </div>
                          <p className="text-xs text-slate-500">
                            Utilisez une carte de test Stripe, ex: 4242 4242 4242 4242 (date future, CVC 123).
                          </p>
                          {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}
                        </div>
                      </div>
                    )}

                    {paymentMethod === "paypal" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                        Vous serez redirigé vers PayPal pour finaliser le paiement de manière sécurisée.
                      </div>
                    )}

                    {paymentMethod === "applepay" && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-800">
                        Utilisez Touch ID ou Face ID pour confirmer le paiement avec Apple Pay.
                      </div>
                    )}

                    {paymentMethod === "cash" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                        Préparez le montant exact si possible. Le livreur n'a pas toujours de monnaie.
                      </div>
                    )}

                    {paymentMethod === "instore" && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-800">
                        Votre commande sera prête à retirer. Payez directement à la caisse du restaurant.
                      </div>
                    )}

                    <Button
                      onClick={handleConfirmPayment}
                      className="w-full gap-2"
                      size="lg"
                      disabled={
                        !hasItems ||
                        (paymentMethod === "card" && (!stripeReady || !stripe || isPaying))
                      }
                    >
                      {paymentMethod === "card" && <CreditCard className="w-5 h-5" />}
                      {paymentMethod === "paypal" && <CreditCard className="w-5 h-5" />}
                      {paymentMethod === "applepay" && <CreditCard className="w-5 h-5" />}
                      {paymentMethod === "cash" && <DollarSign className="w-5 h-5" />}
                      {paymentMethod === "instore" && <Store className="w-5 h-5" />}
                      {isPaying
                        ? "Paiement en cours..."
                        : paymentMethod === "cash" || paymentMethod === "instore"
                          ? `Confirmer la commande - ${total.toFixed(2)}ƒ'ª`
                          : `Payer ${total.toFixed(2)}ƒ'ª`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!hasItems ? (
                  <div className="space-y-3 text-sm text-slate-600">
                    <p>Votre panier est vide.</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/delivery">Retour au menu</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {orderItems.map((item, index) => (
                        <div key={index} className="flex justify-between gap-3 text-sm">
                          <div className="flex min-w-0 items-start gap-2 text-slate-600">
                            <span className="shrink-0">{item.quantity}×</span>
                            <OrderProductName name={item.name} name_ar={item.name_ar} size="sm" />
                          </div>
                          <span className="shrink-0 font-medium">{item.price.toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Sous-total</span>
                        <span>{subtotal.toFixed(2)}ƒ'ª</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Livraison</span>
                        <span className={deliveryFee === 0 ? "text-green-600 font-medium" : "font-medium"}>
                          {deliveryFee === 0 ? "Gratuit" : `${deliveryFee.toFixed(2)}ƒ'ª`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{total.toFixed(2)}ƒ'ª</span>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>Livraison en 25-30 min</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Truck className="w-4 h-4" />
                    <span>{deliveryFee === 0 ? "Livraison gratuite" : `Livraison : ${deliveryFee.toFixed(2)}ƒ'ª`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <Download className="w-4 h-4" />
                    <span>Facture PDF envoyée par email</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <SiteFooter />
    </PageShell>
  )
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent />
    </Elements>
  )
}
