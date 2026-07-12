"use client"

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react"
import Link from "next/link"
import {
  BellRing,
  ChefHat,
  CircleCheck,
  Combine,
  HandPlatter,
  Monitor,
  PackageOpen,
  Phone,
  Receipt,
  Split,
  Unlink,
  Utensils,
  ArrowRightLeft,
  Landmark,
} from "lucide-react"
import { toast } from "sonner"

import { PageShell } from "@/components/site/PageShell"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SplitBillDialog } from "@/components/server/SplitBillDialog"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole } from "@/lib/auth/roles"
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders"
import { useTableAlerts } from "@/lib/hooks/useTableAlerts"
import { useMergeGroups } from "@/lib/hooks/useMergeGroups"
import {
  computeTableSnapshot,
  TABLE_STATUS_META,
  TONE_BADGE,
  TONE_CARD,
  type TableSnapshot,
} from "@/lib/table-status"
import { JANNAT_TABLES } from "@/lib/admin/jannat-tables-data"
import { JANNAT_TABLE_ZONES, ZONE_LABELS_FR } from "@/lib/admin/restaurant-tables"
import { useFloorPlanTables, type FloorPlanTable } from "@/lib/hooks/useFloorPlanTables"
import type { TableAlert } from "@/lib/hooks/useTableAlerts"
import type { ServiceRequestType } from "@/lib/table/service-requests"
import { TableCleaningPanel, CLEANING_CARD_RING } from "@/components/floor-plan/TableCleaningPanel"
import {
  ServiceRequestBadges,
  mapAlertsToServiceRequests,
  useServiceRequestVisuals,
} from "@/components/floor-plan/ServiceRequestIndicators"

const ZONES: Record<string, { label: string; color: string }> = {
  terrasse: { label: "Terrasse", color: "text-amber-600 dark:text-amber-400" },
  nofra: { label: "Nofra", color: "text-blue-600 dark:text-blue-400" },
  central: { label: "Salle centrale", color: "text-purple-600 dark:text-purple-400" },
  // legacy
  salle: { label: "Salle", color: "text-slate-600 dark:text-slate-400" },
  interieur: { label: "Intérieur", color: "text-slate-600 dark:text-slate-400" },
  vip: { label: "VIP", color: "text-purple-600 dark:text-purple-400" },
  evenement: { label: "Événement", color: "text-rose-600 dark:text-rose-400" },
  gaming: { label: "Gaming", color: "text-rose-600 dark:text-rose-400" },
}

function zoneForTable(tableNumber: number, rows: FloorPlanTable[]): string {
  const row = rows.find((t) => Number(t.table_number) === tableNumber)
  return String(row?.plan_zone || row?.zone || "terrasse")
}

function tableCodeFor(tableNumber: number, rows: FloorPlanTable[]): string {
  const row = rows.find((t) => Number(t.table_number) === tableNumber)
  return (row?.table_code && String(row.table_code).trim()) || String(tableNumber)
}

const FALLBACK_TABLE_NUMBERS = JANNAT_TABLES.map((t) => t.table_number)

type OverviewTable = FloorPlanTable

function resolveServerTableHref(
  code: string,
  snap: TableSnapshot,
  floorRow?: FloorPlanTable,
): string {
  const pay = String(floorRow?.payment_status_code ?? "").toUpperCase()
  const db = String(floorRow?.restaurant_status ?? "").toUpperCase()
  if (pay === "NEEDS_CLEANING" || db === "CLEANING" || snap.status === "NEEDS_CLEANING") {
    return `/server/${code}?view=cleaning`
  }
  if (pay === "FREE" && snap.status === "FREE") return `/server/${code}/menu`
  return `/server/${code}`
}

function isTableNeedsCleaning(floorRow?: FloorPlanTable): boolean {
  const pay = String(floorRow?.payment_status_code ?? "").toUpperCase()
  const db = String(floorRow?.restaurant_status ?? "").toUpperCase()
  return pay === "NEEDS_CLEANING" || db === "CLEANING"
}

export type ServerFloorPlanProps = {
  /** Intégré dans StaffWorkspaceShell : pas de PageShell ni SiteHeader externes */
  layout?: "full" | "workspace"
}

