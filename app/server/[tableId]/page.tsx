"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import {
  UtensilsCrossed,
  CheckCircle2,
  BellRing,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  Combine,
  BookOpen,
  MapPin,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { StaffWorkspaceShell } from "@/components/workspace/StaffWorkspaceShell"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OrderProductName } from "@/components/orders/OrderProductName"
import { useRealtimeOrders, type OrderStatus } from "@/lib/hooks/useRealtimeOrders"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { useTableAlerts } from "@/lib/hooks/useTableAlerts"
import {
  ServiceRequestBadges,
  mapAlertsToServiceRequests,
} from "@/components/floor-plan/ServiceRequestIndicators"
import { TableCleaningPanel } from "@/components/floor-plan/TableCleaningPanel"
import { useMergeGroups } from "@/lib/hooks/useMergeGroups"
import { useFloorPlanTables } from "@/lib/hooks/useFloorPlanTables"
import { useResolvedRestaurantTable } from "@/lib/hooks/useResolvedRestaurantTable"
import { audienceForStationsFromItems } from "@/lib/notifications/audience"
import { isNeedsCleaningStatus } from "@/lib/table-lifecycle"
import { dispatchRealtimeRefresh } from "@/lib/realtime/bus"
import { UNIFIED_TABLE_STATUS_META } from "@/lib/table-status/unified"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { StationStatusBanner } from "@/components/stations/StationStatusBanner"

const STATUS_LABEL_FR: Record<OrderStatus, string> = {
  received: "Reçue",
  preparing: "En préparation",
  ready: "Prête",
  delivering: "Service en cours",
  completed: "Terminée",
  cancelled: "Annulée",
}

const CART_KEY_PREFIX = "jb-staff-table-cart:"

