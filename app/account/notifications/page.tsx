"use client"

import { useMemo, useState } from "react"
import {
  Bell,
  Tag,
  Calendar,
  PartyPopper,
  Clock,
  CheckCheck,
  BellOff,
  Filter,
} from "lucide-react"
import { AccountSubLayout } from "@/components/site/AccountSubLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { cn } from "@/lib/utils"

type TypeStyle = {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  ring: string
}

const TYPE_STYLES: Record<string, TypeStyle> = {
  new_order: { icon: Bell, color: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-200" },
  order_ready: { icon: Bell, color: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-200" },
  low_stock: { icon: Tag, color: "text-red-700", bg: "bg-red-50", ring: "ring-red-200" },
  reservation_reminder: {
    icon: Calendar,
    color: "text-violet-700",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
  },
  payment_received: {
    icon: Tag,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
  promo: { icon: Tag, color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
  order: { icon: Bell, color: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-200" },
  happyhour: {
    icon: Clock,
    color: "text-orange-700",
    bg: "bg-orange-50",
    ring: "ring-orange-200",
  },
  birthday: {
    icon: PartyPopper,
    color: "text-pink-700",
    bg: "bg-pink-50",
    ring: "ring-pink-200",
  },
  event: {
    icon: Calendar,
    color: "text-violet-700",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
  },
  info: { icon: Bell, color: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-200" },
}

type FilterMode = "all" | "unread"

function relativeTime(dateStr: string) {
  const d = new Date(dateStr)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Il y a ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `Il y a ${diffD} j`
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

export default function NotificationsPage() {
  const { notifications: liveNotifications, markAllRead: markAllLiveRead } = useNotifications()

  const demoNotifications = [
    {
      id: "demo-1",
      type: "promo",
      title: "Nouvelle Promotion !",
      message: "-20% sur toutes les pizzas ce weekend",
      date: "2024-01-20",
      read: false,
    },
    {
      id: "demo-2",
      type: "order",
      title: "Commande livrée",
      message: "Votre commande #ORD-2024-001 a été livrée",
      date: "2024-01-19",
      read: true,
    },
    {
      id: "demo-3",
      type: "happyhour",
      title: "Happy Hour !",
      message: "-50% sur toutes les boissons de 17h à 19h",
      date: "2024-01-18",
      read: false,
    },
    {
      id: "demo-4",
      type: "birthday",
      title: "Joyeux anniversaire !",
      message: "Profitez de -25% avec le code BIRTHDAY25",
      date: "2024-01-15",
      read: true,
    },
    {
      id: "demo-5",
      type: "event",
      title: "Événement spécial",
      message: "Finale de la Champions League — Réservez votre table maintenant !",
      date: "2024-01-10",
      read: true,
    },
  ]

  const [demoReadAll, setDemoReadAll] = useState(false)
  const [filter, setFilter] = useState<FilterMode>("all")

  const liveAsMapped = liveNotifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    date: n.timestamp,
    read: n.read,
  }))

  const all = useMemo(() => {
    const demos = demoReadAll
      ? demoNotifications.map((d) => ({ ...d, read: true }))
      : demoNotifications
    return [...liveAsMapped, ...demos]
  }, [liveAsMapped, demoReadAll])

  const filtered = useMemo(() => {
    if (filter === "unread") return all.filter((n) => !n.read)
    return all
  }, [all, filter])

  const unreadCount = all.filter((n) => !n.read).length

  const markAllAsRead = () => {
    markAllLiveRead()
    setDemoReadAll(true)
  }

  return (
    <AccountSubLayout title="Notifications" subtitle="Offres, alertes et suivi de vos commandes.">
      <Card className="premium-card p-6 sm:p-7 animate-fade-up">
        {/* Header avec filtre + actions */}
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-amber-950">
                Toutes les notifications
              </h2>
              <p className="text-xs text-amber-900/65">
                {unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                  : "Tout est lu"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="tablist"
              aria-label="Filtrer les notifications"
              className="flex items-center gap-1 rounded-full border border-amber-900/10 bg-white/70 p-1 backdrop-blur-md"
            >
              {(
                [
                  { id: "all", label: `Toutes (${all.length})` },
                  { id: "unread", label: `Non lues (${unreadCount})` },
                ] as { id: FilterMode; label: string }[]
              ).map((tab) => {
                const active = filter === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(tab.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition",
                      active
                        ? "bg-amber-950 text-amber-50 shadow-sm"
                        : "text-amber-900/70 hover:text-amber-950",
                    )}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
            {unreadCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="rounded-full"
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Tout marquer lu
              </Button>
            ) : null}
          </div>
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-200/70 bg-amber-50/30 p-10 text-center">
            <BellOff className="mx-auto mb-3 h-10 w-10 text-amber-700/60" />
            <p className="font-display text-base font-semibold text-amber-950">
              {filter === "unread" ? "Tout est à jour" : "Aucune notification"}
            </p>
            <p className="mt-1 text-sm text-amber-900/65">
              {filter === "unread"
                ? "Vous avez lu toutes vos notifications."
                : "Vos notifications apparaîtront ici."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((notif) => {
              const style = TYPE_STYLES[notif.type] ?? TYPE_STYLES.info
              const Icon = style.icon
              return (
                <div
                  key={notif.id}
                  className={cn(
                    "group flex gap-4 rounded-2xl border p-4 transition",
                    notif.read
                      ? "border-amber-900/10 bg-white/70 hover:border-amber-900/15 hover:shadow-sm"
                      : "border-[color:var(--lux-gold)]/30 bg-gradient-to-br from-[color:var(--lux-cream)]/60 to-white shadow-[0_8px_22px_-15px_rgba(201,162,76,0.4)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
                      style.bg,
                      style.color,
                      style.ring,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3
                        className={cn(
                          "font-semibold text-amber-950",
                          !notif.read && "flex items-center gap-2",
                        )}
                      >
                        {notif.title}
                        {!notif.read ? (
                          <span
                            aria-hidden
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: "var(--lux-gradient-gold)" }}
                          />
                        ) : null}
                      </h3>
                      <p className="shrink-0 text-[11px] text-amber-900/55">
                        {relativeTime(notif.date)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-amber-900/75">{notif.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </AccountSubLayout>
  )
}