export function ServerFloorPlan({ layout = "full" }: ServerFloorPlanProps) {
  const { orders, transferTableNumber, clearTableOrders } = useRealtimeOrders()
  const { alerts, raise, transferTableAlerts, resolveTable, acknowledge } = useTableAlerts()
  const { groups, addGroup, releaseGroup, releaseGroupByTable, groupOf } = useMergeGroups()
  const { user } = useAuth()
  const staffRole = user ? normalizeRole(user.role) : null
  const canOpenCaisse = user && ["ADMIN", "CASHIER"].includes(staffRole ?? "")

  const [transferOpen, setTransferOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [splitOpen, setSplitOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [overview, setOverview] = useState<OverviewTable[]>([])
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [fromTableNum, setFromTableNum] = useState<number | "">("")
  const [toTableNum, setToTableNum] = useState<number | "">("")
  const [transferReason, setTransferReason] = useState("")
  const [transferSubmitting, setTransferSubmitting] = useState(false)
  const [callTableNum, setCallTableNum] = useState(1)
  const [splitDefaultTable, setSplitDefaultTable] = useState(1)
  const [mergeMainTable, setMergeMainTable] = useState<number | "">("")
  const [mergeSelected, setMergeSelected] = useState<number[]>([])
  const [mergeReason, setMergeReason] = useState("")
  const [mergeSubmitting, setMergeSubmitting] = useState(false)

  const { tables: floorTables, loading: floorLoading, reload: reloadFloor } = useFloorPlanTables(4000)
  const [zoneFilter, setZoneFilter] = useState<string>("ALL")

  const tableNumbers = useMemo(() => {
    if (floorTables.length > 0) {
      return floorTables
        .map((t) => Number(t.table_number))
        .filter((n) => Number.isFinite(n) && n > 0)
        .sort((a, b) => a - b)
    }
    return FALLBACK_TABLE_NUMBERS
  }, [floorTables])

  const floorByNumber = useMemo(() => {
    const m = new Map<number, (typeof floorTables)[number]>()
    for (const t of floorTables) {
      const n = Number(t.table_number)
      if (Number.isFinite(n)) m.set(n, t)
    }
    return m
  }, [floorTables])

  const snapshots = useMemo(
    () =>
      tableNumbers.map((id) => {
        const row = floorByNumber.get(id)
        return computeTableSnapshot(id, orders, alerts, {
          restaurantStatus: row?.restaurant_status,
          paymentStatusCode: row?.payment_status_code,
          cleaningSince: row?.cleaning_since,
        })
      }),
    [tableNumbers, floorByNumber, orders, alerts],
  )

  const visibleSnapshots = useMemo(() => {
    if (zoneFilter === "ALL") return snapshots
    return snapshots.filter((s) => zoneForTable(s.tableId, floorTables) === zoneFilter)
  }, [snapshots, zoneFilter, floorTables])

  const counters = useMemo(() => {
    const c = { libres: 0, actives: 0, aServir: 0, alertes: 0 }
    snapshots.forEach((s) => {
      if (s.status === "FREE") c.libres += 1
      else if (s.status !== "NEEDS_CLEANING") c.actives += 1
      if (s.status === "READY") c.aServir += 1
      if (s.hasCallAlert || s.hasBillAlert || s.hasCashierCall) c.alertes += 1
    })
    return c
  }, [snapshots])

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true)
    try {
      await reloadFloor()
      const res = await fetch("/api/caisse/tables-overview")
      const j = await res.json()
      setOverview(Array.isArray(j.tables) ? j.tables : [])
    } catch {
      toast.error("Impossible de charger les tables")
      setOverview([])
    } finally {
      setOverviewLoading(false)
    }
  }, [reloadFloor])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const occupiedSnapshots = useMemo(
    () => snapshots.filter((s) => s.status !== "FREE"),
    [snapshots],
  )
  const freeSnapshots = useMemo(
    () => snapshots.filter((s) => s.status === "FREE"),
    [snapshots],
  )

  const openTransfer = () => {
    setTransferOpen(true)
    setFromTableNum(occupiedSnapshots[0]?.tableId ?? "")
    setToTableNum(freeSnapshots[0]?.tableId ?? "")
    setTransferReason("")
    void loadOverview()
  }

  const openCallCaisse = () => {
    setCallOpen(true)
    const firstBusy = snapshots.find((s) => s.status !== "FREE" && s.status !== "PAID")
    setCallTableNum(firstBusy?.tableId ?? 1)
    void loadOverview()
  }

  const openSplit = () => {
    const firstBusy =
      snapshots.find((s) => s.activeOrders.length > 0) ?? snapshots.find((s) => s.status !== "FREE" && s.status !== "PAID")
    setSplitDefaultTable(firstBusy?.tableId ?? 1)
    setSplitOpen(true)
  }

  const openMerge = () => {
    const occupied = occupiedSnapshots.map((s) => s.tableId)
    const fallback = snapshots[0]?.tableId
    setMergeMainTable(occupied[0] ?? fallback ?? "")
    setMergeSelected([])
    setMergeReason("")
    setMergeOpen(true)
    void loadOverview()
  }

  const toggleMergeSelected = (tableId: number) => {
    setMergeSelected((prev) =>
      prev.includes(tableId) ? prev.filter((x) => x !== tableId) : [...prev, tableId],
    )
  }

  const submitTransfer = async () => {
    const from = Number(fromTableNum)
    const to = Number(toTableNum)
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) {
      toast.error("Choisissez deux tables différentes.")
      return
    }
    if (freeSnapshots.find((s) => s.tableId === from)) {
      toast.error("La table d'origine doit être occupée.")
      return
    }
    if (occupiedSnapshots.find((s) => s.tableId === to)) {
      toast.error("La table destination doit être libre.")
      return
    }

    setTransferSubmitting(true)
    try {
      const fromRow = overview.find((t) => Number(t.table_number) === from)
      const toRow = overview.find((t) => Number(t.table_number) === to)
      let serverOk = false

      if (fromRow?.session?.id && toRow?.table_id) {
        const res = await fetch("/api/caisse/transfer-table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: fromRow.session.id,
            to_table_id: toRow.table_id,
            reason: transferReason.trim(),
          }),
        })
        const j = await res.json().catch(() => ({}))
        if (res.ok) {
          serverOk = true
          toast.success(`Session déplacée vers la table ${to}`)
        } else if (res.status === 503) {
          toast.message("Supabase indisponible — transfert local effectué.")
        } else {
          toast.error(typeof j.error === "string" ? j.error : "Transfert refusé")
          return
        }
      } else {
        toast.message("Pas de session Supabase pour cette table — transfert local effectué.")
      }

      transferTableNumber(from, to)
      transferTableAlerts(String(from), String(to))

      if (!serverOk) {
        toast.success(`Table ${from} → table ${to}`)
      }

      setTransferOpen(false)
      void loadOverview()
    } finally {
      setTransferSubmitting(false)
    }
  }

  const submitCallCaisse = () => {
    raise({
      tableId: String(callTableNum),
      type: "request_bill",
      message: `Demande d'addition — table ${callTableNum} (envoyée depuis la salle)`,
    })
    toast.success(`Caisse notifiée : table ${callTableNum} demande l'addition`)
    setCallOpen(false)
  }

  const submitMerge = async () => {
    const main = Number(mergeMainTable)
    const others = mergeSelected.filter((n) => n !== main)
    if (!Number.isFinite(main) || others.length === 0) {
      toast.error("Choisissez la table principale et au moins une table à fusionner.")
      return
    }

    const mainSnap = snapshots.find((s) => s.tableId === main)
    const otherSnaps = others
      .map((n) => snapshots.find((s) => s.tableId === n))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))

    const mainOccupied = mainSnap ? mainSnap.status !== "FREE" : false
    const occupiedOthers = otherSnaps.filter((s) => s.status !== "FREE").map((s) => s.tableId)
    const freeOthers = otherSnaps.filter((s) => s.status === "FREE").map((s) => s.tableId)

    let summary = ""
    if (mainOccupied && occupiedOthers.length === others.length) {
      summary = `Fusionner ${others.length === 1 ? `la table ${others[0]}` : `les tables ${others.join(", ")}`} dans la table ${main}`
    } else if (mainOccupied) {
      summary = `Étendre la table ${main} sur ${others.length === 1 ? `la table libre ${others[0]}` : `les tables ${others.join(", ")}`}`
    } else if (occupiedOthers.length > 0) {
      summary = `Déplacer la session de la table ${occupiedOthers[0]} vers la table ${main}${
        others.length > 1 ? ` (+ rattacher ${others.filter((n) => n !== occupiedOthers[0]).join(", ")})` : ""
      }`
    } else {
      summary = `Ouvrir un grand groupe sur la table ${main} + ${freeOthers.join(", ")}`
    }
    if (!window.confirm(`${summary} ?`)) return

    setMergeSubmitting(true)
    try {
      const mainRow = overview.find((t) => Number(t.table_number) === main)
      const mergedRows = others
        .map((n) => overview.find((t) => Number(t.table_number) === n))
        .filter((r): r is OverviewTable => Boolean(r))

      let serverOk = false
      const mainTableDbId = mainRow?.table_id ?? null
      const mergedTableDbIds = mergedRows
        .map((r) => r.table_id)
        .filter((id): id is number => typeof id === "number")

      if (mainTableDbId && mergedTableDbIds.length > 0) {
        const res = await fetch("/api/caisse/merge-tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            main_table_id: mainTableDbId,
            merged_table_ids: mergedTableDbIds,
            reason: mergeReason.trim(),
          }),
        })
        const j = await res.json().catch(() => ({}))
        if (res.ok) {
          serverOk = true
        } else if (res.status === 503) {
          toast.message("Supabase indisponible — fusion locale effectuée.")
        } else {
          toast.error(typeof j.error === "string" ? j.error : "Fusion refusée")
          return
        }
      } else {
        toast.message("Pas de session Supabase liée — fusion locale effectuée.")
      }

      // Fusion locale (toujours effectuée pour le plan de salle / KDS)
      for (const n of others) {
        transferTableNumber(n, main)
        transferTableAlerts(String(n), String(main))
      }

      // Mémorise le groupe pour l'affichage : les tables membres apparaîtront
      // comme un miroir de la principale jusqu'à libération (paiement).
      addGroup(main, others, mergeReason.trim() || null)

      toast.success(`${summary}${serverOk ? " — OK (Supabase + local)" : " — OK (local)"}`)
      setMergeOpen(false)
      void loadOverview()
    } finally {
      setMergeSubmitting(false)
    }
  }

  const releaseTable = useCallback(
    async (tableNumber: number) => {
      const row = floorTables.find((t) => Number(t.table_number) === Number(tableNumber))
      const tableDbId = row?.table_id
      if (tableDbId && isTableNeedsCleaning(row)) {
        const res = await fetch("/api/caisse/mark-table-cleaned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table_id: tableDbId }),
        })
        if (!res.ok) {
          toast.error("Impossible de confirmer le nettoyage")
          return
        }
        toast.success(`Table ${tableNumber} libre`)
        void reloadFloor()
        void loadOverview()
        return
      }

      const removed = clearTableOrders(tableNumber)
      resolveTable(String(tableNumber))
      const dissolved = releaseGroupByTable(tableNumber)
      toast.success(
        `Table ${tableNumber} — alertes effacées${removed > 0 ? ` (${removed} cmd local)` : ""}${
          dissolved > 0 ? " — groupe dissous" : ""
        }`,
      )
      void reloadFloor()
    },
    [clearTableOrders, floorTables, loadOverview, releaseGroupByTable, reloadFloor, resolveTable],
  )

  const toolbar = (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-900/10 bg-white/80 p-3 shadow-sm dark:bg-slate-900/50 sm:flex-row sm:flex-wrap sm:items-center">
      <p className="w-full text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-900/45 sm:mb-0">
        Actions salle
      </p>
      {canOpenCaisse ? (
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/pos">
            <Monitor className="h-4 w-4" />
            Commande manuelle / POS
          </Link>
        </Button>
      ) : null}
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href="/server/walk-in">
          <PackageOpen className="h-4 w-4" />
          Commande sans table
        </Link>
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5" type="button" onClick={openTransfer}>
        <ArrowRightLeft className="h-4 w-4" />
        Transférer table
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5" type="button" onClick={openSplit}>
        <Split className="h-4 w-4" />
        Fractionner l&apos;addition
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5" type="button" onClick={openCallCaisse}>
        <Phone className="h-4 w-4" />
        Appeler caisse
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5" type="button" onClick={openMerge}>
        <Combine className="h-4 w-4" />
        Fusionner tables
      </Button>
      {canOpenCaisse ? (
        <Button asChild size="sm" variant="secondary" className="gap-1.5">
          <Link href="/caisse">Vue caisse</Link>
        </Button>
      ) : null}
    </div>
  )

  const dialogs = (
    <>
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfert de table</DialogTitle>
            <DialogDescription>
              Déplace la session ouverte (commande) vers une table libre. Les rôles serveur et caisse peuvent effectuer
              cette action.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="transfer-from">Table d&apos;origine (occupée)</Label>
              <select
                id="transfer-from"
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                value={fromTableNum === "" ? "" : String(fromTableNum)}
                onChange={(e) => setFromTableNum(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">— Choisir —</option>
                {occupiedSnapshots.length === 0 ? (
                  <option value="" disabled>
                    Aucune table occupée
                  </option>
                ) : (
                  occupiedSnapshots.map((s) => (
                    <option key={s.tableId} value={s.tableId}>
                      Table {s.tableId} · {TABLE_STATUS_META[s.status].short}
                      {s.activeOrders.length ? ` (${s.activeOrders.length} cmd)` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="transfer-to">Table destination (libre)</Label>
              <select
                id="transfer-to"
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                value={toTableNum === "" ? "" : String(toTableNum)}
                onChange={(e) => setToTableNum(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">— Choisir —</option>
                {freeSnapshots.length === 0 ? (
                  <option value="" disabled>
                    Aucune table libre
                  </option>
                ) : (
                  freeSnapshots.map((s) => (
                    <option key={s.tableId} value={s.tableId}>
                      Table {tableCodeFor(s.tableId, floorTables)} · {ZONES[zoneForTable(s.tableId, floorTables)]?.label ?? ""}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="transfer-reason">Motif (optionnel)</Label>
              <Textarea
                id="transfer-reason"
                rows={2}
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Ex. client préfère le fond de salle"
              />
            </div>
            {overviewLoading ? (
              <p className="text-[11px] text-muted-foreground">Synchronisation Supabase…</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => void submitTransfer()}
              disabled={transferSubmitting || fromTableNum === "" || toTableNum === ""}
            >
              {transferSubmitting ? "Transfert…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={callOpen} onOpenChange={setCallOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Appeler la caisse</DialogTitle>
            <DialogDescription>
              Envoie une **demande d&apos;addition** côté caisse (badge ambre + son). Le caissier ouvre ensuite la table
              concernée pour encaisser.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="call-table">Numéro de table</Label>
            <select
              id="call-table"
              className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
              value={callTableNum}
              onChange={(e) => setCallTableNum(Number(e.target.value))}
            >
              {tableNumbers.map((n) => (
                <option key={n} value={n}>
                  Table {tableCodeFor(n, floorTables)}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCallOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={submitCallCaisse}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SplitBillDialog
        open={splitOpen}
        onOpenChange={setSplitOpen}
        orders={orders}
        tableOptions={occupiedSnapshots.map((s) => s.tableId)}
        defaultTable={splitDefaultTable}
      />

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fusionner des tables</DialogTitle>
            <DialogDescription>
              Sélectionnez la table principale et au moins une autre table. Cas pris en charge :
              fusion de tables occupées (les commandes / factures sont déplacées) et regroupement de
              tables libres pour un grand groupe (une nouvelle session est ouverte).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="merge-main">Table principale (destinataire)</Label>
              <select
                id="merge-main"
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                value={mergeMainTable === "" ? "" : String(mergeMainTable)}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : ""
                  setMergeMainTable(val)
                  if (val !== "") setMergeSelected((prev) => prev.filter((x) => x !== val))
                }}
              >
                <option value="">— Choisir —</option>
                {snapshots.map((s) => (
                  <option key={s.tableId} value={s.tableId}>
                    Table {s.tableId} ·{" "}
                    {s.status === "FREE" ? "Libre" : TABLE_STATUS_META[s.status].short}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {Number(mergeMainTable) && snapshots.find((s) => s.tableId === Number(mergeMainTable))?.status === "FREE"
                  ? "Table principale libre : une nouvelle session sera ouverte (grand groupe)."
                  : "Table principale occupée : son ticket reste ouvert."}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label>Tables à fusionner (au moins 1)</Label>
              <div className="max-h-52 overflow-auto rounded-md border bg-background p-2">
                {snapshots.filter((s) => s.tableId !== Number(mergeMainTable)).length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucune autre table disponible.
                  </p>
                ) : (
                  <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {snapshots
                      .filter((s) => s.tableId !== Number(mergeMainTable))
                      .map((s) => {
                        const checked = mergeSelected.includes(s.tableId)
                        const isFree = s.status === "FREE"
                        return (
                          <li key={s.tableId}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs",
                                checked
                                  ? "border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
                                  : isFree
                                    ? "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                                    : "border-input hover:bg-muted/40",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleMergeSelected(s.tableId)}
                                className="h-3.5 w-3.5"
                              />
                              <span>
                                Table {s.tableId}
                                <span className="ml-1 text-[10px] text-muted-foreground">
                                  ·{" "}
                                  {isFree
                                    ? "Libre"
                                    : `${TABLE_STATUS_META[s.status].short}${
                                        s.activeOrders.length ? ` · ${s.activeOrders.length} cmd` : ""
                                      }`}
                                </span>
                              </span>
                            </label>
                          </li>
                        )
                      })}
                  </ul>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Astuce : cochez plusieurs tables libres pour réserver visuellement un grand groupe.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="merge-reason">Motif (optionnel)</Label>
              <Textarea
                id="merge-reason"
                rows={2}
                value={mergeReason}
                onChange={(e) => setMergeReason(e.target.value)}
                placeholder="Ex. clients regroupés sur une grande table"
              />
            </div>
            {overviewLoading ? (
              <p className="text-[11px] text-muted-foreground">Synchronisation Supabase…</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMergeOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => void submitMerge()}
              disabled={mergeSubmitting || mergeMainTable === "" || mergeSelected.length === 0}
            >
              {mergeSubmitting ? "Fusion…" : "Fusionner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  const body = (
    <>
      {toolbar}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Libres" value={counters.libres} tone="green" />
        <SummaryCard label="Actives" value={counters.actives} tone="yellow" />
        <SummaryCard label="À servir" value={counters.aServir} tone="blue" icon={ChefHat} />
        <SummaryCard label="Alertes" value={counters.alertes} tone="red" icon={BellRing} />
      </div>

      {groups.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 p-3 text-xs dark:border-violet-900/40 dark:bg-violet-950/30">
          <div className="mb-2 flex items-center gap-2 font-semibold text-violet-900 dark:text-violet-100">
            <Combine className="h-4 w-4" />
            Groupes fusionnés actifs ({groups.length})
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 text-violet-900 dark:bg-violet-900/30 dark:text-violet-100"
              >
                <span>
                  <span className="font-semibold">Tables {g.members.join(" + ")}</span>
                  <span className="ml-1 text-[10px] text-violet-700 dark:text-violet-300">
                    · principale {g.mainTable}
                  </span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 px-2 text-[11px]"
                  onClick={() => {
                    const ok = window.confirm(
                      `Dissoudre le groupe (tables ${g.members.join(", ")}) ?\n\nLes commandes restent sur la table principale ${g.mainTable}.`,
                    )
                    if (!ok) return
                    releaseGroup(g.id)
                    toast.success(
                      `Groupe dissous — ${g.members.filter((m) => m !== g.mainTable).join(", ")} libre${g.members.length > 2 ? "s" : ""}`,
                    )
                  }}
                  title="Dissoudre le groupe"
                >
                  <Unlink className="h-3 w-3" />
                  Libérer
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          ["FREE", "ORDERING", "IN_KITCHEN", "READY", "SERVED", "PAYMENT_REQUESTED", "CALL_SERVER", "PAID", "NEEDS_CLEANING"] as const
        ).map((s) => {
          const meta = TABLE_STATUS_META[s]
          return (
            <span
              key={s}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                TONE_BADGE[meta.tone],
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {meta.label}
            </span>
          )
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <ZoneTab label="Toutes" active={zoneFilter === "ALL"} onClick={() => setZoneFilter("ALL")} />
        {JANNAT_TABLE_ZONES.map((z) => (
          <ZoneTab
            key={z}
            label={ZONE_LABELS_FR[z] ?? z}
            active={zoneFilter === z}
            onClick={() => setZoneFilter(z)}
          />
        ))}
        {floorLoading ? (
          <span className="ml-auto text-[11px] text-muted-foreground">Sync tables…</span>
        ) : (
          <span className="ml-auto text-[11px] text-muted-foreground">{tableNumbers.length} tables actives</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {visibleSnapshots.map((snap) => {
          const zoneKey = zoneForTable(snap.tableId, floorTables)
          const zone = ZONES[zoneKey] ?? ZONES.terrasse
          const code = tableCodeFor(snap.tableId, floorTables)
          // Si la table fait partie d'un groupe fusionné, on présente le groupe
          // comme une seule unité : la principale détient les commandes ; les
          // membres affichent un miroir et redirigent vers la principale.
          const group = groupOf(snap.tableId)
          const isMain = group ? group.mainTable === snap.tableId : false
          const isMember = Boolean(group) && !isMain
          const mainSnap = isMember
            ? snapshots.find((s) => s.tableId === group?.mainTable) ?? snap
            : snap
          const displaySnap = isMember ? mainSnap : snap
          const meta = TABLE_STATUS_META[displaySnap.status]
          const floorRow = floorTables.find((t) => Number(t.table_number) === snap.tableId)
          const needsCleaning = isTableNeedsCleaning(floorRow) || displaySnap.status === "NEEDS_CLEANING"
          const canRelease = needsCleaning && !isMember
          const targetHref = isMember
            ? `/server/${group?.mainTable ?? snap.tableId}${needsCleaning ? "?view=cleaning" : ""}`
            : resolveServerTableHref(code, displaySnap, floorRow)
          const groupedRing = group
            ? "ring-2 ring-violet-300 dark:ring-violet-700/70 ring-offset-1 ring-offset-white/40 dark:ring-offset-slate-950/40"
            : ""
          return (
            <ServerPlanTableCell
              key={snap.tableId}
              snap={snap}
              displaySnap={displaySnap}
              meta={meta}
              code={code}
              zone={zone}
              floorTables={floorTables}
              group={group}
              isMain={isMain}
              isMember={isMember}
              groupedRing={groupedRing}
              targetHref={targetHref}
              canRelease={canRelease}
              floorRow={floorRow}
              needsCleaning={needsCleaning}
              alerts={alerts.filter((a) => a.tableId === String(snap.tableId) && !a.resolvedAt)}
              staffRole={staffRole}
              onAcknowledge={async (id) => {
                const { ok } = await acknowledge(id)
                if (ok) toast.success("Demande traitée")
                else toast.error("Impossible d'acquitter la demande")
              }}
              onRelease={() => void releaseTable(snap.tableId)}
              onReleaseGroup={() => {
                if (!group) return
                const ok = window.confirm(
                  `Dissoudre le groupe (tables ${group.members.join(", ")}) ?\n\nLes commandes restent sur la table principale ${group.mainTable}. Les autres tables redeviennent indépendantes (libres).`,
                )
                if (!ok) return
                releaseGroup(group.id)
                toast.success(
                  `Groupe dissous — table ${group.mainTable} conserve la commande, ${group.members.filter((m) => m !== group.mainTable).join(", ")} libre${
                    group.members.length > 2 ? "s" : ""
                  }`,
                )
              }}
            />
          )
        })}
      </div>
      {dialogs}
    </>
  )

  if (layout === "workspace") {
    return (
      <div className="mx-auto max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Plan de salle — Service</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Statut en direct, alertes, commandes prêtes — ouvrez une table pour prendre commande.
          </p>
        </div>
        {body}
        <AIAgentBadge context="server" />
      </div>
    )
  }

  return (
    <PageShell className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SiteHeader backHref="/admin" backLabel="Admin" hideMainNav />

      <div className="mx-auto max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Plan de salle — Service</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Statut en direct, alertes QR, commandes prêtes à servir
          </p>
        </div>
        {body}
      </div>
      <AIAgentBadge context="server" />
    </PageShell>
  )
}

function ServerPlanTableCell({
  snap,
  displaySnap,
  meta,
  code,
  zone,
  floorTables,
  group,
  isMain,
  isMember,
  groupedRing,
  targetHref,
  canRelease,
  floorRow,
  needsCleaning,
  alerts,
  staffRole,
  onAcknowledge,
  onRelease,
  onReleaseGroup,
}: {
  snap: TableSnapshot
  displaySnap: TableSnapshot
  meta: (typeof TABLE_STATUS_META)[keyof typeof TABLE_STATUS_META]
  code: string
  zone: { label: string; color: string }
  floorTables: FloorPlanTable[]
  group: { id: string; mainTable: number; members: number[] } | null
  isMain: boolean
  isMember: boolean
  groupedRing: string
  targetHref: string
  canRelease: boolean
  floorRow?: FloorPlanTable
  needsCleaning: boolean
  alerts: TableAlert[]
  staffRole: string | null
  onAcknowledge: (id: string, requestType: ServiceRequestType) => void | Promise<void>
  onRelease: () => void
  onReleaseGroup: () => void
}) {
  const serviceRequests = mapAlertsToServiceRequests(alerts, snap.tableId)
  const { ringClass } = useServiceRequestVisuals(serviceRequests)
  const cleaningRing = needsCleaning ? CLEANING_CARD_RING : null

  return (
    <div className="relative">
      <Link
        href={targetHref}
        className={cn(
          "group relative flex flex-col items-center gap-2 rounded-2xl border p-4 shadow-sm transition",
          "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
          cleaningRing ?? ringClass ?? TONE_CARD[meta.tone],
          groupedRing,
        )}
      >
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{code}</span>
        <span className={cn("text-xs font-medium", zone.color)}>{zone.label}</span>
        {(() => {
          const cap = floorTables.find((t) => Number(t.table_number) === snap.tableId)?.capacity
          return cap ? <span className="text-[10px] text-slate-500">{cap} pers.</span> : null
        })()}
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            TONE_BADGE[meta.tone],
          )}
        >
          {meta.short}
        </span>
        {displaySnap.total > 0 ? (
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            {displaySnap.total.toFixed(2)}€
          </span>
        ) : null}
        {group ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
            title={`Groupe : tables ${group.members.join(", ")}`}
          >
            <Combine className="h-3 w-3" />
            {isMain
              ? `Principale · groupe ${group.members.join("+")}`
              : `Fusionnée → table ${group.mainTable}`}
          </span>
        ) : null}

        {needsCleaning ? (
          <div className="w-full px-1 pt-1" onClick={(e) => e.preventDefault()}>
            <TableCleaningPanel
              tableLabel={code}
              cleaningSince={(floorRow as { cleaning_since?: string | null } | undefined)?.cleaning_since}
              compact
              onMarkCleaned={onRelease}
            />
          </div>
        ) : serviceRequests.length > 0 ? (
          <div className="w-full px-1 pt-1" onClick={(e) => e.preventDefault()}>
            <ServiceRequestBadges
              requests={serviceRequests}
              staffRole={staffRole}
              onAcknowledge={onAcknowledge}
              compact
            />
          </div>
        ) : null}

        <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
          {displaySnap.hasCashierCall ? (
            <span className="rounded-full bg-amber-500 p-1 text-white shadow" title="Appel caisse">
              <Landmark className="h-3 w-3" />
            </span>
          ) : null}
          {displaySnap.activeOrders.some((o) => o.status === "ready") ? (
            <span className="rounded-full bg-blue-500 p-1 text-white shadow" title="Commande prête">
              <Utensils className="h-3 w-3" />
            </span>
          ) : null}
        </div>
      </Link>
      {canRelease ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRelease()
          }}
          className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-1 rounded-md bg-teal-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          title="Confirmer nettoyage"
        >
          <CircleCheck className="h-3 w-3" />
          Table nettoyée
        </button>
      ) : isMain && group ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onReleaseGroup()
          }}
          className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-1 rounded-md bg-violet-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
          title="Dissoudre le groupe (avant paiement)"
        >
          <Unlink className="h-3 w-3" />
          Libérer le groupe
        </button>
      ) : null}
    </div>
  )
}

function ZoneTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-slate-800 bg-slate-800 text-white dark:border-white dark:bg-white dark:text-slate-900"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
      )}
    >
      {label}
    </button>
  )
}

function SummaryCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string
  value: number
  tone: keyof typeof TONE_BADGE
  icon?: ElementType
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm",
        TONE_CARD[tone],
      )}
    >
      {Icon ? (
        <div className={cn("rounded-full p-2", TONE_BADGE[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}
