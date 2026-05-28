"use client"

import { useCallback, useEffect, useRef } from "react"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole } from "@/lib/auth/roles"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { cashierAudience } from "@/lib/notifications/audience"

type ClientRow = {
  client_id: string
  client_name?: string | null
  client_email?: string | null
  overdue_invoices: number
  total_remaining: number
  earliest_overdue_at?: string | null
}

/**
 * Surveille les factures crédit en retard et pousse une notification
 * (visible côté CASHIER + ADMIN) quand un nouveau client devient overdue.
 *
 * Déduplication locale via un Set de `client_id + day` pour ne pas spammer.
 * À appeler une seule fois dans un layout caisse / admin.
 */
export function useCreditNotifications(options: { intervalMs?: number } = {}) {
  const intervalMs = options.intervalMs ?? 5 * 60 * 1000
  const { user } = useAuth()
  const { add } = useNotifications()
  const role = user ? normalizeRole(user.role) : "CLIENT"
  const seenRef = useRef<Set<string>>(new Set())

  const tick = useCallback(async () => {
    if (role !== "ADMIN" && role !== "CASHIER") return
    try {
      const res = await fetch("/api/caisse/credit/clients?overdue=1&limit=20")
      if (!res.ok) return
      const json = (await res.json()) as { clients?: ClientRow[] }
      const day = new Date().toISOString().slice(0, 10)

      for (const row of json.clients ?? []) {
        if (!row.overdue_invoices || row.overdue_invoices <= 0) continue
        const key = `${row.client_id}::${day}`
        if (seenRef.current.has(key)) continue
        seenRef.current.add(key)

        const name = row.client_name ?? row.client_email ?? "Client"
        const amount = Number(row.total_remaining ?? 0).toFixed(2)
        add({
          type: "info",
          title: "Crédit client en retard",
          message: `${name} : ${amount} € dû — ${row.overdue_invoices} facture(s) en retard.`,
          audience: cashierAudience(),
        })
      }
    } catch {
      /* noop */
    }
  }, [role, add])

  useEffect(() => {
    void tick()
    const id = window.setInterval(() => void tick(), intervalMs)
    return () => window.clearInterval(id)
  }, [tick, intervalMs])
}
