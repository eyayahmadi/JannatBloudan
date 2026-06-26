"use client"

/**
 * useStationAvailability — état OPEN/BUSY/PAUSED/CLOSING_SOON/CLOSED par station.
 *
 * - En production (Supabase configuré) : lit / écrit via /api/stations/availability.
 * - En mode démo / hors-ligne : stocke dans localStorage pour rester fluide.
 * - Synchronisation multi-onglets via l'événement `storage`.
 * - Les hooks polling automatiquement toutes les 30s.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { onRealtimeRefresh, scopeMatches } from "@/lib/realtime/bus"
import {
  AVAILABILITY_META,
  defaultStationAvailability,
  isValidAvailabilityStatus,
  type StationAvailability,
  type StationAvailabilityStatus,
} from "@/lib/stations/availability"
import { STATIONS, type Station } from "@/lib/stations/config"

const STORAGE_KEY = "jb-station-availability"
const POLL_MS = 30_000

type EnrichedAvailability = StationAvailability & {
  accepting_orders: boolean
  hide_in_menu: boolean
}

function enrich(a: StationAvailability): EnrichedAvailability {
  const meta = AVAILABILITY_META[a.status]
  return { ...a, accepting_orders: meta.acceptingOrders, hide_in_menu: meta.hideInMenu }
}

function defaultMap(): Record<Station, EnrichedAvailability> {
  return {
    KITCHEN: enrich(defaultStationAvailability("KITCHEN")),
    BAR: enrich(defaultStationAvailability("BAR")),
    SHISHA: enrich(defaultStationAvailability("SHISHA")),
  }
}

function loadLocal(): Record<Station, EnrichedAvailability> {
  if (typeof window === "undefined") return defaultMap()
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
    if (!raw || typeof raw !== "object") return defaultMap()
    const map = defaultMap()
    for (const station of STATIONS) {
      const entry = (raw as Record<string, unknown>)[station] as
        | Partial<StationAvailability>
        | undefined
      if (entry && isValidAvailabilityStatus(entry.status)) {
        map[station] = enrich({
          station,
          status: entry.status,
          reason: entry.reason ?? null,
          estimated_wait_minutes: entry.estimated_wait_minutes ?? null,
          closes_at: entry.closes_at ?? null,
          updated_at: entry.updated_at ?? new Date().toISOString(),
        })
      }
    }
    return map
  } catch {
    return defaultMap()
  }
}

function persistLocal(map: Record<Station, EnrichedAvailability>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

export type UseStationAvailabilityResult = {
  /** Map indexée par station. Toujours présente (fallback OPEN). */
  availability: Record<Station, EnrichedAvailability>
  /** Helper pratique pour obtenir l'état d'une station. */
  get: (station: Station) => EnrichedAvailability
  /** Faut-il bloquer/avertir le client pour cette station ? */
  isAcceptingOrders: (station: Station) => boolean
  shouldHideInMenu: (station: Station) => boolean
  /** Met à jour le statut. Appelle l'API si possible, fallback localStorage sinon. */
  setStatus: (
    station: Station,
    payload: {
      status: StationAvailabilityStatus
      reason?: string | null
      estimated_wait_minutes?: number | null
      closes_at?: string | null
    },
  ) => Promise<EnrichedAvailability>
  refresh: () => Promise<void>
  loading: boolean
  error: string | null
  source: "supabase" | "default" | "local"
}

export function useStationAvailability(): UseStationAvailabilityResult {
  const [availability, setAvailability] = useState<Record<Station, EnrichedAvailability>>(loadLocal)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"supabase" | "default" | "local">("local")
  const aliveRef = useRef(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stations/availability", { cache: "no-store" })
      if (!res.ok) {
        setError(`HTTP ${res.status}`)
        return
      }
      const json = (await res.json()) as {
        stations?: Array<EnrichedAvailability>
        source?: "supabase" | "default"
        warning?: string
      }
      if (!aliveRef.current) return
      if (!Array.isArray(json.stations)) {
        setError(json.warning ?? "Réponse invalide")
        return
      }
      const next = defaultMap()
      for (const row of json.stations) {
        if (STATIONS.includes(row.station as Station) && isValidAvailabilityStatus(row.status)) {
          next[row.station as Station] = enrich({
            station: row.station as Station,
            status: row.status,
            reason: row.reason ?? null,
            estimated_wait_minutes: row.estimated_wait_minutes ?? null,
            closes_at: row.closes_at ?? null,
            updated_at: row.updated_at,
            updated_by: row.updated_by ?? null,
          })
        }
      }
      setAvailability(next)
      persistLocal(next)
      setSource(json.source ?? "default")
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau")
    } finally {
      if (aliveRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    aliveRef.current = true
    void refresh()
    const iv = setInterval(refresh, POLL_MS)
    const unsub = onRealtimeRefresh((scope) => {
      if (scopeMatches(["stations", "menu"], scope)) void refresh()
    })
    return () => {
      aliveRef.current = false
      clearInterval(iv)
      unsub()
    }
  }, [refresh])

  // Sync multi-onglets quand on tombe en mode local
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const raw = JSON.parse(e.newValue) as Record<string, EnrichedAvailability>
          setAvailability((prev) => ({ ...prev, ...raw }))
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const setStatus = useCallback(
    async (
      station: Station,
      payload: {
        status: StationAvailabilityStatus
        reason?: string | null
        estimated_wait_minutes?: number | null
        closes_at?: string | null
      },
    ): Promise<EnrichedAvailability> => {
      const optimistic = enrich({
        station,
        status: payload.status,
        reason: payload.reason ?? null,
        estimated_wait_minutes: payload.estimated_wait_minutes ?? null,
        closes_at: payload.closes_at ?? null,
        updated_at: new Date().toISOString(),
      })
      setAvailability((prev) => {
        const next = { ...prev, [station]: optimistic }
        persistLocal(next)
        return next
      })
      try {
        const res = await fetch(`/api/stations/availability/${station}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }
        const json = (await res.json()) as { availability: EnrichedAvailability }
        if (json.availability) {
          setAvailability((prev) => {
            const next = { ...prev, [station]: enrich(json.availability) }
            persistLocal(next)
            return next
          })
          setSource("supabase")
          return json.availability
        }
        return optimistic
      } catch (err) {
        setSource("local")
        setError(err instanceof Error ? err.message : "Erreur réseau")
        return optimistic
      }
    },
    [],
  )

  const get = useCallback(
    (station: Station) => availability[station] ?? enrich(defaultStationAvailability(station)),
    [availability],
  )

  const isAcceptingOrders = useCallback(
    (station: Station) => get(station).accepting_orders,
    [get],
  )
  const shouldHideInMenu = useCallback(
    (station: Station) => get(station).hide_in_menu,
    [get],
  )

  return useMemo(
    () => ({
      availability,
      get,
      isAcceptingOrders,
      shouldHideInMenu,
      setStatus,
      refresh,
      loading,
      error,
      source,
    }),
    [availability, get, isAcceptingOrders, shouldHideInMenu, setStatus, refresh, loading, error, source],
  )
}
