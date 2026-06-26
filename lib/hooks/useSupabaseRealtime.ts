"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { hasBrowserSupabaseEnv } from "@/lib/supabase/config"
import {
  dispatchRealtimeRefresh,
  setRealtimeStatus,
  type RealtimeScope,
} from "@/lib/realtime/bus"

type WatchedTable = {
  table: string
  scope: RealtimeScope
}

const WATCHED: WatchedTable[] = [
  { table: "orders", scope: "orders" },
  { table: "order_items", scope: "orders" },
  { table: "restaurant_tables", scope: "tables" },
  { table: "table_sessions", scope: "tables" },
  { table: "station_availability", scope: "stations" },
  { table: "table_alerts", scope: "alerts" },
]

/** Abonnements postgres_changes — déclenche un refresh immédiat des hooks métier. */
export function useSupabaseRealtime(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    if (!hasBrowserSupabaseEnv()) {
      setRealtimeStatus("polling")
      return
    }

    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      setRealtimeStatus("polling")
      return
    }

    setRealtimeStatus("connecting")

    const channels = WATCHED.map(({ table, scope }) =>
      supabase
        .channel(`jb-rt:${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            dispatchRealtimeRefresh(scope)
            if (scope === "stations") dispatchRealtimeRefresh("menu")
            if (scope === "orders") dispatchRealtimeRefresh("tables")
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setRealtimeStatus("live")
          else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setRealtimeStatus("polling")
          }
        }),
    )

    return () => {
      for (const ch of channels) {
        void supabase.removeChannel(ch)
      }
    }
  }, [enabled])
}
