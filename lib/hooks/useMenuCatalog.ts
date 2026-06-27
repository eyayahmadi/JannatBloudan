"use client"

import { useCallback, useEffect, useState } from "react"
import { onRealtimeRefresh, scopeMatches } from "@/lib/realtime/bus"
import { logMenuTelemetry } from "@/lib/menu/menu-telemetry"
import type { DigitalMenuProduct } from "@/lib/menu/digital-menu-product"
import type { StationAvailability } from "@/lib/stations/availability"

export type MenuCatalogData = {
  catalog: DigitalMenuProduct[]
  categories: Array<{ id: string; name: string; slug: string; section?: string; display_order?: number; icon_emoji?: string | null }>
  station_availability: StationAvailability[]
  often_ordered_with: Record<string, string[]>
}

type UseMenuCatalogOptions = {
  /** Inclure produits non commandables (sold out, station fermée) */
  includeUnavailable?: boolean
  locale?: string
  pollMs?: number
}

export function useMenuCatalog(options: UseMenuCatalogOptions = {}) {
  const { includeUnavailable = true, locale = "de", pollMs = 20_000 } = options
  const [data, setData] = useState<MenuCatalogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    if (!silent) setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (includeUnavailable) qs.set("include_unavailable", "1")
      qs.set("locale", locale)
      const res = await fetch(`/api/menu?${qs.toString()}`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Erreur menu")
        logMenuTelemetry("menu_fetch_failed", { status: res.status, silent: options?.silent === true })
        return
      }
      setData((prev) => ({
        catalog: (json.items ?? []) as DigitalMenuProduct[],
        categories: json.categories ?? [],
        station_availability: json.station_availability ?? [],
        often_ordered_with: json.often_ordered_with ?? {},
      }))
      setError(null)
    } catch {
      setError("Réseau indisponible")
      logMenuTelemetry("menu_poll_failed", { silent: options?.silent === true })
    } finally {
      if (!silent) setLoading(false)
    }
  }, [includeUnavailable, locale])

  useEffect(() => {
    void load()
    if (pollMs <= 0) return
    const id = window.setInterval(() => void load({ silent: true }), pollMs)
    const unsub = onRealtimeRefresh((scope) => {
      if (scopeMatches("menu", scope)) void load({ silent: true })
    })
    return () => {
      window.clearInterval(id)
      unsub()
    }
  }, [load, pollMs])

  return { data, catalog: data?.catalog ?? [], loading, error, reload: load }
}
