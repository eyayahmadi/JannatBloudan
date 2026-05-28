"use client"

import { useEffect, useMemo, useState } from "react"

type Resolved = {
  table_number: number
  display_name?: string | null
  is_active: boolean
}

/**
 * Résout le numéro de table métier (filtrage commandes / alertes) depuis /table/{ref}.
 */
export function useResolvedRestaurantTable(rawRef: string | undefined) {
  const [resolved, setResolved] = useState<Resolved | null>(null)

  useEffect(() => {
    const ref = String(rawRef ?? "").trim()
    if (!ref) {
      setResolved(null)
      return
    }
    if (/^\d+$/.test(ref)) {
      setResolved({ table_number: Number(ref), is_active: true })
      return
    }
    let cancelled = false
    fetch(`/api/public/table-resolve?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j?.table) return
        const t = j.table as { table_number?: number; display_name?: string | null; is_active?: boolean | null }
        setResolved({
          table_number: Number(t.table_number),
          display_name: t.display_name,
          is_active: t.is_active !== false,
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [rawRef])

  const effectiveNumber = useMemo(() => {
    if (resolved?.table_number != null && Number.isFinite(resolved.table_number)) return resolved.table_number
    const ref = String(rawRef ?? "")
    if (/^\d+$/.test(ref)) return Number(ref)
    return null
  }, [resolved, rawRef])

  const displayLabel = resolved?.display_name?.trim() || String(rawRef ?? "")

  return { resolved, effectiveNumber, displayLabel }
}
