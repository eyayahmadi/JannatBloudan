"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { onRealtimeRefresh, scopeMatches } from "@/lib/realtime/bus"
import {
  deriveServiceRequestStatus,
  type ServiceRequestStatus,
  type ServiceRequestType,
} from "@/lib/table/service-requests"

export type TableAlertType = "call_server" | "request_bill" | "help" | "payment_done" | "call_cashier"

export type TableAlert = {
  id: string
  tableId: string
  type: TableAlertType
  message: string
  createdAt: string
  resolvedAt?: string
  acknowledgedAt?: string
  acknowledgedBy?: string | null
  orderId?: string | null
  sessionId?: string | null
  requestType?: ServiceRequestType | null
  status?: ServiceRequestStatus
}

const STORAGE_KEY = "jb-table-alerts"
const POLL_INTERVAL_MS = 4_000

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

function mapServer(a: Record<string, unknown>): TableAlert {
  const type = (a.type ?? a.alert_type) as TableAlertType
  const resolvedAt = (a.resolvedAt ?? a.resolved_at) as string | undefined
  const acknowledgedAt = (a.acknowledgedAt ?? a.acknowledged_at) as string | undefined
  return {
    id: String(a.id),
    tableId: String(a.tableId ?? a.table_id),
    type,
    message: String(a.message ?? ""),
    createdAt: String(a.createdAt ?? a.created_at),
    resolvedAt: resolvedAt ?? undefined,
    acknowledgedAt: acknowledgedAt ?? undefined,
    acknowledgedBy: a.acknowledgedBy ?? a.acknowledged_by ? String(a.acknowledgedBy ?? a.acknowledged_by) : null,
    orderId: a.orderId ?? a.order_id ? String(a.orderId ?? a.order_id) : null,
    sessionId: a.sessionId ?? a.session_id ? String(a.sessionId ?? a.session_id) : null,
    requestType: (a.requestType as ServiceRequestType | null) ?? null,
    status: deriveServiceRequestStatus({
      resolved_at: resolvedAt,
      acknowledged_at: acknowledgedAt,
    }),
  }
}

async function fetchRemote(): Promise<TableAlert[] | null> {
  try {
    const res = await fetch("/api/table-alerts", { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    if (data.source === "supabase" && Array.isArray(data.alerts)) {
      return data.alerts.map((a: Record<string, unknown>) => mapServer(a))
    }
    return null
  } catch {
    return null
  }
}

export function useTableAlerts() {
  const [alerts, setAlerts] = useState<TableAlert[]>(load)
  const remoteActiveRef = useRef(false)

  useEffect(() => {
    persist(alerts)
  }, [alerts])

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

  const [remoteSynced, setRemoteSynced] = useState(false)
  const [remoteAuthoritative, setRemoteAuthoritative] = useState(false)

  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      const remote = await fetchRemote()
      if (cancelled) return
      if (remote) {
        remoteActiveRef.current = true
        setAlerts(remote)
        setRemoteAuthoritative(true)
      }
      setRemoteSynced(true)
    }
    sync()
    const timer = setInterval(sync, POLL_INTERVAL_MS)
    const unsub = onRealtimeRefresh((scope) => {
      if (scopeMatches("alerts", scope)) void sync()
    })
    return () => {
      cancelled = true
      clearInterval(timer)
      unsub()
    }
  }, [])

  const raiseAsync = useCallback(
    async (
      input: Omit<TableAlert, "id" | "createdAt" | "resolvedAt" | "acknowledgedAt" | "status"> & {
        orderId?: string | null
        sessionId?: string | null
      },
    ): Promise<{ ok: boolean }> => {
      const optimistic: TableAlert = {
        ...input,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        status: "PENDING",
      }
      setAlerts((prev) => [optimistic, ...prev])

      try {
        const res = await fetch("/api/table-alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableId: Number(input.tableId),
            type: input.type,
            message: input.message,
            orderId: input.orderId ?? null,
            sessionId: input.sessionId ?? null,
          }),
        })
        if (!res.ok) {
          setAlerts((prev) => prev.filter((a) => a.id !== optimistic.id))
          return { ok: false }
        }
        const data = (await res.json()) as { alert?: Record<string, unknown> }
        if (data.alert) {
          const serverAlert = mapServer(data.alert)
          setAlerts((prev) => prev.map((a) => (a.id === optimistic.id ? serverAlert : a)))
        }
        return { ok: true }
      } catch {
        setAlerts((prev) => prev.filter((a) => a.id !== optimistic.id))
        return { ok: false }
      }
    },
    [],
  )

  const raise = useCallback(
    (input: Omit<TableAlert, "id" | "createdAt" | "resolvedAt" | "acknowledgedAt" | "status">) => {
      const optimistic: TableAlert = {
        ...input,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        status: "PENDING",
      }
      setAlerts((prev) => [optimistic, ...prev])

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

  const patchLocalResolved = useCallback((matcher: (a: TableAlert) => boolean) => {
    const now = new Date().toISOString()
    setAlerts((prev) =>
      prev.map((a) =>
        matcher(a) && !a.resolvedAt
          ? { ...a, resolvedAt: now, acknowledgedAt: now, status: "RESOLVED" as const }
          : a,
      ),
    )
  }, [])

  const resolve = useCallback(
    (id: string) => {
      patchLocalResolved((a) => a.id === id)
      void fetch("/api/table-alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "resolve" }),
      }).catch(() => {})
    },
    [patchLocalResolved],
  )

  const acknowledge = useCallback(
    async (id: string): Promise<{ ok: boolean }> => {
      patchLocalResolved((a) => a.id === id)
      try {
        const res = await fetch("/api/table-alerts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action: "acknowledge" }),
        })
        return { ok: res.ok }
      } catch {
        return { ok: false }
      }
    },
    [patchLocalResolved],
  )

  const resolveTable = useCallback(
    (tableId: string, type?: TableAlertType) => {
      patchLocalResolved(
        (a) => a.tableId === String(tableId) && (!type || a.type === type),
      )
      void fetch("/api/table-alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: Number(tableId), type, action: "resolve" }),
      }).catch(() => {})
    },
    [patchLocalResolved],
  )

  const acknowledgeTable = useCallback(
    async (tableId: string, type?: TableAlertType): Promise<{ ok: boolean }> => {
      patchLocalResolved(
        (a) => a.tableId === String(tableId) && (!type || a.type === type),
      )
      try {
        const res = await fetch("/api/table-alerts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableId: Number(tableId), type, action: "acknowledge" }),
        })
        return { ok: res.ok }
      } catch {
        return { ok: false }
      }
    },
    [patchLocalResolved],
  )

  const activeByTable = useCallback(
    (tableId: string) => alerts.filter((a) => a.tableId === String(tableId) && !a.resolvedAt),
    [alerts],
  )

  const transferTableAlerts = useCallback((from: string, to: string) => {
    if (!from || !to || from === to) return
    setAlerts((prev) =>
      prev.map((a) =>
        a.tableId === String(from) && !a.resolvedAt ? { ...a, tableId: String(to) } : a,
      ),
    )
  }, [])

  const active = alerts.filter((a) => !a.resolvedAt)

  return {
    alerts,
    active,
    raise,
    raiseAsync,
    resolve,
    acknowledge,
    resolveTable,
    acknowledgeTable,
    transferTableAlerts,
    activeByTable,
    remoteSynced,
    remoteAuthoritative,
  }
}
