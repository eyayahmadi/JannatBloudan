/**
 * Hook partagé — charge le plan des tables depuis l'API caisse (66 tables Jannat).
 */
"use client"

import { useCallback, useEffect, useState } from "react"
import { onRealtimeRefresh, scopeMatches } from "@/lib/realtime/bus"
import {
  mapOverviewToUnifiedStatus,
  UNIFIED_TABLE_STATUS_META,
  type UnifiedTableStatus,
} from "@/lib/table-status/unified"

export type FloorPlanTable = {
  table_id?: number
  table_number?: number
  table_code?: string | null
  display_name?: string | null
  zone?: string
  plan_zone?: string | null
  capacity?: number
  is_active?: boolean
  restaurant_status?: string | null
  payment_status_code?: string
  payment_status_label?: string
  unified_status?: UnifiedTableStatus
  unified_status_label?: string
  session?: {
    id?: string
    total?: number
    paid_amount?: number
    remaining_amount?: number
    opened_at?: string | null
  } | null
}

export { UNIFIED_TABLE_STATUS_META, mapOverviewToUnifiedStatus }

export function useFloorPlanTables(pollMs = 4000) {
  const [tables, setTables] = useState<FloorPlanTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/caisse/tables-overview", { cache: "no-store" })
      const j = await res.json()
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Erreur chargement tables")
        return
      }
      const rows = Array.isArray(j.tables) ? j.tables : []
      const enriched = rows
        .filter((t: FloorPlanTable) => t.is_active !== false)
        .map((t: FloorPlanTable) => {
          const unified_status = mapOverviewToUnifiedStatus(t)
          return {
            ...t,
            unified_status,
            unified_status_label: UNIFIED_TABLE_STATUS_META[unified_status].label,
          }
        })
      setTables(enriched)
      setError(null)
    } catch {
      setError("Réseau indisponible")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    const id = window.setInterval(() => void reload(), pollMs)
    const unsub = onRealtimeRefresh((scope) => {
      if (scopeMatches("tables", scope)) void reload()
    })
    return () => {
      window.clearInterval(id)
      unsub()
    }
  }, [reload, pollMs])

  return { tables, loading, error, reload }
}
