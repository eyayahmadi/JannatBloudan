/**
 * Hook partagé — charge le plan des tables depuis l'API caisse (64 tables Jannat).
 */
"use client"

import { useCallback, useEffect, useState } from "react"

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
  session?: {
    id?: string
    total?: number
    paid_amount?: number
    remaining_amount?: number
    opened_at?: string | null
  } | null
}

export function useFloorPlanTables(pollMs = 8000) {
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
      setTables(rows.filter((t: FloorPlanTable) => t.is_active !== false))
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
    return () => window.clearInterval(id)
  }, [reload, pollMs])

  return { tables, loading, error, reload }
}
