"use client"

import { memo, useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole, type AppRole } from "@/lib/auth/roles"
import { Bell, Package, ChefHat, AlertTriangle, Calendar, CreditCard, Info, X } from "lucide-react"
import {
  useNotificationUnreadCount,
  useNotifications,
  type NotificationType,
} from "@/lib/hooks/useNotifications"
import { notificationsStore } from "@/lib/notifications/notifications-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  new_order: { icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
  order_ready: { icon: ChefHat, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/40" },
  low_stock: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" },
  reservation_reminder: { icon: Calendar, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/40" },
  payment_received: { icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  info: { icon: Info, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
}

const NotificationUnreadBadge = memo(function NotificationUnreadBadge({
  count,
}: {
  count: number
}) {
  const label = count > 9 ? "9+" : count > 0 ? String(count) : "0"
  const visible = count > 0

  return (
    <span
      className={cn(
        "pointer-events-none absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none tabular-nums",
        visible ? "bg-red-500 text-white" : "opacity-0",
      )}
      aria-hidden={!visible}
    >
      {label}
    </span>
  )
})

const NotificationListAge = memo(function NotificationListAge({
  timestamp,
}: {
  timestamp: string
}) {
  const [ageLabel, setAgeLabel] = useState("")

  useEffect(() => {
    const tick = () => {
      const age = Math.round((Date.now() - new Date(timestamp).getTime()) / 60000)
      setAgeLabel(age < 1 ? "maintenant" : age < 60 ? `${age}m` : `${Math.round(age / 60)}h`)
    }
    tick()
    const iv = window.setInterval(tick, 60_000)
    return () => window.clearInterval(iv)
  }, [timestamp])

  return (
    <p className="mt-1 text-[10px] text-amber-700/50 dark:text-amber-400/50">{ageLabel}</p>
  )
})

const NotificationBell = memo(function NotificationBell({
  onClick,
}: {
  onClick: () => void
}) {
  const unreadCount = useNotificationUnreadCount()

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--lux-gold)]/25 bg-white/90 text-amber-900 shadow-sm dark:border-[color:var(--lux-gold)]/30 dark:bg-zinc-900/90 dark:text-amber-200"
      aria-label={unreadCount > 0 ? `${unreadCount} notifications` : "Notifications"}
    >
      <Bell className="h-4 w-4 shrink-0" />
      <NotificationUnreadBadge count={unreadCount} />
    </button>
  )
})

const NotificationPanel = memo(function NotificationPanel({
  onClose,
}: {
  onClose: () => void
}) {
  const { notifications, markAllRead, dismiss, isAdminAudience } = useNotifications()
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPortalRoot(document.body)
  }, [])

  if (!portalRoot) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200]" onClick={onClose} aria-hidden />
      <div
        className="fixed end-3 top-14 z-[201] w-[min(20rem,calc(100vw-1.5rem))] max-h-[min(24rem,70vh)] overflow-y-auto rounded-2xl border border-amber-200/50 bg-white shadow-2xl dark:border-white/10 dark:bg-stone-900 sm:end-4 sm:top-16"
        role="dialog"
        aria-label="Notifications"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-amber-100 bg-white px-4 py-3 dark:border-white/10 dark:bg-stone-900">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-100">Notifications</h3>
            {isAdminAudience ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                Admin
              </span>
            ) : null}
          </div>
          {notifications.length > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              Tout lire
            </Button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-amber-800/60 dark:text-amber-300/60">
            Aucune notification
          </div>
        ) : (
          <div className="divide-y divide-amber-100/50 dark:divide-white/5">
            {notifications.slice(0, 20).map((n) => {
              const cfg = typeConfig[n.type] || typeConfig.info
              const Icon = cfg.icon

              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3",
                    !n.read ? cfg.bg : "hover:bg-amber-50/50 dark:hover:bg-white/5",
                  )}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-amber-950 dark:text-amber-100">{n.title}</p>
                    <p className="text-xs text-amber-800/70 dark:text-amber-300/70 line-clamp-2">{n.message}</p>
                    <NotificationListAge timestamp={n.timestamp} />
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(n.id)}
                    className="shrink-0 rounded p-1 text-amber-700/40 hover:bg-amber-100 hover:text-amber-800 dark:text-amber-400/40 dark:hover:bg-white/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>,
    portalRoot,
  )
})

export const NotificationCenter = memo(function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const role: AppRole = user ? normalizeRole(user.role) : "CLIENT"
  const isAdmin = role === "ADMIN"

  const handleBellClick = useCallback(() => {
    setOpen((wasOpen) => {
      if (!wasOpen) notificationsStore.markAllRead(role, isAdmin)
      return !wasOpen
    })
  }, [role, isAdmin])

  return (
    <div className="relative shrink-0">
      <NotificationBell onClick={handleBellClick} />
      {open ? <NotificationPanel onClose={() => setOpen(false)} /> : null}
    </div>
  )
})
