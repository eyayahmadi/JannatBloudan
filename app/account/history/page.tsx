"use client"

import { useMemo, useState } from "react"
import {
  Package,
  Calendar,
  Download,
  Star,
  Truck,
  Utensils,
  ShoppingBag,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
} from "lucide-react"
import { AccountSubLayout } from "@/components/site/AccountSubLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type OrderType = "Livraison" | "Sur place" | "À emporter"
type FilterTab = "all" | "delivery" | "dine-in" | "takeaway"

const TYPE_META: Record<OrderType, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  Livraison: { icon: Truck, tone: "from-emerald-500 to-emerald-700" },
  "Sur place": { icon: Utensils, tone: "from-[color:var(--lux-bordeaux)] to-[color:var(--lux-bordeaux-dark)]" },
  "À emporter": { icon: ShoppingBag, tone: "from-amber-500 to-amber-700" },
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  const orders = [
    {
      id: "ORD-2024-001",
      date: "2024-01-15",
      type: "Livraison" as OrderType,
      items: ["Pizza Margherita", "Coca-Cola"],
      total: 15.99,
      status: "Terminée",
      rated: true,
    },
    {
      id: "ORD-2024-002",
      date: "2024-01-10",
      type: "Sur place" as OrderType,
      items: ["Burger Classic", "Frites", "Sprite"],
      total: 22.5,
      status: "Terminée",
      rated: false,
    },
    {
      id: "ORD-2024-003",
      date: "2024-01-05",
      type: "À emporter" as OrderType,
      items: ["Pâtes Carbonara", "Salade César"],
      total: 25.4,
      status: "Terminée",
      rated: true,
    },
  ]

  const reservations = [
    {
      id: "RES-2024-001",
      date: "2024-01-20",
      time: "19:30",
      guests: 4,
      zone: "Terrasse",
      status: "Confirmée",
    },
    {
      id: "RES-2024-002",
      date: "2024-01-08",
      time: "20:00",
      guests: 2,
      zone: "Intérieur",
      status: "Terminée",
    },
  ]

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders
    if (activeTab === "delivery") return orders.filter((o) => o.type === "Livraison")
    if (activeTab === "dine-in") return orders.filter((o) => o.type === "Sur place")
    if (activeTab === "takeaway") return orders.filter((o) => o.type === "À emporter")
    return orders
  }, [activeTab, orders])

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0)

  return (
    <AccountSubLayout title="Mon historique" subtitle="Commandes et réservations passées.">
      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up">
        <StatCard label="Commandes" value={orders.length.toString()} icon={Package} />
        <StatCard label="Réservations" value={reservations.length.toString()} icon={Calendar} />
        <StatCard label="Dépensé" value={`${totalSpent.toFixed(2)} €`} icon={ShoppingBag} />
        <StatCard
          label="Avis donnés"
          value={orders.filter((o) => o.rated).length.toString()}
          icon={Star}
        />
      </div>

      {/* Orders History */}
      <Card className="premium-card mb-6 p-6 sm:p-7 animate-fade-up [animation-delay:80ms]">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/80 text-blue-700">
              <Package className="h-5 w-5" />
            </span>
            Mes commandes
          </h2>

          {/* Filters */}
          <div
            role="tablist"
            aria-label="Filtre par type de commande"
            className="flex flex-wrap items-center gap-1 rounded-full border border-amber-900/10 bg-white/70 p-1 backdrop-blur-md"
          >
            {(
              [
                { id: "all", label: "Tout" },
                { id: "delivery", label: "Livraison" },
                { id: "dine-in", label: "Sur place" },
                { id: "takeaway", label: "À emporter" },
              ] as { id: FilterTab; label: string }[]
            ).map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    active
                      ? "bg-amber-950 text-amber-50 shadow-sm"
                      : "text-amber-900/70 hover:text-amber-950",
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucune commande"
            description="Vous n'avez pas encore de commande dans cette catégorie."
          />
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const meta = TYPE_META[order.type]
              const Icon = meta.icon
              return (
                <div
                  key={order.id}
                  className="group rounded-2xl border border-amber-900/10 bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-amber-900/20 hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                          meta.tone,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-display text-base font-semibold text-amber-950">
                          {order.id}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-amber-900/70">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                          <span className="px-1 text-amber-900/40">•</span>
                          <span>{order.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="numeric-display text-xl font-semibold text-amber-950">
                        {order.total.toFixed(2)} €
                      </div>
                      <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {order.status}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {order.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-amber-50/70 px-2.5 py-0.5 text-xs text-amber-900/80"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full">
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Facture
                    </Button>
                    {!order.rated ? (
                      <Button
                        variant="gold"
                        size="sm"
                        className="rounded-full"
                      >
                        <Star className="mr-1.5 h-3.5 w-3.5" />
                        Donner un avis
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <Star className="h-3 w-3 fill-current" />
                        Avis donné
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Reservations History */}
      <Card className="premium-card p-6 sm:p-7 animate-fade-up [animation-delay:160ms]">
        <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100/80 text-orange-700">
            <Calendar className="h-5 w-5" />
          </span>
          Mes réservations
        </h2>

        {reservations.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Aucune réservation"
            description="Réservez votre première table pour la voir apparaître ici."
          />
        ) : (
          <div className="space-y-3">
            {reservations.map((res) => {
              const isUpcoming = res.status === "Confirmée"
              return (
                <div
                  key={res.id}
                  className={cn(
                    "rounded-2xl border p-4 transition sm:p-5",
                    isUpcoming
                      ? "border-[color:var(--lux-gold)]/40 bg-gradient-to-br from-[color:var(--lux-cream)] to-white shadow-[0_8px_22px_-12px_rgba(201,162,76,0.4)]"
                      : "border-amber-900/10 bg-white/70 hover:border-amber-900/20 hover:shadow-sm",
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
                          isUpcoming
                            ? "bg-gradient-to-br from-[color:var(--lux-gold)] to-[color:var(--lux-gold-deep)]"
                            : "bg-gradient-to-br from-stone-400 to-stone-600",
                        )}
                      >
                        <Calendar className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-display text-base font-semibold text-amber-950">
                          {res.id}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-amber-900/70">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(res.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {res.time}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {res.guests} pers.
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {res.zone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "self-start rounded-full px-3 py-1 text-xs font-semibold",
                        res.status === "Confirmée"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-100 text-stone-600",
                      )}
                    >
                      {res.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </AccountSubLayout>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="premium-card flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--lux-gold)]/15 text-[color:var(--lux-bordeaux)]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="numeric-display truncate text-lg font-semibold text-amber-950">
          {value}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-900/65">
          {label}
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-200/70 bg-amber-50/30 p-10 text-center">
      <Icon className="mx-auto mb-3 h-10 w-10 text-amber-700/60" />
      <p className="font-display text-base font-semibold text-amber-950">{title}</p>
      <p className="mt-1 text-sm text-amber-900/65">{description}</p>
    </div>
  )
}
