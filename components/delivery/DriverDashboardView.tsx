"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Wallet,
  Navigation2,
  Bike,
  CircleDot,
} from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StaggerList, StaggerItem, MotionCard } from "@/components/ui/motion-primitives"
import { useI18n } from "@/lib/i18n/context"
import { useDeliveryTracking } from "@/lib/hooks/useDeliveryTracking"
import {
  DELIVERY_STATUS_META,
  type DeliveryStatus,
  type DeliveryTracking,
} from "@/lib/delivery/types"

const FILTER_GROUPS: { id: "all" | "available" | "active" | "done"; statuses: DeliveryStatus[] }[] = [
  { id: "all", statuses: ["pending", "assigned", "picked_up", "en_route", "arrived", "delivered", "problem"] },
  { id: "available", statuses: ["pending"] },
  { id: "active", statuses: ["assigned", "picked_up", "en_route", "arrived"] },
  { id: "done", statuses: ["delivered"] },
]

export type DriverDashboardViewProps = {
  variant?: "public" | "workspace"
}

export function DriverDashboardView({ variant = "public" }: DriverDashboardViewProps) {
  const { t } = useI18n()
  const { deliveries, assignDriver } = useDeliveryTracking()
  const [filter, setFilter] = useState<"all" | "available" | "active" | "done">("active")
  const [hint, setHint] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const group = FILTER_GROUPS.find((g) => g.id === filter)
    if (!group) return deliveries
    return deliveries.filter((d) => group.statuses.includes(d.status))
  }, [deliveries, filter])

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: 0, available: 0, active: 0, done: 0 }
    for (const d of deliveries) {
      map.all += 1
      for (const g of FILTER_GROUPS) {
        if (g.statuses.includes(d.status)) map[g.id] = (map[g.id] || 0) + 1
      }
    }
    return map
  }, [deliveries])

  const handleAccept = (d: DeliveryTracking) => {
    assignDriver(d.id, {
      id: "drv-me",
      name: "Mohamed Karim",
      phone: "+216 22 111 222",
      rating: 4.9,
    })
  }

  const showSoon = (msg: string) => {
    setHint(msg)
    window.setTimeout(() => setHint(null), 2800)
  }

  const titleSize = variant === "workspace" ? "text-2xl sm:text-3xl" : "text-4xl"

  return (
    <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="mb-2 flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: -4, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 260 }}
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg sm:h-14 sm:w-14"
            style={{ background: "var(--lux-gradient-gold)" }}
          >
            <span className="aurora-ring" />
            <Truck className="h-6 w-6 sm:h-7 sm:w-7" />
          </motion.div>
          <div>
            <h1 className={cnTitle(titleSize)}>{t("driver.title")}</h1>
            <p className="text-sm text-amber-900/65 dark:text-amber-200/65">{t("driver.subtitle")}</p>
            <div className="hairline-gold mt-3 w-40" />
          </div>
        </div>
      </motion.header>

      {hint ? (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          {hint}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="gap-1" type="button" onClick={() => showSoon("Mise à jour statut « récupérée » — branchement API livraison à finaliser.")}>
          <Package className="h-4 w-4" />
          Récupérée
        </Button>
        <Button size="sm" variant="outline" className="gap-1" type="button" onClick={() => showSoon("En route — synchronisation temps réel à brancher.")}>
          <Bike className="h-4 w-4" />
          En route
        </Button>
        <Button size="sm" variant="outline" className="gap-1" type="button" onClick={() => showSoon("Livrée — confirmation client & signature à brancher.")}>
          <CircleDot className="h-4 w-4" />
          Livrée
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            { id: "all", label: t("driver.dashboard") },
            { id: "available", label: t("driver.available") },
            { id: "active", label: t("driver.inProgress") },
            { id: "done", label: t("driver.completed") },
          ] as const
        ).map((opt) => (
          <Button
            key={opt.id}
            variant={filter === opt.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(opt.id)}
            className="gap-2"
          >
            {opt.label}
            <Badge variant="secondary" className="ml-1">
              {counts[opt.id] ?? 0}
            </Badge>
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <MotionCard className="p-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-amber-700/30" />
          <p className="text-amber-900/60 dark:text-amber-100/60">{t("driver.noDeliveries")}</p>
        </MotionCard>
      ) : (
        <StaggerList className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((d) => (
            <StaggerItem key={d.id}>
              <DeliveryCard delivery={d} onAccept={() => handleAccept(d)} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </main>
  )
}

function cnTitle(size: string) {
  return `font-display font-bold tracking-tight text-amber-950 dark:text-amber-100 ${size}`
}

type DeliveryCardProps = {
  delivery: DeliveryTracking
  onAccept: () => void
}

function DeliveryCard({ delivery, onAccept }: DeliveryCardProps) {
  const { t } = useI18n()
  const meta = DELIVERY_STATUS_META[delivery.status]
  const isAvailable = delivery.status === "pending"
  const isActive = ["assigned", "picked_up", "en_route", "arrived"].includes(delivery.status)
  const cashToCollect =
    delivery.payment_status === "cash_on_delivery" ? delivery.total_amount : 0

  return (
    <Card className="premium-card shimmer-gold group overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-slate-400" />
            #{delivery.order_number}
          </CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(delivery.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge className={`${meta.color} text-white`}>{t(meta.i18nKey)}</Badge>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
            <div className="min-w-0">
              <p className="truncate font-medium">{delivery.customer_name}</p>
              <p className="truncate text-xs text-slate-500">{delivery.delivery_address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Phone className="h-3.5 w-3.5" />
            <a href={`tel:${delivery.customer_phone}`} className="hover:underline">
              {delivery.customer_phone}
            </a>
          </div>
        </div>

        {delivery.items && delivery.items.length > 0 && (
          <div className="rounded-md bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-900/40">
            {delivery.items
              .slice(0, 3)
              .map((it) => `${it.quantity}× ${it.name}`)
              .join(" · ")}
            {delivery.items.length > 3 && (
              <span className="text-slate-400"> +{delivery.items.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          {delivery.estimated_minutes ? (
            <span className="flex items-center gap-1 font-medium text-indigo-600">
              <Clock className="h-3.5 w-3.5" />
              {delivery.estimated_minutes} min
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
          {cashToCollect > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <Wallet className="h-3.5 w-3.5" />
              {cashToCollect.toFixed(2)} €
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("driver.paid")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {isAvailable ? (
            <Button size="sm" onClick={onAccept} className="flex-1 gap-2">
              <AlertCircle className="h-4 w-4" />
              {t("driver.acceptDelivery")}
            </Button>
          ) : (
            <Button asChild size="sm" className="flex-1 gap-2">
              <Link href={`/driver/${delivery.id}`}>
                <Navigation2 className="h-4 w-4" />
                {t("driver.viewMap")}
              </Link>
            </Button>
          )}
          {isActive && (
            <Button variant="outline" size="sm" asChild className="gap-1" title={t("driver.callClient")}>
              <a href={`tel:${delivery.customer_phone}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
