"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  MapPin,
  Phone,
  Navigation2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wallet,
  Package,
  ChevronRight,
  ArrowLeft,
  Crosshair,
  Home,
  Store,
} from "lucide-react"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { PremiumBackdrop } from "@/components/site/PremiumBackdrop"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import DeliveryMapDynamic from "@/components/maps/DeliveryMapDynamic"
import { useDeliveryTracking } from "@/lib/hooks/useDeliveryTracking"
import {
  useDriverGeolocation,
  useSimulatedMovement,
} from "@/lib/hooks/useDriverGeolocation"
import { useI18n } from "@/lib/i18n/context"
import {
  DELIVERY_STATUS_META,
  DELIVERY_STATUS_FLOW,
  haversineKm,
  type DeliveryStatus,
} from "@/lib/delivery/types"

export default function DriverDetailPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = Array.isArray(params?.orderId) ? params.orderId[0] : params?.orderId
  const { t } = useI18n()
  const { getById, updateStatus, updateDriverLocation } = useDeliveryTracking()
  const [simulate, setSimulate] = useState(true)

  const delivery = orderId ? getById(orderId) : undefined

  // Geolocalisation reelle
  const geo = useDriverGeolocation({
    autoStart: false,
    fallback: delivery?.driver_location ?? delivery?.pickup_location,
    onUpdate: (pt) => {
      if (delivery) updateDriverLocation(delivery.id, pt)
    },
  })

  // Simulation (pour demo quand GPS refuse)
  const useFakeMotion =
    simulate &&
    (geo.status === "idle" || geo.status === "denied" || geo.status === "error")

  const simulatedPoint = useSimulatedMovement(
    delivery?.driver_location ?? delivery?.pickup_location ?? null,
    delivery?.delivery_location ?? { lat: 0, lng: 0 },
    {
      enabled: useFakeMotion && delivery?.status === "en_route",
      speed: 0.06,
      onUpdate: (pt) => {
        if (delivery) updateDriverLocation(delivery.id, pt)
      },
    },
  )

  const currentDriverPosition = useMemo(() => {
    if (geo.status === "tracking" && geo.position) return geo.position
    if (useFakeMotion && simulatedPoint) return simulatedPoint
    return delivery?.driver_location ?? null
  }, [geo.status, geo.position, useFakeMotion, simulatedPoint, delivery?.driver_location])

  // Sauvegarde reguliere de la position simulee
  useEffect(() => {
    if (!delivery || !currentDriverPosition) return
    if (!delivery.driver_location) {
      updateDriverLocation(delivery.id, currentDriverPosition)
    }
  }, [delivery, currentDriverPosition, updateDriverLocation])

  if (!delivery) {
    return (
      <PageShell>
        <SiteHeader backHref="/driver" />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Livraison introuvable.</p>
              <Button asChild variant="outline" className="mt-4 gap-2">
                <Link href="/driver">
                  <ArrowLeft className="h-4 w-4" /> {t("driver.dashboard")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </PageShell>
    )
  }

  const meta = DELIVERY_STATUS_META[delivery.status]
  const nextStatuses = DELIVERY_STATUS_FLOW[delivery.status] ?? []
  const isActive = ["assigned", "picked_up", "en_route", "arrived"].includes(delivery.status)

  const distanceKm = currentDriverPosition
    ? haversineKm(currentDriverPosition, delivery.delivery_location)
    : haversineKm(delivery.pickup_location, delivery.delivery_location)

  const etaMin = delivery.estimated_minutes
  const cashToCollect =
    delivery.payment_status === "cash_on_delivery" ? delivery.total_amount : 0

  const handleStatus = (status: DeliveryStatus) => {
    updateStatus(delivery.id, status)
  }

  const openGps = () => {
    const { lat, lng } = delivery.delivery_location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(url, "_blank", "noopener")
  }

  const primaryAction = getPrimaryAction(delivery.status, t)

  return (
    <PageShell>
      <PremiumBackdrop />
      <SiteHeader
        backHref="/driver"
        trailing={
          <div className="text-right">
            <p className="text-xs text-amber-900/65">#{delivery.order_number}</p>
            <Badge className={`${meta.color} text-white`}>{t(meta.i18nKey)}</Badge>
          </div>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Colonne gauche — Map + actions */}
          <section className="space-y-6 lg:col-span-2">
            {/* MAP */}
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Navigation2 className="h-4 w-4 text-indigo-500" />
                  Carte en temps reel
                </CardTitle>
                <div className="flex items-center gap-2 text-xs">
                  {geo.status === "tracking" ? (
                    <Badge className="gap-1 bg-emerald-500 text-white">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                      GPS actif
                    </Badge>
                  ) : useFakeMotion ? (
                    <Badge variant="secondary">Simulation</Badge>
                  ) : (
                    <Badge variant="outline">GPS inactif</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <DeliveryMapDynamic
                  pickup={delivery.pickup_location}
                  destination={delivery.delivery_location}
                  driver={currentDriverPosition}
                  pickupLabel="Restaurant"
                  destinationLabel={delivery.customer_name}
                  driverLabel={delivery.driver_name ?? "Livreur"}
                  height={420}
                />
              </CardContent>
              <div className="flex flex-wrap gap-2 border-t bg-slate-50/70 p-3 dark:bg-slate-900/30">
                {geo.status === "tracking" ? (
                  <Button size="sm" variant="outline" onClick={geo.stop} className="gap-2">
                    <Crosshair className="h-4 w-4" /> Arreter GPS
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={geo.start} className="gap-2">
                    <Crosshair className="h-4 w-4" /> Activer GPS
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={openGps} className="gap-2">
                  <Navigation2 className="h-4 w-4" /> {t("driver.openGps")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSimulate((s) => !s)}
                  className="gap-2"
                >
                  {simulate ? "Desactiver simulation" : "Activer simulation"}
                </Button>
              </div>
            </Card>

            {/* ACTIONS */}
            {isActive && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {primaryAction && (
                    <Button
                      size="lg"
                      onClick={() => handleStatus(primaryAction.status)}
                      className={`flex-1 gap-2 ${primaryAction.className}`}
                    >
                      {primaryAction.icon}
                      {primaryAction.label}
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </Button>
                  )}
                  {nextStatuses.includes("problem") && (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleStatus("problem")}
                      className="gap-2 text-rose-600 hover:bg-rose-50"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {t("driver.reportProblem")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TIMELINE */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Historique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <TimelineRow
                  active={!!delivery.assigned_at}
                  label={t("driver.status.assigned")}
                  timestamp={delivery.assigned_at}
                />
                <TimelineRow
                  active={!!delivery.picked_up_at}
                  label={t("driver.status.picked_up")}
                  timestamp={delivery.picked_up_at}
                />
                <TimelineRow
                  active={!!delivery.en_route_at}
                  label={t("driver.status.en_route")}
                  timestamp={delivery.en_route_at}
                />
                <TimelineRow
                  active={!!delivery.delivered_at}
                  label={t("driver.status.delivered")}
                  timestamp={delivery.delivered_at}
                />
              </CardContent>
            </Card>
          </section>

          {/* Colonne droite — info */}
          <aside className="space-y-6">
            {/* ETA card */}
            <Card className="border-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <Clock className="h-4 w-4" />
                  {t("driver.estimatedArrival")}
                </div>
                <div className="mt-2 text-5xl font-bold tabular-nums">
                  {etaMin ? `${etaMin}` : "—"}
                  <span className="ml-1 text-lg font-normal">min</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm opacity-90">
                  <MapPin className="h-4 w-4" />
                  {distanceKm.toFixed(2)} km {t("driver.distance").toLowerCase()}
                </div>
              </CardContent>
            </Card>

            {/* Client */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Home className="h-4 w-4 text-rose-500" /> Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">{delivery.customer_name}</p>
                  <p className="text-slate-500">{delivery.delivery_address}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1 gap-2">
                    <a href={`tel:${delivery.customer_phone}`}>
                      <Phone className="h-4 w-4" />
                      {delivery.customer_phone}
                    </a>
                  </Button>
                </div>
                {delivery.delivery_notes && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200">
                    <span className="font-semibold">{t("driver.notes")} :</span>{" "}
                    {delivery.delivery_notes}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Restaurant */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="h-4 w-4 text-emerald-500" /> {t("driver.pickup")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                <p>Restaurant Joseph Bechara</p>
                <p className="text-xs text-slate-400">
                  {delivery.pickup_location.lat.toFixed(4)},{" "}
                  {delivery.pickup_location.lng.toFixed(4)}
                </p>
              </CardContent>
            </Card>

            {/* Paiement */}
            <Card
              className={
                cashToCollect > 0
                  ? "border-amber-300 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30"
                  : "border-emerald-300 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/30"
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {cashToCollect > 0 ? (
                      <Wallet className="h-5 w-5 text-amber-700" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    )}
                    <div>
                      <p className="text-xs font-medium">
                        {cashToCollect > 0 ? t("driver.cashToCollect") : t("driver.paid")}
                      </p>
                      <p className="text-lg font-bold">
                        {delivery.total_amount.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            {delivery.items && delivery.items.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    {t("driver.itemsLabel")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {delivery.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>{it.name}</span>
                      <span className="text-slate-500">×{it.quantity}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>

      <AIAgentBadge context="driver" />
      <SiteFooter />
    </PageShell>
  )
}

function TimelineRow({
  active,
  label,
  timestamp,
}: {
  active: boolean
  label: string
  timestamp?: string | null
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          active
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 bg-white text-transparent dark:bg-slate-900"
        }`}
      >
        {active && <CheckCircle2 className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1">
        <span className={active ? "font-medium text-slate-900 dark:text-slate-100" : "text-slate-400"}>
          {label}
        </span>
      </div>
      {timestamp && (
        <span className="text-xs text-slate-400">
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  )
}

function getPrimaryAction(
  status: DeliveryStatus,
  t: (k: string) => string,
): { status: DeliveryStatus; label: string; icon: React.ReactNode; className: string } | null {
  switch (status) {
    case "assigned":
      return {
        status: "picked_up",
        label: t("driver.action.markPickedUp"),
        icon: <Package className="h-4 w-4" />,
        className: "bg-amber-500 hover:bg-amber-600",
      }
    case "picked_up":
      return {
        status: "en_route",
        label: t("driver.action.markEnRoute"),
        icon: <Navigation2 className="h-4 w-4" />,
        className: "bg-indigo-500 hover:bg-indigo-600",
      }
    case "en_route":
      return {
        status: "arrived",
        label: t("driver.action.markArrived"),
        icon: <MapPin className="h-4 w-4" />,
        className: "bg-purple-500 hover:bg-purple-600",
      }
    case "arrived":
      return {
        status: "delivered",
        label: t("driver.action.markDelivered"),
        icon: <CheckCircle2 className="h-4 w-4" />,
        className: "bg-emerald-500 hover:bg-emerald-600",
      }
    default:
      return null
  }
}
