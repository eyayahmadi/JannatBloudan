"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
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
  FileText,
  PartyPopper,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { isPortalDemoEnabled } from "@/lib/config/portal-demo"
import { cn } from "@/lib/utils"

type OrderType = "Livraison" | "Sur place" | "À emporter"
type FilterTab = "all" | "delivery" | "dine-in" | "takeaway"

const TYPE_META: Record<OrderType, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  Livraison: { icon: Truck, tone: "from-emerald-500 to-emerald-700" },
  "Sur place": { icon: Utensils, tone: "from-[color:var(--lux-bordeaux)] to-[color:var(--lux-bordeaux-dark)]" },
  "À emporter": { icon: ShoppingBag, tone: "from-amber-500 to-amber-700" },
}

const DEMO_ORDERS = [
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

const DEMO_RESERVATIONS = [
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
        <div className="numeric-display truncate text-lg font-semibold text-amber-950">{value}</div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-900/65">{label}</div>
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

export function ClientPortalOrdersPanel() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const demoOn = isPortalDemoEnabled()
  const orders = demoOn ? DEMO_ORDERS : []
  const resCount = demoOn ? DEMO_RESERVATIONS.length : 0

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders
    if (activeTab === "delivery") return orders.filter((o) => o.type === "Livraison")
    if (activeTab === "dine-in") return orders.filter((o) => o.type === "Sur place")
    if (activeTab === "takeaway") return orders.filter((o) => o.type === "À emporter")
    return orders
  }, [activeTab, orders])

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Commandes" value={orders.length.toString()} icon={Package} />
        <StatCard label="Dépensé" value={`${totalSpent.toFixed(2)} €`} icon={ShoppingBag} />
        <StatCard
          label="Avis donnés"
          value={orders.filter((o) => o.rated).length.toString()}
          icon={Star}
        />
        <StatCard label="Réservations" value={resCount.toString()} icon={Calendar} />
      </div>

      <Card className="premium-card p-6 sm:p-7">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/80 text-blue-700">
              <Package className="h-5 w-5" />
            </span>
            Mes commandes
          </h2>
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
                        <div className="font-display text-base font-semibold text-amber-950">{order.id}</div>
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
                      <Button variant="gold" size="sm" className="rounded-full">
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
    </div>
  )
}

export function ClientPortalReservationsPanel() {
  const reservations = isPortalDemoEnabled() ? DEMO_RESERVATIONS : []

  return (
    <Card className="premium-card animate-fade-up p-6 sm:p-7">
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
                      <div className="font-display text-base font-semibold text-amber-950">{res.id}</div>
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
                      res.status === "Confirmée" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600",
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
  )
}

