"use client"

import { useCallback, useEffect, useState } from "react"
import { onRealtimeRefresh, scopeMatches } from "@/lib/realtime/bus"
import {
  buildDeliveryCategories,
  mapApiToDeliveryMenuItem,
  type DeliveryMenuItem,
} from "@/lib/menu/delivery-menu-item"

export function useDeliveryMenu(pollMs = 20_000) {
  const [items, setItems] = useState<DeliveryMenuItem[]>([])
  const [categories, setCategories] = useState(buildDeliveryCategories([]))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/menu?include_unavailable=1&locale=fr", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Erreur menu")
        return
      }
      setCategories(buildDeliveryCategories(json.categories ?? []))
      setItems((json.items ?? []).map((p: Record<string, unknown>) => mapApiToDeliveryMenuItem(p)))
      setError(null)
    } catch {
      setError("Réseau indisponible")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), pollMs)
    const unsub = onRealtimeRefresh((scope) => {
      if (scopeMatches("menu", scope)) void load()
    })
    return () => {
      window.clearInterval(id)
      unsub()
    }
  }, [load, pollMs])

  return { items, categories, loading, error, reload: load }
}
