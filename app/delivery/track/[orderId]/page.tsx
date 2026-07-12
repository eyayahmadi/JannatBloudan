"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js"
import Link from "next/link"
import { MapPin, Phone, Clock, Package, Truck, CheckCircle2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderProductName } from "@/components/orders/OrderProductName"
import { Badge } from "@/components/ui/badge"
import DeliveryMapDynamic from "@/components/maps/DeliveryMapDynamic"
import { useDeliveryTracking } from "@/lib/hooks/useDeliveryTracking"
import { useI18n } from "@/lib/i18n/context"
import { haversineKm } from "@/lib/delivery/types"
import { calculateTaxFromTtc, DEFAULT_VAT_RATE_PERCENT } from "@/lib/tax/calculate-tax"

type OrderStatus = "received" | "preparing" | "delivering" | "completed"

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

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

const statusConfig = {
  received: { label: "Commande recue", icon: Package, color: "bg-blue-500", step: 1 },
  preparing: { label: "En preparation", icon: Clock, color: "bg-orange-500", step: 2 },
  delivering: { label: "En livraison", icon: Truck, color: "bg-purple-500", step: 3 },
  completed: { label: "Terminee", icon: CheckCircle2, color: "bg-green-500", step: 4 },
}

type StripePaymentProps = {
  total: number
  subtotal: number
  tva: number
  deliveryFee: number
  onSuccess: () => void
}

function StripePaymentBox({ total, subtotal, tva, deliveryFee, onSuccess }: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stripeReady = useMemo(() => Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY), [])

  const handlePay = async () => {
    if (!stripe || !elements) {
      setError("Stripe n'est pas prêt. Vérifiez votre clé publique.")
      return
    }
    setIsPaying(true)
    setError(null)
    try {
      const response = await fetch("/api/payments/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          currency: "eur",
          description: "Paiement commande en cours",
        }),
      })
      const data = await response.json()
      if (!response.ok || !data?.clientSecret) {
        throw new Error(data?.error ?? "Impossible de créer le paiement Stripe.")
      }
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error("Le champ carte n'est pas disponible.")

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardElement },
      })
      if (stripeError) throw new Error(stripeError.message)
      if (paymentIntent?.status === "succeeded") {
        onSuccess()
      } else {
        throw new Error("Le paiement n'a pas été confirmé.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du paiement.")
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Paiement Stripe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!stripeReady && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            Ajoutez vos clés Stripe dans <code>.env.local</code> pour activer le paiement.
          </div>
        )}
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
        <div className="text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Sous-total</span>
            <span>{subtotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span>TVA</span>
            <span>{tva.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span>Livraison</span>
            <span>{deliveryFee === 0 ? "Gratuit" : `${deliveryFee.toFixed(2)} €`}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-900">
            <span>Total</span>
            <span>{total.toFixed(2)} €</span>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          onClick={handlePay}
          className="w-full gap-2"
          disabled={!stripeReady || !stripe || isPaying}
        >
          {isPaying ? "Paiement en cours..." : `Payer ${total.toFixed(2)} €`}
        </Button>
        <p className="text-xs text-slate-500">
          Carte de test Stripe : 4242 4242 4242 4242, date future, CVC 123.
        </p>
      </CardContent>
    </Card>
  )
}