export function ClientPortalInvoicesPanel() {
  const sourceOrders = isPortalDemoEnabled() ? DEMO_ORDERS : []
  const rows = sourceOrders.map((o, i) => ({
    id: `FAC-${o.id.replace("ORD-", "")}`,
    orderId: o.id,
    date: o.date,
    amount: o.total,
    status: "Payée",
    idx: i,
  }))

  return (
    <Card className="premium-card animate-fade-up p-6 sm:p-7">
      <h2 className="mb-2 flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--lux-bordeaux)]/12 text-[color:var(--lux-bordeaux)]">
          <FileText className="h-5 w-5" />
        </span>
        Mes factures
      </h2>
      <p className="mb-6 text-sm text-amber-900/65">
        Reçus et factures liés à vos commandes. Téléchargez un PDF pour vos dossiers.
      </p>
      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune facture"
          description="Vos factures apparaîtront ici après vos commandes."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-2xl border border-amber-900/10 bg-white/75 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="min-w-0">
                <div className="font-display font-semibold text-amber-950">{row.id}</div>
                <div className="mt-1 text-xs text-amber-900/65">
                  Commande {row.orderId} ·{" "}
                  {new Date(row.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <span className="numeric-display text-lg font-semibold text-amber-950">
                  {row.amount.toFixed(2)} €
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  {row.status}
                </span>
                <Button variant="outline" size="sm" className="rounded-full">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

type PortalTicket = {
  code: string
  eventTitle: string
  eventDate: string
  paid: boolean
  amountEur: number
  status: "paid" | "pending" | "checked_in"
}

const PORTAL_DEMO_TICKETS: PortalTicket[] = [
  {
    code: "EVT-DEMO-ORIENT-01",
    eventTitle: "Soirée Orientale",
    eventDate: "2025-07-12",
    paid: true,
    amountEur: 45,
    status: "paid",
  },
  {
    code: "EVT-DEMO-JAZZ-02",
    eventTitle: "Jazz & Mezze",
    eventDate: "2025-08-03",
    paid: true,
    amountEur: 32,
    status: "paid",
  },
]

function ticketQrUrl(code: string) {
  const payload = `bloudan-ticket:${code}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload)}`
}

const TICKET_STATUS: Record<PortalTicket["status"], { label: string; className: string }> = {
  pending: { label: "En attente paiement", className: "bg-amber-100 text-amber-900" },
  paid: { label: "Payé", className: "bg-emerald-100 text-emerald-900" },
  checked_in: { label: "Entrée validée", className: "bg-blue-100 text-blue-900" },
}

export function ClientPortalEventTicketsPanel() {
  const tickets = isPortalDemoEnabled() ? PORTAL_DEMO_TICKETS : []

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-amber-950">Mes tickets événements</h2>
        <p className="mt-1 text-sm text-amber-900/65">
          Présentez le QR code à l&apos;entrée. Détails et paiement par billet.
        </p>
      </div>

      {tickets.length === 0 ? (
        <Card className="premium-card border-2 border-dashed border-amber-200/80 p-10 text-center">
          <PartyPopper className="mx-auto mb-3 h-10 w-10 text-[color:var(--lux-bordeaux)]/50" />
          <p className="font-display text-lg font-semibold text-amber-950">Aucun ticket événement pour le moment</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-amber-900/65">
            Réservez une place sur nos prochaines soirées pour voir vos billets ici.
          </p>
          <Button asChild variant="gold" className="mt-6 rounded-full">
            <Link href="/events">Découvrir les événements</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {tickets.map((t) => {
            const st = TICKET_STATUS[t.status]
            return (
              <Card
                key={t.code}
                className="premium-card overflow-hidden border border-[color:var(--lux-bordeaux)]/12 shadow-[var(--lux-shadow-soft)]"
              >
                <div className="grid gap-4 p-5 sm:grid-cols-[auto,1fr] sm:items-start sm:p-6">
                  <a
                    href={`/events/tickets/${encodeURIComponent(t.code)}`}
                    className="mx-auto block shrink-0 rounded-2xl border border-amber-900/10 bg-white p-2 shadow-inner"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ticketQrUrl(t.code)}
                      alt={`QR code billet ${t.code}`}
                      width={200}
                      height={200}
                      className="h-36 w-36 object-contain sm:h-[200px] sm:w-[200px]"
                    />
                  </a>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-lg font-semibold text-amber-950">{t.eventTitle}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-900/65">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(t.eventDate).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          st.className,
                        )}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-amber-900/55">Code : {t.code}</p>
                    <p className="numeric-display text-lg font-semibold text-amber-950">
                      {t.amountEur.toFixed(2)} €
                      {t.paid ? (
                        <span className="ml-2 text-sm font-normal text-emerald-700">· Réglé</span>
                      ) : (
                        <span className="ml-2 text-sm font-normal text-amber-700">· À régler</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button asChild size="sm" variant="outline" className="rounded-full">
                        <Link href={`/events/tickets/${encodeURIComponent(t.code)}`}>Fiche billet</Link>
                      </Button>
                      <Button asChild size="sm" variant="gold" className="rounded-full">
                        <Link href="/events">Autres événements</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
