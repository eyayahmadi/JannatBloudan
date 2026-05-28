"use client"

import { useState } from "react"
import { Bell, Package, ChefHat, AlertTriangle, Calendar, CreditCard, Info, X } from "lucide-react"
import { useNotifications, type NotificationType } from "@/lib/hooks/useNotifications"
import { Button } from "@/components/ui/button"

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  new_order: { icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
  order_ready: { icon: ChefHat, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/40" },
  low_stock: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" },
  reservation_reminder: { icon: Calendar, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/40" },
  payment_received: { icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  info: { icon: Info, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
}

export function NotificationCenter() {
  const { notifications, unreadCount, markAllRead, dismiss, isAdminAudience } = useNotifications()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open && unreadCount > 0) markAllRead()
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--lux-gold)]/25 bg-white/90 text-amber-900 shadow-sm backdrop-blur-sm transition hover:border-[color:var(--lux-gold)]/40 hover:bg-white hover:shadow-md dark:border-[color:var(--lux-gold)]/30 dark:bg-zinc-900/90 dark:text-amber-200 dark:hover:bg-zinc-900"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 max-h-96 overflow-y-auto rounded-2xl border border-amber-200/50 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-stone-900">
            <div className="sticky top-0 flex items-center justify-between border-b border-amber-100 bg-white/95 px-4 py-3 dark:border-white/10 dark:bg-stone-900/95">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-100">Notifications</h3>
                {isAdminAudience ? (
                  <span
                    className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                    title="Vue administrateur — toutes les notifications de tous les rôles"
                  >
                    Admin · vue globale
                  </span>
                ) : null}
              </div>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                  Tout lire
                </Button>
              )}
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
                  const age = Math.round((Date.now() - new Date(n.timestamp).getTime()) / 60000)
                  const ageLabel = age < 1 ? "maintenant" : age < 60 ? `${age}m` : `${Math.round(age / 60)}h`

                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 transition ${!n.read ? cfg.bg : "hover:bg-amber-50/50 dark:hover:bg-white/5"}`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-amber-950 dark:text-amber-100">{n.title}</p>
                        <p className="text-xs text-amber-800/70 dark:text-amber-300/70 line-clamp-2">{n.message}</p>
                        <p className="mt-1 text-[10px] text-amber-700/50 dark:text-amber-400/50">{ageLabel}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismiss(n.id)}
                        className="shrink-0 rounded p-1 text-amber-700/40 transition hover:bg-amber-100 hover:text-amber-800 dark:text-amber-400/40 dark:hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
