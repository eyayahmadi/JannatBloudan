"use client"

import { useCallback, useEffect, useState } from "react"

export type NotificationType = "new_order" | "order_ready" | "low_stock" | "reservation_reminder" | "payment_received" | "info"

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
}

const STORAGE_KEY = "jb-notifications"

function load(): AppNotification[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function persist(items: AppNotification[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)))
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(load)

  useEffect(() => {
    persist(notifications)
  }, [notifications])

  const add = useCallback((n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    const item: AppNotification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setNotifications((prev) => [item, ...prev])
    return item
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, add, markRead, markAllRead, dismiss, unreadCount }
}
