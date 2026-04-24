"use client"
import { useEffect, useMemo, useState } from "react"
import { Package, Clock, CheckCircle2, Truck, Eye } from "lucide-react"
import Link from "next/link"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type OrderStatus = "received" | "preparing" | "delivering" | "completed"

type Order = {
  id: string
  date: string
  items: { name: string; quantity: number }[]
  total: number
  status: OrderStatus
  estimatedTime?: string
}

type StoredCart = {
  items?: { name: string; quantity: number; price: number }[]
  summary?: {
    subtotal: number
    tva: number
    deliveryFee: number
    total: number
    itemsCount?: number
  }
}

const statusConfig = {
  received: { label: "Commande reçue", color: "bg-blue-100 text-blue-700", icon: Package },
  preparing: { label: "En préparation", color: "bg-orange-100 text-orange-700", icon: Clock },
  delivering: { label: "En livraison", color: "bg-purple-100 text-purple-700", icon: Truck },
  completed: { label: "Terminée", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
}

export default function OrdersPage() {
  const [storedOrder, setStoredOrder] = useState<StoredCart | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const persisted = localStorage.getItem("delivery-cart")
    if (!persisted) return

    try {
      const parsed: StoredCart = JSON.parse(persisted)
      setStoredOrder(parsed)
    } catch (error) {
      console.error("[orders] Failed to parse stored cart", error)
    }
  }, [])

  const activeOrders: Order[] = useMemo(() => {
    if (!storedOrder?.items || storedOrder.items.length === 0) return []

    const now = new Date()
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    const subtotal = storedOrder.summary?.subtotal ?? storedOrder.items.reduce((s, i) => s + i.price * i.quantity, 0)
    const tva = storedOrder.summary?.tva ?? subtotal * 0.19
    const deliveryFee = storedOrder.summary?.deliveryFee ?? (subtotal >= 25 ? 0 : 3.9)
    const total = storedOrder.summary?.total ?? subtotal + tva + deliveryFee

    return [
      {
        id: "FR-2024-1234",
        date: formattedDate,
        items: storedOrder.items.map((item) => ({ name: item.name, quantity: item.quantity })),
        total,
        status: "delivering",
        estimatedTime: "15 min",
      },
    ]
  }, [storedOrder])

  const completedOrders: Order[] = []

  return (
    <PageShell>
      <SiteHeader backHref="/delivery" backLabel="Menu" />
      <div className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-amber-950 animate-fade-up">Mes commandes</h1>
          <p className="mt-1 text-amber-900/75">Suivi en temps réel de vos livraisons.</p>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Commandes en cours</h2>
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const StatusIcon = statusConfig[order.status].icon
                return (
                  <Card key={order.id} className="overflow-hidden border-2 border-blue-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Commande #{order.id}</CardTitle>
                          <p className="text-sm text-slate-600 mt-1">{order.date}</p>
                        </div>
                        <Badge className={`${statusConfig[order.status].color} gap-1 px-3 py-1`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig[order.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h4 className="font-semibold text-slate-900 mb-2">Articles commandés:</h4>
                        <ul className="space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-slate-600 text-sm">
                              {item.quantity}x {item.name}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div>
                          <span className="text-sm text-slate-600">Total: </span>
                          <span className="text-xl font-bold text-slate-900">{order.total.toFixed(2)}€</span>
                        </div>
                        {order.estimatedTime && (
                          <div className="flex items-center gap-2 text-orange-600">
                            <Clock className="w-5 h-5" />
                            <span className="font-semibold">{order.estimatedTime} restantes</span>
                          </div>
                        )}
                      </div>

                      <Button asChild className="w-full mt-4 gap-2" size="lg">
                        <Link href={`/delivery/track/${order.id}`}>
                          <Eye className="w-5 h-5" />
                          Suivre ma commande en détail
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Historique</h2>
            <div className="space-y-4">
              {completedOrders.map((order) => {
                const StatusIcon = statusConfig[order.status].icon
                return (
                  <Card key={order.id} className="opacity-75 hover:opacity-100 transition-opacity">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-slate-900">Commande #{order.id}</h4>
                          <p className="text-sm text-slate-600 mt-1">{order.date}</p>
                        </div>
                        <Badge className={`${statusConfig[order.status].color} gap-1`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig[order.status].label}
                        </Badge>
                      </div>

                      <div className="mb-4">
                        <ul className="space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-slate-600 text-sm">
                              {item.quantity}x {item.name}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div>
                          <span className="text-sm text-slate-600">Total: </span>
                          <span className="text-lg font-bold text-slate-900">{order.total.toFixed(2)}€</span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/delivery/track/${order.id}`}>Voir détails</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {activeOrders.length === 0 && completedOrders.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucune commande</h3>
            <p className="text-slate-600 mb-6">Commencez à commander pour voir vos commandes ici</p>
            <Button asChild>
              <Link href="/delivery">Parcourir le menu</Link>
            </Button>
          </Card>
        )}
      </div>
      <SiteFooter />
    </PageShell>
  )
}