export default function ServerTableOrderPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const viewCleaning = searchParams.get("view") === "cleaning"

  const { updateStatus, orders, updateOrderItem, cancelOrderItem } = useRealtimeOrders()
  const { add: addNotification } = useNotifications()
  const { activeByTable, acknowledge } = useTableAlerts()
  const { groupOf } = useMergeGroups()
  const { tables, reload: reloadTables } = useFloorPlanTables()
  const { effectiveNumber, displayLabel } = useResolvedRestaurantTable(tableId)

  const myGroup = groupOf(Number(tableId))
  const isMember = Boolean(myGroup) && myGroup?.mainTable !== Number(tableId)
  const effectiveTableId = isMember ? String(myGroup!.mainTable) : String(tableId)

  const floorRow = useMemo(() => {
    const num = effectiveNumber
    return tables.find(
      (t) =>
        (num != null && Number(t.table_number) === num) ||
        String(t.table_code ?? "") === String(tableId) ||
        String(t.table_number) === String(tableId),
    )
  }, [tables, effectiveNumber, tableId])

  const needsCleaning =
    viewCleaning ||
    floorRow?.unified_status === "CLEANING" ||
    isNeedsCleaningStatus(floorRow?.restaurant_status) ||
    String(floorRow?.payment_status_code ?? "").toUpperCase() === "NEEDS_CLEANING"

  const tableAlerts = activeByTable(effectiveTableId)
  const tableOrders = orders.filter(
    (o) => String(o.table_number) === effectiveTableId && o.status !== "cancelled",
  )

  const [toast, setToast] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [menuCartCount, setMenuCartCount] = useState(0)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`${CART_KEY_PREFIX}${tableId}`)
      if (!raw) {
        setMenuCartCount(0)
        return
      }
      const lines = JSON.parse(raw) as Array<{ quantity?: number }>
      setMenuCartCount(lines.reduce((s, l) => s + (l.quantity ?? 0), 0))
    } catch {
      setMenuCartCount(0)
    }
  }, [tableId])

  const statusLabel = floorRow?.unified_status_label ?? "—"
  const zoneLabel = floorRow?.zone ?? floorRow?.plan_zone ?? ""

  const markCleaned = useCallback(async () => {
    const tid = floorRow?.table_id ?? effectiveNumber
    if (tid == null || !Number.isFinite(Number(tid))) {
      setToast("Table introuvable")
      return
    }
    const res = await fetch("/api/caisse/mark-table-cleaned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_id: tid }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setToast(typeof j.error === "string" ? j.error : "Échec confirmation nettoyage")
      setTimeout(() => setToast(null), 4000)
      return
    }
    dispatchRealtimeRefresh("tables")
    await reloadTables()
    setToast("Table libre — prête pour un nouveau client")
    setTimeout(() => router.push("/server/tables"), 1200)
  }, [floorRow?.table_id, effectiveNumber, reloadTables, router])

  const toggleOrderExpanded = useCallback((orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }, [])

  const cancelWholeOrder = useCallback(
    (orderId: string) => {
      const reason = window.prompt(
        "Annuler TOUTE la commande — indiquez une raison (>= 3 caractères) :",
        "",
      )
      if (!reason || reason.trim().length < 3) {
        if (reason !== null) setToast("Raison trop courte — annulation refusée")
        return
      }
      const targetOrder = orders.find((o) => o.id === orderId)
      const stationAudience = targetOrder
        ? audienceForStationsFromItems(targetOrder.items)
        : ["ADMIN" as const]
      updateStatus(orderId, "cancelled")
      addNotification({
        type: "new_order",
        title: "Commande annulée",
        message: `Commande ${orderId.slice(0, 6)} — Table ${tableId} — Raison : ${reason.trim()}`,
        audience: [...new Set([...stationAudience, "CASHIER" as const])],
      })
      setToast(`Commande annulée (${reason.trim()})`)
      setTimeout(() => setToast(null), 3000)
    },
    [orders, updateStatus, addNotification, tableId],
  )

  const cancelItem = useCallback(
    (orderId: string, itemId: string, itemName: string, isPrepared: boolean) => {
      const prefix = isPrepared
        ? "⚠️ Item déjà préparé/servi — annulation = perte. "
        : ""
      const reason = window.prompt(
        `${prefix}Annuler l'item « ${itemName} » — indiquez une raison (>= 3 caractères) :`,
        isPrepared ? "Gaspillé après préparation" : "",
      )
      if (!reason || reason.trim().length < 3) {
        if (reason !== null) setToast("Raison trop courte — annulation refusée")
        return
      }
      const ok = cancelOrderItem(orderId, itemId, reason.trim())
      if (!ok) {
        setToast("Item déjà annulé")
        setTimeout(() => setToast(null), 3000)
        return
      }
      const targetOrder = orders.find((o) => o.id === orderId)
      const targetItem = targetOrder?.items.find((it) => it.id === itemId)
      const itemStationAudience = targetItem
        ? audienceForStationsFromItems([{ name: targetItem.name, station: targetItem.station }])
        : ["ADMIN" as const]
      addNotification({
        type: "new_order",
        title: "Item annulé",
        message: `${itemName} — Table ${tableId} — Raison : ${reason.trim()}`,
        audience: [...new Set([...itemStationAudience, "CASHIER" as const])],
      })
      setToast(`Item annulé : ${itemName} (${reason.trim()})`)
      setTimeout(() => setToast(null), 3000)
    },
    [orders, cancelOrderItem, addNotification, tableId],
  )

  const editItemQty = useCallback(
    (orderId: string, itemId: string, currentQty: number) => {
      const raw = window.prompt(
        `Nouvelle quantité (actuelle : ${currentQty}) :`,
        String(currentQty),
      )
      if (raw === null) return
      const next = Math.floor(Number(String(raw).trim()))
      if (!Number.isFinite(next) || next < 1) {
        setToast("Quantité invalide (≥ 1)")
        setTimeout(() => setToast(null), 3000)
        return
      }
      if (next === currentQty) return
      updateOrderItem(orderId, itemId, { quantity: next })
      setToast(`Quantité mise à jour : ${next}`)
      setTimeout(() => setToast(null), 2500)
    },
    [updateOrderItem],
  )

  const editItemNote = useCallback(
    (orderId: string, itemId: string, currentNote: string | undefined) => {
      const raw = window.prompt(
        "Note / allergie pour cet item :",
        currentNote ?? "",
      )
      if (raw === null) return
      updateOrderItem(orderId, itemId, { notes: raw.trim() || undefined })
      setToast("Note mise à jour")
      setTimeout(() => setToast(null), 2500)
    },
    [updateOrderItem],
  )

  if (needsCleaning) {
    return (
      <RequireAuth roles={["ADMIN", "SERVER"]}>
        <StaffWorkspaceShell title={`Table ${displayLabel}`} subtitle="Nettoyage requis">
          <PageShell className="min-h-screen bg-slate-100 dark:bg-slate-950">
            <SiteHeader backHref="/server/tables" backLabel="Plan des tables" hideMainNav />
            <div className="site-container flex max-w-lg flex-1 flex-col gap-4 py-8">
              <TableCleaningPanel
                tableLabel={displayLabel}
                cleaningSince={floorRow?.cleaning_since}
                onMarkCleaned={markCleaned}
              />
              <p className="text-center text-sm text-muted-foreground">
                Aucune nouvelle commande possible tant que la table n&apos;est pas libérée.
              </p>
            </div>
          </PageShell>
        </StaffWorkspaceShell>
      </RequireAuth>
    )
  }

  const canOrder = !needsCleaning
  const menuHref = `/server/${tableId}/menu`

  return (
    <RequireAuth roles={["ADMIN", "SERVER"]}>
      <StaffWorkspaceShell title={`Table ${displayLabel}`} subtitle="Détail table & commandes">
        <PageShell className="min-h-screen bg-slate-100 dark:bg-slate-950">
          <SiteHeader
            backHref="/server/tables"
            backLabel="Plan des tables"
            hideMainNav
            trailing={
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {statusLabel}
                </Badge>
                {menuCartCount > 0 && (
                  <Badge className="bg-amber-600 text-white">
                    <ShoppingCart className="mr-1 h-3 w-3" />
                    {menuCartCount}
                  </Badge>
                )}
              </div>
            }
          />

          {toast && (
            <div className="fixed right-4 top-20 z-[100] animate-in slide-in-from-right fade-in rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 shadow-lg dark:border-emerald-700 dark:bg-emerald-950">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                {toast}
              </div>
            </div>
          )}

          <div className="site-container flex-1 py-4">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Table {displayLabel}
              </h1>
              {zoneLabel ? (
                <Badge variant="outline" className="gap-1 text-xs">
                  <MapPin className="h-3 w-3" />
                  {zoneLabel}
                </Badge>
              ) : null}
              {floorRow?.unified_status ? (
                <Badge
                  className={cn(
                    "text-xs",
                    floorRow.unified_status === "LIBRE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-900",
                  )}
                >
                  {UNIFIED_TABLE_STATUS_META[floorRow.unified_status]?.label ?? statusLabel}
                </Badge>
              ) : null}
            </div>

            {myGroup ? (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-100">
                <Combine className="h-4 w-4" />
                <span className="font-semibold">
                  Groupe fusionné — tables {myGroup.members.join(", ")}
                </span>
                {isMember ? (
                  <>
                    <span>· vous voyez les commandes de la table principale {myGroup.mainTable}.</span>
                    <Link
                      href={`/server/${myGroup.mainTable}`}
                      className="ml-auto rounded-md border border-violet-300 bg-white/70 px-2 py-1 font-medium text-violet-800 hover:bg-white dark:border-violet-700 dark:bg-violet-900/40 dark:text-violet-100"
                    >
                      Aller sur la table principale
                    </Link>
                  </>
                ) : (
                  <span>· cette table est la principale du groupe.</span>
                )}
              </div>
            ) : null}

            {(tableAlerts.length > 0 || tableOrders.length > 0) && (
              <div className="mb-4 grid gap-3 md:grid-cols-2">
                {tableAlerts.length > 0 && (
                  <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-3 dark:border-violet-900/40 dark:bg-violet-950/30">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-900 dark:text-violet-200">
                      <BellRing className="h-4 w-4 animate-pulse" />
                      Demandes client
                    </div>
                    <ServiceRequestBadges
                      requests={mapAlertsToServiceRequests(tableAlerts, effectiveTableId)}
                      staffRole="SERVER"
                      onAcknowledge={async (id) => {
                        const { ok } = await acknowledge(id)
                        if (ok) setToast("Demande traitée")
                      }}
                    />
                  </div>
                )}

                {tableOrders.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/30 md:col-span-2">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                      <UtensilsCrossed className="h-4 w-4" />
                      Commandes en cours
                    </div>
                    <ul className="space-y-2">
                      {tableOrders.map((o) => {
                        const isOpen = expandedOrders.has(o.id)
                        const totalItems = o.items.reduce(
                          (s, it) =>
                            s + (it.item_status === "cancelled" ? 0 : Number(it.quantity) || 0),
                          0,
                        )
                        const cancelledCount = o.items.filter(
                          (it) => it.item_status === "cancelled",
                        ).length
                        return (
                          <li
                            key={o.id}
                            className="overflow-hidden rounded-lg bg-white/70 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              aria-expanded={isOpen}
                              onClick={() => toggleOrderExpanded(o.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault()
                                  toggleOrderExpanded(o.id)
                                }
                              }}
                              className={cn(
                                "flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left transition select-none",
                                "hover:bg-amber-100/60 dark:hover:bg-amber-900/40",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
                                isOpen ? "bg-amber-100/40 dark:bg-amber-900/40" : "",
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                {isOpen ? (
                                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                )}
                                <span className="font-semibold">#{o.order_number}</span>
                                <span className="text-amber-700 dark:text-amber-300">
                                  — {STATUS_LABEL_FR[o.status]}
                                </span>
                                <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80">
                                  · {totalItems} produit{totalItems > 1 ? "s" : ""}
                                  {cancelledCount > 0
                                    ? ` · ${cancelledCount} annulé${cancelledCount > 1 ? "s" : ""}`
                                    : ""}
                                  {Number(o.total) > 0 ? ` · ${Number(o.total).toFixed(2)} DT` : ""}
                                </span>
                              </div>
                              <div
                                className="flex gap-1"
                                onClick={(e) => e.stopPropagation()}
                                role="presentation"
                              >
                                {o.status === "ready" && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatus(o.id, "delivering")}
                                    className="h-7 px-2 text-xs"
                                  >
                                    Apportée
                                  </Button>
                                )}
                                {o.status === "delivering" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatus(o.id, "completed")}
                                    className="h-7 px-2 text-xs"
                                  >
                                    Servie
                                  </Button>
                                )}
                                {o.status !== "completed" && o.status !== "cancelled" ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => cancelWholeOrder(o.id)}
                                    className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                                    title="Annuler la commande complète"
                                  >
                                    Annuler tout
                                  </Button>
                                ) : null}
                              </div>
                            </div>

                            {isOpen ? (
                              <ul className="space-y-1 border-t border-amber-200/60 bg-amber-50/40 px-3 py-2 dark:border-amber-900/30 dark:bg-amber-950/20">
                                {o.items.map((it) => {
                                  const isCancelled = it.item_status === "cancelled"
                                  const isPrepared =
                                    it.item_status === "ready" || it.item_status === "served"
                                  return (
                                    <li
                                      key={it.id}
                                      className={cn(
                                        "flex flex-wrap items-center gap-1.5 rounded-md px-2 py-1",
                                        isCancelled
                                          ? "bg-red-100/60 text-red-800 line-through dark:bg-red-950/30 dark:text-red-200"
                                          : "bg-white/60 dark:bg-amber-950/30",
                                      )}
                                    >
                                      <span className="font-semibold">×{it.quantity}</span>
                                      <OrderProductName
                                        name={it.name}
                                        name_ar={it.name_ar}
                                        truncate
                                        className="min-w-0 flex-1"
                                      />
                                      {it.notes ? (
                                        <span className="text-[10px] italic text-amber-800 dark:text-amber-200">
                                          « {it.notes} »
                                        </span>
                                      ) : null}
                                      {isCancelled ? (
                                        <span className="text-[10px] font-medium text-red-700 dark:text-red-300">
                                          Annulé : {it.cancel_reason ?? "—"}
                                        </span>
                                      ) : (
                                        <div className="ml-auto flex items-center gap-1">
                                          {o.status !== "completed" && o.status !== "cancelled" ? (
                                            <>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-1.5 text-[10px]"
                                                onClick={() => editItemQty(o.id, it.id, it.quantity)}
                                                title="Modifier quantité"
                                              >
                                                Qté
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-1.5 text-[10px]"
                                                onClick={() => editItemNote(o.id, it.id, it.notes)}
                                                title="Modifier note / allergie"
                                              >
                                                Note
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-1.5 text-[10px] text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() =>
                                                  cancelItem(o.id, it.id, it.name, isPrepared)
                                                }
                                                title="Annuler cet item avec raison"
                                              >
                                                Annuler
                                              </Button>
                                            </>
                                          ) : null}
                                        </div>
                                      )}
                                    </li>
                                  )
                                })}
                              </ul>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <StationStatusBanner />
            </div>

            {canOrder ? (
              <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:to-slate-900">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Catalogue visuel
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Images, variantes, extras — même menu que le QR client. Ajoutez des produits
                      et envoyez en cuisine / bar / chicha.
                    </p>
                  </div>
                  <Button asChild size="lg" className="gap-2 bg-amber-600 hover:bg-amber-700">
                    <Link href={menuHref}>
                      <ShoppingCart className="h-4 w-4" />
                      {tableOrders.length > 0 ? "Ajouter des produits" : "Nouvelle commande"}
                      {menuCartCount > 0 ? ` (${menuCartCount})` : ""}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </PageShell>
      </StaffWorkspaceShell>
    </RequireAuth>
  )
}
