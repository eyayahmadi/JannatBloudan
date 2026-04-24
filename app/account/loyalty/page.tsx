"use client"

import { useState } from "react"
import { Gift, Trophy, Tag, Sparkles } from "lucide-react"
import { AccountSubLayout } from "@/components/site/AccountSubLayout"
import { SITE } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function LoyaltyPage() {
  const [points, setPoints] = useState(450)
  const [message, setMessage] = useState<string | null>(null)
  const nextReward = 500
  const progress = Math.min(100, (points / nextReward) * 100)

  const rewards = [
    { id: 1, name: "Café Gratuit", points: 50, icon: "☕", available: true },
    { id: 2, name: "Dessert Offert", points: 100, icon: "🍰", available: true },
    { id: 3, name: "-10% sur commande", points: 150, icon: "💳", available: true },
    { id: 4, name: "Pizza Gratuite", points: 300, icon: "🍕", available: true },
    { id: 5, name: "Menu Complet Offert", points: 500, icon: "🎁", available: true },
    { id: 6, name: "Statut VIP 1 mois", points: 1000, icon: "👑", available: false },
  ]

  const coupons = [
    { code: "SHAWARMA10", discount: "10%", item: "Shawarma", expiry: "2024-02-28" },
    { code: "BIRTHDAY20", discount: "20%", item: "Toute commande", expiry: "2024-01-31" },
    { code: "HAPPYHOUR", discount: "15%", item: "Boissons", expiry: "2024-01-25" },
  ]

  return (
    <AccountSubLayout
      title="Programme fidélité"
      subtitle="Cumulez des points à chaque visite."
      heroImage={SITE.images.mezze}
    >
        {/* Points Balance */}
        <Card className="mb-6 overflow-hidden border-white/50 bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900 p-6 text-white shadow-lg backdrop-blur-md sm:p-8 animate-fade-up">
          <div className="mb-6 text-center">
            <Trophy className="mx-auto mb-3 h-14 w-14 text-amber-200" />
            <h2 className="font-display text-4xl font-semibold">{points} points</h2>
            <p className="text-sm text-amber-100/85">Votre solde actuel</p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
            <div className="mb-2 flex items-center justify-between text-sm text-amber-50/90">
              <span>Prochain palier : menu complet</span>
              <span className="font-semibold">{Math.max(0, nextReward - points)} pts</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/20">
              <div
                className="h-2 rounded-full bg-amber-300 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Rewards */}
        <Card className="mb-6 border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Gift className="w-6 h-6 text-orange-600" />
            Récompenses Disponibles
          </h2>
          {message && (
            <div className="mb-3 text-sm text-center text-orange-700 bg-orange-50 border border-orange-200 rounded p-2">
              {message}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <Card
                key={reward.id}
                className={`p-4 ${
                  reward.available ? "border-2 border-orange-500 hover:shadow-lg cursor-pointer" : "opacity-50"
                }`}
              >
                <div className="text-4xl text-center mb-3">{reward.icon}</div>
                <h3 className="font-semibold text-center mb-2">{reward.name}</h3>
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    {reward.points} points
                  </span>
                </div>
                {reward.available && (
                  <Button
                    className="w-full mt-3 bg-orange-600 hover:bg-orange-700"
                    disabled={points < reward.points}
                    onClick={() => {
                      if (points < reward.points) {
                        setMessage("Points insuffisants pour cette récompense.")
                        return
                      }
                      setPoints((p) => p - reward.points)
                      setMessage(`Récompense "${reward.name}" échangée avec succès !`)
                    }}
                  >
                    {points < reward.points ? "Points insuffisants" : "Échanger"}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </Card>

        {/* Active Coupons */}
        <Card className="border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Tag className="w-6 h-6 text-green-600" />
            Mes Coupons Actifs
          </h2>
          <div className="space-y-3">
            {coupons.map((coupon, idx) => (
              <div
                key={idx}
                className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-dashed border-green-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-lg text-green-700 mb-1">{coupon.code}</div>
                    <div className="text-sm text-gray-600 mb-1">
                      {coupon.discount} sur {coupon.item}
                    </div>
                    <div className="text-xs text-gray-500">
                      Expire le {new Date(coupon.expiry).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">Utiliser</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
    </AccountSubLayout>
  )
}
