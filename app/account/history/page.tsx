"use client"

import { Package, Calendar, Download, Star } from "lucide-react"
import { AccountSubLayout } from "@/components/site/AccountSubLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HistoryPage() {
  const orders = [
    {
      id: "ORD-2024-001",
      date: "2024-01-15",
      type: "Livraison",
      items: ["Pizza Margherita", "Coca-Cola"],
      total: 15.99,
      status: "Terminée",
      rated: true,
    },
    {
      id: "ORD-2024-002",
      date: "2024-01-10",
      type: "Sur place",
      items: ["Burger Classic", "Frites", "Sprite"],
      total: 22.5,
      status: "Terminée",
      rated: false,
    },
    {
      id: "ORD-2024-003",
      date: "2024-01-05",
      type: "À emporter",
      items: ["Pâtes Carbonara", "Salade César"],
      total: 25.4,
      status: "Terminée",
      rated: true,
    },
  ]

  const reservations = [
    {
      id: "RES-2024-001",
      date: "2024-01-20",
      time: "19:30",
      guests: 4,
      zone: "Terrasse",
      status: "Confirmée",
    },
    {
      id: "RES-2024-002",
      date: "2024-01-08",
      time: "20:00",
      guests: 2,
      zone: "Intérieur",
      status: "Terminée",
    },
  ]

  return (
    <AccountSubLayout title="Mon historique" subtitle="Commandes et réservations passées.">
        {/* Orders History */}
        <Card className="mb-6 border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md animate-fade-up">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Package className="w-6 h-6 text-blue-600" />
            Mes Commandes
          </h2>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-lg mb-1">{order.id}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-blue-600">{order.total.toFixed(2)}€</div>
                    <div className="text-sm text-gray-600">{order.type}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Articles commandés:</div>
                  <div className="text-sm">{order.items.join(", ")}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger Facture
                  </Button>
                  {!order.rated && (
                    <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
                      <Star className="w-4 h-4 mr-2" />
                      Donner un avis
                    </Button>
                  )}
                  {order.rated && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      Avis donné
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Reservations History */}
        <Card className="border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md animate-fade-up [animation-delay:100ms]">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-orange-600" />
            Mes Réservations
          </h2>
          <div className="space-y-4">
            {reservations.map((res) => (
              <div key={res.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-lg mb-1">{res.id}</div>
                    <div className="text-sm text-gray-600 mb-1">
                      {new Date(res.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      à {res.time}
                    </div>
                    <div className="text-sm text-gray-600">
                      {res.guests} personnes • Zone: {res.zone}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      res.status === "Confirmée" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {res.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
    </AccountSubLayout>
  )
}
