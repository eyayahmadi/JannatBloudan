"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole, type AppRole } from "@/lib/auth/roles"

export type NotificationType =
  | "new_order"
  | "order_ready"
  | "low_stock"
  | "reservation_reminder"
  | "payment_received"
  | "info"

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  /**
   * Liste des rôles destinataires. Si vide / non défini, le défaut dépend du `type`.
   * L'ADMIN voit toujours tout, peu importe l'audience.
   */
  audience?: AppRole[]
}

const STORAGE_KEY = "jb-notifications"

/**
 * Audiences par défaut quand `audience` n'est pas fourni à `add()`.
 *
 * RÈGLE GLOBALE — chaque rôle ne voit que SES notifications, sauf l'ADMIN
 * qui voit toujours tout (filtre court-circuité dans le hook). Les valeurs
 * ci-dessous sont délibérément CONSERVATRICES : si on émet une notification
 * sans `audience`, par défaut seul l'admin la voit. Les sites qui veulent
 * cibler une station / le serveur / le livreur doivent passer leur propre
 * `audience` (utiliser les helpers de `lib/notifications/audience`).
 */
const DEFAULT_AUDIENCE: Record<NotificationType, AppRole[]> = {
  new_order: ["ADMIN"],
  order_ready: ["ADMIN", "SERVER"],
  low_stock: ["ADMIN"],
  reservation_reminder: ["ADMIN", "SERVER"],
  payment_received: ["ADMIN", "CASHIER"],
  info: ["ADMIN"],
}

function load(): AppNotification[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as AppNotification[]
  } catch {
    return []
  }
}

function persist(items: AppNotification[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 80)))
}

export function useNotifications() {
  const { user } = useAuth()
  const role: AppRole = user ? normalizeRole(user.role) : "CLIENT"
  const isAdmin = role === "ADMIN"

  const [allNotifications, setAllNotifications] = useState<AppNotification[]>(load)

  useEffect(() => {
    persist(allNotifications)
  }, [allNotifications])

  // Synchronisation multi-onglets
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        setAllNotifications(JSON.parse(e.newValue))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  /**
   * `notifications` ne contient que ce que l'utilisateur courant doit voir.
   * Admin = tout. Autres rôles = uniquement les notifications dont l'audience
   * inclut explicitement leur rôle.
   */
  const notifications = useMemo(() => {
    if (isAdmin) return allNotifications
    return allNotifications.filter((n) => {
      const audience = n.audience && n.audience.length > 0
        ? n.audience
        : DEFAULT_AUDIENCE[n.type] ?? ["ADMIN"]
      return audience.includes(role)
    })
  }, [allNotifications, isAdmin, role])

  const add = useCallback(
    (n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
      const item: AppNotification = {
        ...n,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        read: false,
      }
      setAllNotifications((prev) => [item, ...prev])
      return item
    },
    [],
  )

  const markRead = useCallback((id: string) => {
    setAllNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }, [])

  /**
   * « Tout marquer lu » s'applique uniquement à la vue courante (pas aux
   * notifications des autres rôles, qui ne nous concernent pas).
   */
  const markAllRead = useCallback(() => {
    setAllNotifications((prev) => {
      if (isAdmin) return prev.map((n) => ({ ...n, read: true }))
      return prev.map((n) => {
        const audience = n.audience && n.audience.length > 0
          ? n.audience
          : DEFAULT_AUDIENCE[n.type] ?? ["ADMIN"]
        return audience.includes(role) ? { ...n, read: true } : n
      })
    })
  }, [isAdmin, role])

  const dismiss = useCallback((id: string) => {
    setAllNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    add,
    markRead,
    markAllRead,
    dismiss,
    unreadCount,
    /** Vrai si l'utilisateur courant voit le flux complet (mode admin). */
    isAdminAudience: isAdmin,
  }
}
