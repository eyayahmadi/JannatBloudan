"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type TableAlertType = "call_server" | "request_bill" | "help" | "payment_done" | "call_cashier"

export type TableAlert = {
  id: string
  tableId: string
  type: TableAlertType
  message: string
  createdAt: string
  resolvedAt?: string
}

const STORAGE_KEY = "jb-table-alerts"
const POLL_INTERVAL_MS = 10_000

function load(): TableAlert[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function persist(items: TableAlert[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 200)))
}

function mapServer(a: any): TableAlert {
  return {
    id: String(a.id),
    tableId: String(a.tableId ?? a.table_id),
    type: a.type ?? a.alert_type,
    message: a.message ?? "",
    createdAt: a.createdAt ?? a.created_at,
    resolvedAt: a.resolvedAt ?? a.resolved_at ?? undefined,
  }
}

async function fetchRemote(): Promise<TableAlert[] | null> {
  try {
    const res = await fetch("/api/table-alerts", { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    if (data.source === "supabase" && Array.isArray(data.alerts)) {
      return data.alerts.map(mapServer)
    }
    return null
  } catch {
    return null
  }
}

export function useTableAlerts() {
  const [alerts, setAlerts] = useState<TableAlert[]>(load)
  const remoteActiveRef = useRef(false)

  // Persistance locale (cache hors ligne + fallback)
  useEffect(() => {
    persist(alerts)
  }, [alerts])

  // Sync cross-tab via storage event
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setAlerts(JSON.parse(e.newValue))
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  // Polling Supabase (multi-appareil)
  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      const remote = await fetchRemote()
      if (cancelled) return
      if (remote) {
        remoteActiveRef.current = true
        setAlerts(remote)
      }
    }
    sync()
    const timer = setInterval(sync, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const raise = useCallback(
    (input: Omit<TableAlert, "id" | "createdAt" | "resolvedAt">) => {
      const optimistic: TableAlert = {
        ...input,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      }
      setAlerts((prev) => [optimistic, ...prev])

      // Fire-and-forget vers API (reconcilie au prochain poll)
      void fetch("/api/table-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: Number(input.tableId),
          type: input.type,
          message: input.message,
        }),
      }).catch(() => {})

      return optimistic
    },
    [],
  )

  const resolve = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolvedAt: new Date().toISOString() } : a)),
    )
    void fetch("/api/table-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }, [])

  const resolveTable = useCallback((tableId: string, type?: TableAlertType) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.tableId === String(tableId) && !a.resolvedAt && (!type || a.type === type)
          ? { ...a, resolvedAt: new Date().toISOString() }
          : a,
      ),
    )
    void fetch("/api/table-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId: Number(tableId), type }),
    }).catch(() => {})
  }, [])

  const activeByTable = useCallback(
    (tableId: string) => alerts.filter((a) => a.tableId === String(tableId) && !a.resolvedAt),
    [alerts],
  )

  /**
   * Réaffecte toutes les alertes ouvertes d'une table à une autre.
   * Mise à jour locale uniquement (les alertes Supabase passent par /api/table-alerts).
   */
  const transferTableAlerts = useCallback((from: string, to: string) => {
    if (!from || !to || from === to) return
    setAlerts((prev) =>
      prev.map((a) =>
        a.tableId === String(from) && !a.resolvedAt ? { ...a, tableId: String(to) } : a,
      ),
    )
  }, [])

  const active = alerts.filter((a) => !a.resolvedAt)

  return { alerts, active, raise, resolve, resolveTable, transferTableAlerts, activeByTable }
}
