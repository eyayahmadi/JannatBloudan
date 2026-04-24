"use client"

import { useMemo } from "react"
import Link from "next/link"
import { MapPin, Heart, History, Gift, Star, Bell, LogOut, Edit2 } from "lucide-react"
import { useState } from "react"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SITE } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/context/AuthContext"

type Address = {
  id: string | number
  label: string
  address: string
  isDefault?: boolean
}

type Favorite = {
  name: string
  orders: number
  image: string
}

export default function AccountPage() {
  const { user, logout } = useAuth()
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressList, setAddressList] = useState<Address[]>(
    (user as any)?.addresses && Array.isArray((user as any).addresses)
      ? (user as any).addresses
      : [{ id: 1, label: "Maison", address: "Ajoutez votre adresse", isDefault: true }],
  )
  const [newAddress, setNewAddress] = useState({ label: "Maison", address: "" })

  const profile = useMemo(() => {
    if (user) {
      const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
      return {
        name: displayName,
        email: user.email,
        phone: user.phone ?? "",
        avatar: "/placeholder.svg?height=100&width=100",
        loyaltyPoints: 0,
      }
    }
    return {
      name: "Invité",
      email: "",
      phone: "",
      avatar: "/placeholder.svg?height=100&width=100",
      loyaltyPoints: 0,
    }
  }, [user])

  const favorites: Favorite[] = [
    { name: "Pizza Margherita", orders: 12, image: "/pizza-margherita.png" },
    { name: "Burger Classic", orders: 8, image: "/classic-burger.png" },
    { name: "Pates Carbonara", orders: 6, image: "/pasta-carbonara.png" },
  ]

  return (
    <PageShell>
      <SiteHeader
        backHref="/"
        trailing={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-red-200/80 text-red-700 hover:bg-red-50"
            onClick={logout}
            disabled={!user}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        }
      />

      <PageHero
        imageSrc={SITE.images.mezze}
        imageAlt="Nos plats"
        kicker="Espace personnel"
        title="Mon compte"
        subtitle="Vos préférences, historique et fidélité — en un coup d’œil."
        height="sm"
      />

      <div className="mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mb-8 border-white/50 bg-white/80 p-6 shadow-sm backdrop-blur-md sm:p-8 animate-fade-up">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <img
              src={profile.avatar || "/placeholder.svg"}
              alt={profile.name}
              className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md ring-2 ring-amber-900/10"
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-semibold text-amber-950 sm:text-3xl">{profile.name}</h1>
              <p className="mt-1 text-amber-800/80">{profile.email || "Non connecté"}</p>
              <p className="text-amber-800/80">{profile.phone || "Ajoutez un téléphone"}</p>
            </div>
            <div className="rounded-2xl bg-amber-950/5 px-6 py-4 text-center ring-1 ring-amber-900/10">
              <Gift className="mx-auto mb-2 h-7 w-7 text-amber-700" />
              <div className="font-display text-2xl font-semibold text-amber-950">{profile.loyaltyPoints}</div>
              <div className="text-xs font-medium uppercase tracking-wider text-amber-800/70">Points fidélité</div>
            </div>
          </div>
        </Card>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-up [animation-delay:100ms]">
          <Link href="/account/history">
            <Card className="h-full cursor-pointer border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md">
              <History className="mb-3 h-8 w-8 text-amber-800" />
              <h3 className="font-display text-lg font-semibold text-amber-950">Historique</h3>
              <p className="text-sm text-amber-900/65">Commandes & réservations</p>
            </Card>
          </Link>

          <Link href="/account/loyalty">
            <Card className="h-full cursor-pointer border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md">
              <Gift className="mb-3 h-8 w-8 text-orange-700" />
              <h3 className="font-display text-lg font-semibold text-amber-950">Fidélité</h3>
              <p className="text-sm text-amber-900/65">{profile.loyaltyPoints} points disponibles</p>
            </Card>
          </Link>

          <Link href="/account/reviews">
            <Card className="h-full cursor-pointer border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md">
              <Star className="mb-3 h-8 w-8 text-amber-600" />
              <h3 className="font-display text-lg font-semibold text-amber-950">Mes avis</h3>
              <p className="text-sm text-amber-900/65">Noter vos plats</p>
            </Card>
          </Link>

          <Link href="/account/notifications">
            <Card className="h-full cursor-pointer border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md">
              <Bell className="mb-3 h-8 w-8 text-emerald-700" />
              <h3 className="font-display text-lg font-semibold text-amber-950">Notifications</h3>
              <p className="text-sm text-amber-900/65">Offres & promotions</p>
            </Card>
          </Link>
        </div>

        <Card className="mb-6 border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
              <MapPin className="h-6 w-6 text-amber-700" />
              Mes adresses
            </h2>
            <Button size="pill" onClick={() => setShowAddressForm(true)}>
              <MapPin className="w-4 h-4 mr-2" />
              Ajouter une adresse
            </Button>
          </div>
          <div className="space-y-3">
            {addressList.map((addr) => (
              <div key={addr.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Par defaut</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{addr.address}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {showAddressForm && (
              <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Libellé</label>
                    <input
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder="Maison, Bureau..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Adresse</label>
                    <input
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={newAddress.address}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="12 rue Exemple, Tunis"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setShowAddressForm(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={() => {
                      if (!newAddress.address.trim()) return
                      setAddressList((prev) => [
                        ...prev,
                        { id: crypto.randomUUID(), label: newAddress.label || "Adresse", address: newAddress.address },
                      ])
                      setNewAddress({ label: "Maison", address: "" })
                      setShowAddressForm(false)
                    }}
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
            <Heart className="h-6 w-6 text-rose-700" />
            Plats favoris
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {favorites.map((fav, idx) => (
              <Card key={idx} className="overflow-hidden border-amber-900/10 p-0 shadow-sm transition hover:shadow-md">
                <img
                  src={fav.image || "/placeholder.svg"}
                  alt={fav.name}
                  className="h-32 w-full object-cover"
                />
                <div className="p-4">
                  <h3 className="font-medium text-amber-950">{fav.name}</h3>
                  <p className="text-sm text-amber-900/65">Commandé {fav.orders} fois</p>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
      <SiteFooter />
    </PageShell>
  )
}
