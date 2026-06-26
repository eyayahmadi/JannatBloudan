"use client"

import { useEffect, useRef } from "react"
import type { AppRole } from "@/lib/auth/roles"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { useRealtimeOrders, type KitchenOrder } from "@/lib/hooks/useRealtimeOrders"
import { useTableAlerts } from "@/lib/hooks/useTableAlerts"
import {
  audienceForStationsFromItems,
  cashierAudience,
  serverAudience,
} from "@/lib/notifications/audience"
import { isLikelyOrderUuid } from "@/lib/orders/guest-tracking"
import { onRealtimeRefresh, scopeMatches } from "@/lib/realtime/bus"
import { STATION_META, type Station } from "@/lib/stations/config"

function isStaffRoute(): boolean {
  if (typeof window === "undefined") return false
  return /^\/(kitchen|bar|shisha|server|pos|caisse|admin)(\/|$)/.test(window.location.pathname)
}

/** Émet des notifications métier quand commandes / alertes / items prêts changent. */
export function useWorkflowNotifications(enabled = true) {
  const { add } = useNotifications()
  const { orders } = useRealtimeOrders()
  const { active: activeAlerts } = useTableAlerts()
  const knownOrders = useRef<Set<string>>(new Set())
  const knownReady = useRef<Set<string>>(new Set())
  const knownAlerts = useRef<Set<string>>(new Set())
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (!enabled || !isStaffRoute()) return

    const processOrders = (list: KitchenOrder[]) => {
      for (const o of list) {
        if (!isLikelyOrderUuid(o.id)) continue

        if (!knownOrders.current.has(o.id)) {
          knownOrders.current.add(o.id)
          if (bootstrapped.current) {
            const tableLabel =
              o.table_number != null ? `Table ${o.table_number}` : o.customer_name ?? "Sans table"
            add({
              type: "new_order",
              title: "Nouvelle commande",
              message: `${o.order_number} — ${tableLabel}`,
              audience: [
                ...new Set<AppRole>([
                  ...audienceForStationsFromItems(o.items),
                  "SERVER",
                  "CASHIER",
                ]),
              ],
            })
          }
        }

        for (const it of o.items) {
          const key = `${o.id}:${it.id}`
          if (it.item_status === "ready" && !knownReady.current.has(key)) {
            knownReady.current.add(key)
            if (bootstrapped.current) {
              const station = it.station as Station
              const label = STATION_META[station]?.emoji ?? station
              add({
                type: "order_ready",
                title: `${label} Prêt`,
                message: `${it.quantity}× ${it.name} (${o.order_number})`,
                audience: [
                  ...new Set<AppRole>([
                    ...serverAudience(),
                    station === "KITCHEN" ? "KITCHEN" : station === "BAR" ? "BAR" : "SHISHA",
                  ]),
                ],
              })
            }
          }
        }
      }
      bootstrapped.current = true
    }

    processOrders(orders)
  }, [orders, add, enabled])

  useEffect(() => {
    if (!enabled || !isStaffRoute()) return

    for (const a of activeAlerts) {
      if (knownAlerts.current.has(a.id)) continue
      knownAlerts.current.add(a.id)

      if (!bootstrapped.current) continue

      if (a.type === "request_bill") {
        add({
          type: "payment_received",
          title: "Addition demandée",
          message: `Table ${a.tableId} — ${a.message || "Le client demande l'addition"}`,
          audience: cashierAudience(),
        })
      } else if (a.type === "call_server") {
        add({
          type: "info",
          title: "Appel serveur",
          message: `Table ${a.tableId}`,
          audience: serverAudience(),
        })
      } else if (a.type === "call_cashier") {
        add({
          type: "info",
          title: "Appel caisse",
          message: `Table ${a.tableId}`,
          audience: cashierAudience(),
        })
      } else if (a.type === "payment_done") {
        add({
          type: "payment_received",
          title: "Paiement effectué",
          message: `Table ${a.tableId}`,
          audience: [...new Set([...serverAudience(), ...cashierAudience()])],
        })
      }
    }
  }, [activeAlerts, add, enabled])

  useEffect(() => {
    if (!enabled) return
    return onRealtimeRefresh((scope) => {
      if (scopeMatches(["orders", "tables", "alerts"], scope)) {
        /* les hooks métier rechargent via le bus */
      }
    })
  }, [enabled])
}
