"use client"

import { useCallback, useSyncExternalStore } from "react"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole, type AppRole } from "@/lib/auth/roles"
import {
  notificationsStore,
  type AppNotification,
  type NotificationType,
} from "@/lib/notifications/notifications-store"

export type { AppNotification, NotificationType }

/** Bell only — re-renders when unread count for current role changes. */
export function useNotificationUnreadCount(): number {
  const { user } = useAuth()
  const role: AppRole = user ? normalizeRole(user.role) : "CLIENT"
  const isAdmin = role === "ADMIN"

  return useSyncExternalStore(
    notificationsStore.subscribe,
    () => notificationsStore.getUnreadCount(role, isAdmin),
    () => 0,
  )
}

/** Singleton notification store — shared by bell, workflow, KDS, POS. */
export function useNotifications() {
  const { user } = useAuth()
  const role: AppRole = user ? normalizeRole(user.role) : "CLIENT"
  const isAdmin = role === "ADMIN"

  const revision = useSyncExternalStore(
    notificationsStore.subscribe,
    notificationsStore.getRevision,
    () => 0,
  )

  void revision

  const notifications = notificationsStore.getForRole(role, isAdmin)
  const unreadCount = notificationsStore.getUnreadCount(role, isAdmin)

  const add = useCallback(
    (n: Omit<AppNotification, "id" | "timestamp" | "read">) => notificationsStore.add(n),
    [],
  )

  const markRead = useCallback((id: string) => notificationsStore.markRead(id), [])

  const markAllRead = useCallback(
    () => notificationsStore.markAllRead(role, isAdmin),
    [role, isAdmin],
  )

  const dismiss = useCallback((id: string) => notificationsStore.dismiss(id), [])

  return {
    notifications,
    add,
    markRead,
    markAllRead,
    dismiss,
    unreadCount,
    isAdminAudience: isAdmin,
  }
}