export default function TrackOrderPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = Array.isArray(params?.orderId) ? params.orderId[0] : params?.orderId
  const { t } = useI18n()
  const { getById } = useDeliveryTracking()
  const liveDelivery = orderId ? getById(orderId) : undefined

  const [orderStatus, setOrderStatus] = useState<OrderStatus>("received")
  const [etaSeconds, setEtaSeconds] = useState(20 * 60) // 20 minutes
  const [driverLocation, setDriverLocation] = useState({ lat: 48.8566, lng: 2.3522 })
  const [restaurantLocation] = useState({ lat: 48.8584, lng: 2.2945 })
  const [deliveryLocation] = useState({ lat: 48.8606, lng: 2.3376 })
  const [orderItems, setOrderItems] = useState<CheckoutCartItem[]>([])

  // Si la livraison est dans le store, on remplace les etats locaux
  // par les donnees temps reel du livreur.
  const realDriverPos = liveDelivery?.driver_location
  const realPickup = liveDelivery?.pickup_location ?? restaurantLocation
  const realDestination = liveDelivery?.delivery_location ?? deliveryLocation

  // Sync du status global avec le status de la livraison
  useEffect(() => {
    if (!liveDelivery) return
    const map: Record<string, OrderStatus> = {
      pending: "received",
      assigned: "preparing",
      picked_up: "delivering",
      en_route: "delivering",
      arrived: "delivering",
      delivered: "completed",
    }
    const mapped = map[liveDelivery.status]
    if (mapped) setOrderStatus(mapped)
    if (liveDelivery.estimated_minutes) {
      setEtaSeconds(liveDelivery.estimated_minutes * 60)
    }
  }, [liveDelivery])

  // Compte a rebours et progression de statut (fallback si pas de livraison reelle)
  useEffect(() => {
    if (liveDelivery) return
    const interval = setInterval(() => {
      setEtaSeconds((prev) => {
        const next = Math.max(0, prev - 15)
        if (next === 0) setOrderStatus("completed")
        else if (next < 10 * 60 && orderStatus === "preparing") setOrderStatus("delivering")
        else if (next < 18 * 60 && orderStatus === "received") setOrderStatus("preparing")
        return next
      })
    }, 15000)
    return () => clearInterval(interval)
  }, [orderStatus, liveDelivery])

  // Position du livreur (simulation si pas de livraison reelle)
  useEffect(() => {
    if (liveDelivery) return
    if (orderStatus !== "delivering") return
    const interval = setInterval(() => {
      setDriverLocation((prev) => ({
        lat: prev.lat + (deliveryLocation.lat - prev.lat) * 0.08,
        lng: prev.lng + (deliveryLocation.lng - prev.lng) * 0.08,
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [orderStatus, deliveryLocation.lat, deliveryLocation.lng, liveDelivery])

  // Charge le panier local (simulation). A remplacer par un fetch de la commande via orderId.
  useEffect(() => {
    if (typeof window === "undefined") return
    const storedCart = localStorage.getItem("delivery-cart")
    if (!storedCart) return
    try {
      const parsed = JSON.parse(storedCart)
      if (Array.isArray(parsed.items)) setOrderItems(parsed.items)
    } catch (error) {
      console.error("[track] Failed to load cart from storage", error)
    }
  }, [])

  // Position affichee : priorite au live, sinon fallback
  const displayedDriverPos = realDriverPos ?? driverLocation

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = subtotal >= 25 ? 0 : 3.9
  const menuTax = calculateTaxFromTtc(subtotal, DEFAULT_VAT_RATE_PERCENT)
  const tva = menuTax.tva
  const total = menuTax.ttc + deliveryFee
  const hasItems = orderItems.length > 0
  const currentStep = statusConfig[orderStatus].step
  const estimatedMinutes = Math.max(0, Math.ceil(etaSeconds / 60))
  const handleSupport = () => {
    alert("Support : 06 12 34 56 78")
  }

  return (
    <Elements stripe={stripePromise}>
      <PageShell>
        <SiteHeader
          backHref="/delivery"
          trailing={
            <div className="text-right">
              <p className="text-xs text-amber-900/65">Commande</p>
              <p className="font-display text-sm font-semibold text-amber-950">#{orderId ?? "?"}</p>
            </div>
          }
        />

        <div className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Suivi de commande</CardTitle>
                  <Badge className={statusConfig[orderStatus].color}>{statusConfig[orderStatus].label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="relative">
                    {Object.entries(statusConfig).map(([key, config], index) => {
                      const isActive = config.step <= currentStep
                      const isCurrent = config.step === currentStep
                      const Icon = config.icon
                      return (
                        <div key={key} className="relative">
                          {index > 0 && (
                            <div
                              className={`absolute left-6 top-0 w-0.5 h-12 -mt-12 transition-colors ${
                                isActive ? "bg-green-500" : "bg-slate-200"
                              }`}
                            />
                          )}
                          <div className="flex items-start gap-4 mb-8">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                isActive ? config.color + " text-white shadow-lg" : "bg-slate-200 text-slate-400"
                              } ${isCurrent ? "ring-4 ring-offset-2 ring-" + config.color.replace("bg-", "") + "-200" : ""}`}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 pt-2">
                              <h3 className={`font-semibold mb-1 ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                                {config.label}
                              </h3>
                              <p className={`text-sm ${isActive ? "text-slate-600" : "text-slate-400"}`}>
                                {key === "received" && "Votre commande a ete confirme"}
                                {key === "preparing" && "Le restaurant prepare votre commande"}
                                {key === "delivering" && "Le livreur est en route vers vous"}
                                {key === "completed" && "Votre commande est arrivee"}
                              </p>
                              {isCurrent && orderStatus !== "completed" && (
                                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                                  <Clock className="w-4 h-4 animate-pulse" />
                                  <span>Temps estime: {estimatedMinutes} min</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {orderStatus === "delivering" && (
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {t("driver.tracking.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DeliveryMapDynamic
                    pickup={realPickup}
                    destination={realDestination}
                    driver={displayedDriverPos}
                    pickupLabel="Restaurant"
                    destinationLabel={liveDelivery?.customer_name ?? "Vous"}
                    driverLabel={liveDelivery?.driver_name ?? t("driver.tracking.liveDriver")}
                    height={380}
                  />
                </CardContent>
                <div className="flex items-center justify-between gap-3 border-t bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/30">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Position mise a jour en temps reel
                  </div>
                  <span className="font-semibold text-indigo-600">
                    {haversineKm(displayedDriverPos, realDestination).toFixed(2)} km
                  </span>
                </div>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Details de la commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!hasItems ? (
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>Nous n'avons pas retrouve les details de cette commande.</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/delivery">Retour au menu</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-600">{item.quantity}x</span>
                          <div className="min-w-0 text-slate-900">
                            <OrderProductName name={item.name} name_ar={item.name_ar} size="sm" />
                            {item.size && <span className="block text-xs text-slate-500">Taille: {item.size}</span>}
                            {item.serviceType && (
                              <span className="block text-xs text-slate-500">Service: {item.serviceType}</span>
                            )}
                            {item.extras && item.extras.length > 0 && (
                              <span className="block text-xs text-slate-500">
                                Extras: {item.extras.map((e) => e.name).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold text-slate-900">
                          {(item.price * item.quantity).toFixed(2)}€
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-slate-200 space-y-1">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Sous-total</span>
                        <span>{subtotal.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>TVA (19%)</span>
                        <span>{tva.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Livraison</span>
                        <span className={deliveryFee === 0 ? "text-green-600 font-medium" : "font-medium"}>
                          {deliveryFee === 0 ? "Gratuit" : `${deliveryFee.toFixed(2)}€`}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-slate-900">
                        <span>Total</span>
                        <span>{total.toFixed(2)}€</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {orderStatus === "delivering" && (
              <Card>
                <CardHeader>
                  <CardTitle>Votre livreur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                      MK
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Mohamed Karim</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <span className="text-yellow-500">★</span>
                        <span>4.9</span>
                        <span className="text-slate-400">(250 livraisons)</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full gap-2 bg-transparent" variant="outline">
                    <Phone className="w-4 h-4" />
                    Contacter le livreur
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-900 font-medium">Mozartstraße 10</p>
                <p className="text-slate-600">99084 Erfurt, Thüringen</p>
                <p className="text-slate-600 mt-2">Tel: 06 12 34 56 78</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6" />
                  <span className="text-sm font-medium opacity-90">Temps estime</span>
                </div>
                <div className="text-4xl font-bold">{estimatedMinutes} min</div>
                {orderStatus !== "completed" && (
                  <p className="text-sm opacity-90 mt-2">Votre commande arrive bientot !</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-slate-600 mb-3">Besoin d'aide avec votre commande ?</p>
                <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={handleSupport}>
                  <Phone className="w-4 h-4" />
                  Contacter le support
                </Button>
              </CardContent>
            </Card>

            {hasItems && (
              <StripePaymentBox
                total={total}
                subtotal={subtotal}
                tva={tva}
                deliveryFee={deliveryFee}
                onSuccess={() => setOrderStatus("preparing")}
              />
            )}
          </div>
        </div>
      </div>
        <SiteFooter />
      </PageShell>
    </Elements>
  )
}
