"use client"

import { useCallback, useEffect, useRef } from "react"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole } from "@/lib/auth/roles"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { cashierAudience } from "@/lib/notifications/audience"
import type { PurchaseUrgency } from "@/lib/purchases/types"

type Digest = {
  digest_key: string
  urgency: PurchaseUrgency
  count: number
  seen: boolean
}

/**
 * Hook : interroge `/api/admin/purchases/notifications` à intervalles réguliers
 * et publie les digests non vus dans `useNotifications`. La table SQL
 * `purchase_notification_seen` agit comme déduplication par jour + rôle, ce
 * qui empêche le spam même en cas de rafraîchissement répété de la page.
 *
 * À appeler une seule fois en haut d'un layout (ADMIN / CASHIER).
 */
export function usePurchaseNotifications(options: { intervalMs?: number } = {}) {
  const intervalMs = options.intervalMs ?? 5 * 60 * 1000 // 5 minutes
  const { user } = useAuth()
  const { add } = useNotifications()
  const role = user ? normalizeRole(user.role) : "CLIENT"
  const lastDigestsRef = useRef<Set<string>>(new Set())

  const tick = useCallback(async () => {
    if (role !== "ADMIN" && role !== "CASHIER") return
    try {
      const res = await fetch("/api/admin/purchases/notifications")
      if (!res.ok) return
      const json = (await res.json()) as { digests?: Digest[] }
      const digests = json.digests ?? []

      const newKeys: string[] = []
      for (const d of digests) {
        if (d.seen) continue
        if (lastDigestsRef.current.has(d.digest_key)) continue
        lastDigestsRef.current.add(d.digest_key)
        newKeys.push(d.digest_key)

        const title =
          d.urgency === "CRITICAL" ? "Stock critique" : "Achats à prévoir"

        add({
          type: "low_stock",
          title,
          message: `[${d.urgency}] ${d.count} produit(s) à racheter — voir « Achats à prévoir ».`,
          audience: cashierAudience(),
        })
      }

      if (newKeys.length > 0) {
        // Marque ces digests comme « vus » côté serveur pour éviter une
        // ré-émission à la prochaine itération / au prochain rechargement.
        await fetch("/api/admin/purchases/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ digest_keys: newKeys }),
        }).catch(() => undefined)
      }
    } catch {
      /* network noop */
    }
  }, [role, add])

  useEffect(() => {
    void tick()
    const id = window.setInterval(() => void tick(), intervalMs)
    return () => window.clearInterval(id)
  }, [tick, intervalMs])
}
