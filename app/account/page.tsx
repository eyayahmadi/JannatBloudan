"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  MapPin,
  Heart,
  History,
  Gift,
  Star,
  Bell,
  LogOut,
  Edit2,
  CheckCircle2,
  Trash2,
  Plus,
  ChevronRight,
  Phone,
  Mail,
  Settings,
} from "lucide-react"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SITE } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/context/AuthContext"
import { cn } from "@/lib/utils"

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

type QuickLink = {
  href: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconText: string
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

  const initials = useMemo(() => {
    const parts = profile.name.split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }, [profile.name])

  const favorites: Favorite[] = [
    { name: "Pizza Margherita", orders: 12, image: "/pizza-margherita.png" },
    { name: "Burger Classic", orders: 8, image: "/classic-burger.png" },
    { name: "Pates Carbonara", orders: 6, image: "/pasta-carbonara.png" },
  ]

  const quickLinks: QuickLink[] = [
    {
      href: "/account/history",
      title: "Historique",
      description: "Commandes & réservations",
      icon: History,
      iconBg: "bg-amber-100/80",
      iconText: "text-amber-800",
    },
    {
      href: "/account/loyalty",
      title: "Fidélité",
      description: `${profile.loyaltyPoints} points disponibles`,
      icon: Gift,
      iconBg: "bg-orange-100/80",
      iconText: "text-orange-700",
    },
    {
      href: "/account/reviews",
      title: "Mes avis",
      description: "Noter vos plats",
      icon: Star,
      iconBg: "bg-yellow-100/80",
      iconText: "text-yellow-700",
    },
    {
      href: "/account/notifications",
      title: "Notifications",
      description: "Offres & promotions",
      icon: Bell,
      iconBg: "bg-emerald-100/80",
      iconText: "text-emerald-700",
    },
  ]

  const setDefault = (id: string | number) => {
    setAddressList((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
  }

  const removeAddress = (id: string | number) => {
    setAddressList((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <PageShell>
      <SiteHeader
        backHref="/"
        trailing={
          user ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden rounded-full border-red-200/80 text-red-700 hover:bg-red-50 sm:inline-flex"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          ) : null
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

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Carte profil principale */}
        <Card className="card-luxe mb-8 overflow-hidden p-0 animate-fade-up">
          <div className="card-luxe-inner relative p-6 sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[color:var(--lux-gold)]/15 blur-[80px]"
            />
            <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              {/* Avatar */}
              <div className="relative">
                <div
                  className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full font-display text-3xl font-semibold text-amber-100 shadow-[0_18px_40px_-12px_rgba(110,29,43,0.45)] ring-4 ring-white"
                  style={{ background: "var(--lux-gradient-ink)" }}
                >
                  <span aria-hidden>{initials}</span>
                </div>
                <span
                  aria-hidden
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md"
                  style={{ background: "var(--lux-gradient-gold)" }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>

              {/* Identité */}
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-2xl font-semibold text-amber-950 sm:text-3xl">
                  {profile.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-amber-900/70">
                  {profile.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {profile.email}
                    </span>
                  ) : (
                    <span className="text-amber-900/50">Non connecté</span>
                  )}
                  {profile.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {profile.phone}
                    </span>
                  ) : null}
                </div>
                {!user ? (
                  <div className="mt-3">
                    <Button asChild size="sm" variant="gold" className="rounded-full">
                      <Link href="/login">Se connecter</Link>
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Carte fidélité */}
              <div
                className="relative overflow-hidden rounded-2xl border border-[color:var(--lux-gold)]/35 px-6 py-4 text-center shadow-[0_12px_30px_-15px_rgba(201,162,76,0.35)]"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--lux-cream) 90%, white), color-mix(in srgb, var(--lux-sand) 70%, white))",
                }}
              >
                <Gift className="mx-auto mb-2 h-7 w-7 text-[color:var(--lux-bordeaux)]" />
                <div className="font-display text-3xl font-semibold text-gold">
                  {profile.loyaltyPoints}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-900/70">
                  Points fidélité
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick links */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up [animation-delay:80ms]">
          {quickLinks.map(({ href, title, description, icon: Icon, iconBg, iconText }) => (
            <Link key={href} href={href} className="group">
              <Card className="premium-card group h-full p-5">
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl transition group-hover:scale-110",
                      iconBg,
                      iconText,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <ChevronRight className="h-4 w-4 text-amber-900/40 transition group-hover:translate-x-1 group-hover:text-amber-950" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-amber-950">{title}</h3>
                <p className="mt-1 text-sm text-amber-900/65">{description}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Adresses */}
        <Card className="premium-card mb-8 p-6 sm:p-7 animate-fade-up [animation-delay:160ms]">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--lux-bordeaux)]/12 text-[color:var(--lux-bordeaux)]">
                <MapPin className="h-5 w-5" />
              </span>
              Mes adresses
            </h2>
            <Button
              size="pill"
              variant="gold"
              onClick={() => setShowAddressForm(true)}
              className="self-start sm:self-auto"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Ajouter
            </Button>
          </div>

          {addressList.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-amber-200/70 bg-amber-50/30 p-8 text-center">
              <MapPin className="mx-auto mb-3 h-8 w-8 text-amber-700/60" />
              <p className="text-sm text-amber-900/70">Aucune adresse enregistrée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addressList.map((addr) => (
                <div
                  key={addr.id}
                  className={cn(
                    "group flex items-start justify-between rounded-2xl border p-4 transition",
                    addr.isDefault
                      ? "border-[color:var(--lux-gold)]/40 bg-gradient-to-br from-[color:var(--lux-cream)] to-white shadow-[0_8px_22px_-12px_rgba(201,162,76,0.4)]"
                      : "border-amber-900/10 bg-white/70 hover:border-amber-900/20 hover:shadow-sm",
                  )}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-800">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-amber-950">{addr.label}</span>
                        {addr.isDefault ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--lux-ink)]"
                            style={{ background: "var(--lux-gradient-gold)" }}
                          >
                            Par défaut
                          </span>
                        ) : null}
                      </div>
                      <p className="break-words text-sm text-amber-900/70">{addr.address}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!addr.isDefault ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefault(addr.id)}
                        className="rounded-lg text-xs text-amber-900/70 hover:bg-amber-100/60 hover:text-amber-950"
                      >
                        Par défaut
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-amber-900/60 hover:bg-amber-100/60 hover:text-amber-950"
                      aria-label="Modifier"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {addressList.length > 1 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAddress(addr.id)}
                        className="rounded-lg text-red-700/80 hover:bg-red-50 hover:text-red-800"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}

              {showAddressForm ? (
                <div className="rounded-2xl border border-[color:var(--lux-gold)]/35 bg-gradient-to-br from-[color:var(--lux-cream)] to-white p-5 shadow-[0_10px_30px_-15px_rgba(201,162,76,0.35)] animate-fade-up">
                  <p className="mb-3 text-sm font-semibold text-amber-950">Nouvelle adresse</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-amber-900/80">Libellé</label>
                      <input
                        className="w-full rounded-xl border border-amber-900/15 bg-white/90 px-3 py-2 text-sm focus:border-[color:var(--lux-gold)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--lux-gold)]/25"
                        value={newAddress.label}
                        onChange={(e) =>
                          setNewAddress((prev) => ({ ...prev, label: e.target.value }))
                        }
                        placeholder="Maison, Bureau..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-amber-900/80">Adresse</label>
                      <input
                        className="w-full rounded-xl border border-amber-900/15 bg-white/90 px-3 py-2 text-sm focus:border-[color:var(--lux-gold)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--lux-gold)]/25"
                        value={newAddress.address}
                        onChange={(e) =>
                          setNewAddress((prev) => ({ ...prev, address: e.target.value }))
                        }
                        placeholder="12 rue Exemple, Paris"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddressForm(false)
                        setNewAddress({ label: "Maison", address: "" })
                      }}
                      className="rounded-full"
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="gold"
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        if (!newAddress.address.trim()) return
                        setAddressList((prev) => [
                          ...prev,
                          {
                            id: crypto.randomUUID(),
                            label: newAddress.label || "Adresse",
                            address: newAddress.address,
                          },
                        ])
                        setNewAddress({ label: "Maison", address: "" })
                        setShowAddressForm(false)
                      }}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Enregistrer
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Card>

        {/* Plats favoris */}
        <Card className="premium-card mb-8 p-6 sm:p-7 animate-fade-up [animation-delay:240ms]">
          <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100/80 text-rose-700">
              <Heart className="h-5 w-5" />
            </span>
            Plats favoris
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {favorites.map((fav, idx) => (
              <Card
                key={idx}
                className="group overflow-hidden border-amber-900/10 p-0 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-36 w-full overflow-hidden">
                  <img
                    src={fav.image || "/placeholder.svg"}
                    alt={fav.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-amber-950 shadow-sm backdrop-blur">
                    <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                    {fav.orders}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-amber-950">{fav.name}</h3>
                  <p className="text-xs text-amber-900/65">Commandé {fav.orders} fois</p>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Action déconnexion (mobile / repli) */}
        {user ? (
          <div className="mb-8 flex justify-center sm:hidden">
            <Button
              variant="outline"
              className="rounded-full border-red-200/80 text-red-700 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        ) : null}

        {/* Lien paramètres discret */}
        <div className="text-center text-xs text-amber-900/50">
          <Link
            href="/account/notifications"
            className="inline-flex items-center gap-1 underline-offset-4 hover:text-amber-950 hover:underline"
          >
            <Settings className="h-3 w-3" />
            Paramètres et préférences
          </Link>
        </div>
      </div>
      <SiteFooter />
    </PageShell>
  )
}
