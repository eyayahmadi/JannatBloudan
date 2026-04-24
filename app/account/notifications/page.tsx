"use client"

import { useMemo, useState } from "react"
import { Bell, Tag, Calendar, PartyPopper, Clock } from "lucide-react"
import { AccountSubLayout } from "@/components/site/AccountSubLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useNotifications } from "@/lib/hooks/useNotifications"

const typeStyle: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  new_order: { icon: Bell, color: "text-blue-600", bg: "bg-blue-50" },
  order_ready: { icon: Bell, color: "text-blue-600", bg: "bg-blue-50" },
  low_stock: { icon: Tag, color: "text-red-600", bg: "bg-red-50" },
  reservation_reminder: { icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
  payment_received: { icon: Tag, color: "text-green-600", bg: "bg-green-50" },
  info: { icon: Bell, color: "text-blue-600", bg: "bg-blue-50" },
}

export default function NotificationsPage() {
  const { notifications: liveNotifications, markAllRead: markAllLiveRead } = useNotifications()

  const demoNotifications = [
    {
      id: "demo-1",
      type: "promo",
      icon: Tag,
      color: "text-green-600",
      bg: "bg-green-50",
      title: "Nouvelle Promotion!",
      message: "-20% sur toutes les pizzas ce weekend",
      date: "2024-01-20",
      read: false,
    },
    {
      id: "demo-2",
      type: "order",
      icon: Bell,
      color: "text-blue-600",
      bg: "bg-blue-50",
      title: "Commande livrée",
      message: "Votre commande #ORD-2024-001 a été livrée",
      date: "2024-01-19",
      read: true,
    },
    {
      id: "demo-3",
      type: "happyhour",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
      title: "Happy Hour!",
      message: "-50% sur toutes les boissons de 17h à 19h",
      date: "2024-01-18",
      read: false,
    },
    {
      id: "demo-4",
      type: "birthday",
      icon: PartyPopper,
      color: "text-pink-600",
      bg: "bg-pink-50",
      title: "Joyeux Anniversaire!",
      message: "Profitez de -25% pour votre anniversaire avec le code BIRTHDAY25",
      date: "2024-01-15",
      read: true,
    },
    {
      id: "demo-5",
      type: "event",
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
      title: "Événement spécial",
      message: "Finale de la Champions League - Réservez votre table maintenant!",
      date: "2024-01-10",
      read: true,
    },
  ]

  const liveAsMapped = liveNotifications.map((n) => {
    const style = typeStyle[n.type] ?? typeStyle.info
    return {
      id: n.id,
      type: n.type,
      icon: style.icon,
      color: style.color,
      bg: style.bg,
      title: n.title,
      message: n.message,
      date: n.timestamp,
      read: n.read,
    }
  })

  const [demoRead, setDemoRead] = useState(false)

  const notifications = useMemo(() => {
    const demos = demoRead ? demoNotifications.map((d) => ({ ...d, read: true })) : demoNotifications
    return [...liveAsMapped, ...demos]
  }, [liveAsMapped, demoRead])

  const markAllAsRead = () => {
    markAllLiveRead()
    setDemoRead(true)
  }

  return (
    <AccountSubLayout title="Notifications" subtitle="Offres et suivi de vos commandes.">
        <Card className="border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md animate-fade-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Toutes les notifications</h2>
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Tout marquer comme lu
            </Button>
          </div>

          <div className="space-y-3">
            {notifications.map((notif) => {
              const Icon = notif.icon
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    notif.read ? "bg-white border-gray-200" : `${notif.bg} border-current ${notif.color}`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${notif.bg}`}>
                      <Icon className={`w-6 h-6 ${notif.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{notif.title}</h3>
                        {!notif.read && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notif.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
    </AccountSubLayout>
  )
}
