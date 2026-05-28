"use client"

import { useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { AccountDashboardOverview } from "@/components/account/AccountDashboardOverview"
import {
  MapPin,
  Heart,
  Gift,
  Bell,
  LogOut,
  Edit2,
  CheckCircle2,
  Trash2,
  Plus,
  Settings,
  ShoppingCart,
  BookOpen,
  CalendarDays,
  PartyPopper,
  Package,
  CalendarCheck,
  Ticket,
  FileText,
  UserRoundPen,
  LayoutDashboard,
  Menu,
  Tag,
  RotateCcw,
  Sparkles,
  QrCode,
} from "lucide-react"
import { ClientPortalMenuEmbed } from "@/components/account/ClientPortalMenuEmbed"
import {
  ClientPortalEventTicketsPanel,
  ClientPortalInvoicesPanel,
  ClientPortalOrdersPanel,
  ClientPortalReservationsPanel,
} from "@/components/account/client-portal-panels"
import { PortalLoyaltyPanel } from "@/components/account/PortalLoyaltyPanel"
import { PortalNotificationsPanel } from "@/components/account/PortalNotificationsPanel"
import { PortalProfileForm } from "@/components/account/PortalProfileForm"
import { EventsBrowsePanel } from "@/components/events/EventsBrowsePanel"
import { ReservationBookingFlow } from "@/components/reservation/ReservationBookingFlow"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SITE } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
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

type AccountSectionId =
  | "overview"
  | "order"
  | "menu"
  | "reorder"
  | "recommendations"
  | "promotions"
  | "scan-table"
  | "reserve-table"
  | "reserve-event"
  | "orders"
  | "reservations"
  | "tickets"
  | "invoices"
  | "addresses"
  | "profile"
  | "favorites"
  | "loyalty"
  | "notifications"
  | "logout"

type SidebarItem = {
  id: AccountSectionId
  label: string
  icon: LucideIcon
  badge?: "nouveau" | "important"
  authOnly?: boolean
  danger?: boolean
}

function navBadgeLabel(b: NonNullable<SidebarItem["badge"]>): string {
  if (b === "nouveau") return "Nouveau"
  return "Important"
}

function navBadgeClass(b: NonNullable<SidebarItem["badge"]>): string {
  if (b === "nouveau") {
    return "border border-[color:var(--lux-gold)]/40 bg-[color:var(--lux-gold)]/15 text-[color:var(--lux-bordeaux)]"
  }
  return "border border-[color:var(--lux-bordeaux)]/30 bg-[color:var(--lux-bordeaux)]/10 text-[color:var(--lux-bordeaux)]"
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "order", label: "Commander maintenant", icon: ShoppingCart },
  { id: "menu", label: "Voir le menu", icon: BookOpen },
  { id: "reorder", label: "Recommander dernière commande", icon: RotateCcw },
  { id: "recommendations", label: "Mes recommandations", icon: Sparkles, badge: "nouveau" },
  { id: "promotions", label: "Promotions & réductions", icon: Tag, badge: "important" },
  { id: "scan-table", label: "Scanner table (QR)", icon: QrCode },
  { id: "reserve-table", label: "Réserver une table", icon: CalendarDays },
  { id: "reserve-event", label: "Réserver un événement", icon: PartyPopper, badge: "nouveau" },
  { id: "orders", label: "Voir mes commandes", icon: Package },
  { id: "reservations", label: "Voir mes réservations", icon: CalendarCheck },
  { id: "tickets", label: "Voir mes tickets événements", icon: Ticket, badge: "nouveau" },
  { id: "invoices", label: "Voir mes factures", icon: FileText, badge: "important" },
  { id: "addresses", label: "Gérer mes adresses", icon: MapPin },
  { id: "profile", label: "Modifier mon profil", icon: UserRoundPen },
  { id: "favorites", label: "Mes favoris", icon: Heart },
  { id: "loyalty", label: "Mes points fidélité", icon: Gift },
  { id: "notifications", label: "Mes notifications", icon: Bell, badge: "important" },
  { id: "logout", label: "Se déconnecter", icon: LogOut, danger: true, authOnly: true },
]

export default function AccountPage() {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState<AccountSectionId>("overview")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [tableScanInput, setTableScanInput] = useState("")
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

  const visibleNav = useMemo(
    () => SIDEBAR_ITEMS.filter((item) => (item.authOnly ? Boolean(user) : true)),
    [user],
  )

  const activeLabel = useMemo(
    () => visibleNav.find((i) => i.id === activeSection)?.label ?? "Mon compte",
    [visibleNav, activeSection],
  )

  const setDefault = (id: string | number) => {
    setAddressList((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
  }

  const removeAddress = (id: string | number) => {
    setAddressList((prev) => prev.filter((a) => a.id !== id))
  }

  const selectNav = (id: AccountSectionId) => {
    if (id === "logout") {
      void logout()
      setMobileNavOpen(false)
      return
    }
    setActiveSection(id)
    setMobileNavOpen(false)
  }

  const renderSidebarNav = (className?: string) => (
    <nav className={cn("flex flex-col gap-0.5 p-2", className)} aria-label="Sections du compte client">
      {visibleNav.map((item) => {
        const Icon = item.icon
        const active = activeSection === item.id
        const badge = item.badge
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => selectNav(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/45",
              item.danger
                ? "text-red-700 hover:bg-red-50/90"
                : active
                  ? "bg-[color:var(--lux-bordeaux)]/12 font-semibold text-[color:var(--lux-bordeaux)] shadow-[inset_3px_0_0_0_var(--lux-gold)]"
                  : "text-amber-950/90 hover:bg-[color:var(--lux-bordeaux)]/[0.06]",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                active && !item.danger
                  ? "bg-[color:var(--lux-gold)]/25 text-[color:var(--lux-bordeaux)]"
                  : item.danger
                    ? "bg-red-100/80 text-red-700"
                    : "bg-[color:var(--lux-gold)]/15 text-[color:var(--lux-bordeaux)]",
              )}
            >
              <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
            {badge ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  navBadgeClass(badge),
                )}
              >
                {navBadgeLabel(badge)}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )

  const addressesPanel = (
    <Card className="premium-card border border-[color:var(--lux-bordeaux)]/10 bg-gradient-to-br from-white/90 via-[color:var(--lux-cream)]/25 to-white/80 p-6 shadow-[var(--lux-shadow-soft)] sm:p-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--lux-bordeaux)]/12 text-[color:var(--lux-bordeaux)]">
            <MapPin className="h-5 w-5" />
          </span>
          Mes adresses
        </h2>
        <Button size="pill" variant="gold" onClick={() => setShowAddressForm(true)} className="self-start sm:self-auto">
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {addressList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--lux-gold)]/40 bg-gradient-to-br from-[color:var(--lux-cream)]/60 to-white/80 p-10 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--lux-bordeaux)]/10 text-[color:var(--lux-bordeaux)]">
            <MapPin className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <p className="font-display text-lg font-semibold text-amber-950">Aucune adresse enregistrée</p>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-amber-900/65">
            Ajoutez une adresse pour accélérer vos commandes en livraison et recevoir vos plats sans friction.
          </p>
          <Button size="pill" variant="gold" className="mt-6 rounded-full" onClick={() => setShowAddressForm(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter une adresse
          </Button>
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
                    onChange={(e) => setNewAddress((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="Maison, Bureau..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-amber-900/80">Adresse</label>
                  <input
                    className="w-full rounded-xl border border-amber-900/15 bg-white/90 px-3 py-2 text-sm focus:border-[color:var(--lux-gold)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--lux-gold)]/25"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress((prev) => ({ ...prev, address: e.target.value }))}
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
  )

  const favoritesPanel = (
    <Card className="premium-card border border-[color:var(--lux-bordeaux)]/10 bg-gradient-to-br from-white/90 via-[color:var(--lux-cream)]/20 to-white/80 p-6 shadow-[var(--lux-shadow-soft)] sm:p-8">
      <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-amber-950 sm:text-2xl">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-rose-50 text-rose-700 shadow-sm">
          <Heart className="h-5 w-5" strokeWidth={1.65} />
        </span>
        Plats favoris
      </h2>
      {favorites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--lux-gold)]/35 bg-gradient-to-br from-[color:var(--lux-cream)]/50 to-white/85 p-10 text-center">
          <Heart className="mx-auto mb-4 h-10 w-10 text-[color:var(--lux-bordeaux)]/35" strokeWidth={1.25} />
          <p className="font-display text-lg font-semibold text-amber-950">Aucun favori pour le moment</p>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-amber-900/65">
            Parcourez le menu et commandez : vos plats les plus appréciés apparaîtront ici automatiquement.
          </p>
          <Button asChild variant="gold" size="pill" className="mt-6 rounded-full">
            <Link href="/menu">Découvrir le menu</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {favorites.map((fav, idx) => (
            <Card
              key={idx}
              className="group overflow-hidden rounded-2xl border border-amber-900/10 p-0 shadow-[var(--lux-shadow-soft)] transition duration-500 hover:-translate-y-1 hover:shadow-[var(--lux-shadow-gold)]"
            >
              <div className="relative h-36 w-full overflow-hidden sm:h-40">
                <img
                  src={fav.image || "/placeholder.svg"}
                  alt={fav.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-amber-950 shadow-sm backdrop-blur">
                  <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                  {fav.orders}
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="font-display font-semibold text-amber-950">{fav.name}</h3>
                <p className="mt-1 text-sm text-amber-900/65">Commandé {fav.orders} fois</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  )

  const sectionContent = (() => {
    switch (activeSection) {
      case "overview":
        return (
          <AccountDashboardOverview
            profile={profile}
            initials={initials}
            isLoggedIn={Boolean(user)}
            favorites={favorites}
            onNavigate={selectNav}
          />
        )
      case "order":
        return (
          <div className="animate-fade-up space-y-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-amber-950">Commander maintenant</h2>
              <p className="mt-1 text-sm text-amber-900/65">
                Parcourez la carte, ajoutez au panier et validez votre commande.
              </p>
            </div>
            <ClientPortalMenuEmbed />
          </div>
        )
      case "menu":
        return (
          <div className="animate-fade-up space-y-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-amber-950">Voir le menu</h2>
              <p className="mt-1 text-sm text-amber-900/65">Mezzés, plats signatures, boissons et desserts.</p>
            </div>
            <ClientPortalMenuEmbed />
          </div>
        )
      case "reorder":
        return (
          <Card className="premium-card border border-[color:var(--lux-bordeaux)]/10 p-6 sm:p-8">
            <h2 className="mb-2 font-display text-xl font-semibold text-amber-950">Recommander votre dernière commande</h2>
            <p className="text-sm text-amber-900/65">
              Rouvrez un panier prérempli à partir de votre dernière commande confirmée (liaison API « historique client » en cours
              d’intégration).
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="gold" size="pill" className="rounded-full" onClick={() => selectNav("orders")}>
                Voir mes commandes
              </Button>
              <Button variant="outline" size="pill" className="rounded-full" onClick={() => selectNav("order")}>
                Nouvelle commande
              </Button>
            </div>
          </Card>
        )
      case "recommendations":
        return (
          <Card className="premium-card border border-[color:var(--lux-bordeaux)]/10 p-6 sm:p-8">
            <h2 className="mb-2 font-display text-xl font-semibold text-amber-950">Mes recommandations</h2>
            <p className="text-sm text-amber-900/65">
              Suggestions personnalisées (fidélité + historique + saisonnalité) — branchement moteur IA prévu. En attendant,
              explorez la carte et vos favoris.
            </p>
            <Button variant="gold" size="pill" className="mt-6 rounded-full" onClick={() => selectNav("menu")}>
              Parcourir le menu
            </Button>
          </Card>
        )
      case "promotions":
        return (
          <Card className="premium-card border border-[color:var(--lux-bordeaux)]/10 p-6 sm:p-8">
            <h2 className="mb-2 font-display text-xl font-semibold text-amber-950">Promotions & réductions</h2>
            <p className="text-sm text-amber-900/65">
              Codes promo, happy hours et offres événements apparaîtront ici. Les réductions actives s’appliquent aussi au panier
              en ligne.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="pill" className="rounded-full">
                <Link href="/menu">Commander avec le menu</Link>
              </Button>
              <Button asChild variant="outline" size="pill" className="rounded-full">
                <Link href="/account">Actualiser</Link>
              </Button>
            </div>
          </Card>
        )
      case "scan-table":
        return (
          <Card className="premium-card border border-[color:var(--lux-bordeaux)]/10 p-6 sm:p-8">
            <h2 className="mb-2 font-display text-xl font-semibold text-amber-950">Scanner une table (QR)</h2>
            <p className="text-sm text-amber-900/65">
              Saisissez le numéro affiché sur la table ou scannez le QR pour ouvrir l’expérience table (menu, commande, addition).
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium text-amber-900/80">Numéro de table</label>
                <input
                  className="w-full rounded-xl border border-amber-900/15 bg-white/90 px-3 py-2 text-sm focus:border-[color:var(--lux-gold)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--lux-gold)]/25"
                  inputMode="numeric"
                  placeholder="ex. 12"
                  value={tableScanInput}
                  onChange={(e) => setTableScanInput(e.target.value.replace(/[^\d]/g, ""))}
                />
              </div>
              {tableScanInput.trim() ? (
                <Button asChild variant="gold" size="pill" className="rounded-full sm:shrink-0">
                  <Link href={`/table/${tableScanInput.trim()}`}>Ouvrir la table</Link>
                </Button>
              ) : (
                <Button type="button" variant="gold" size="pill" className="rounded-full sm:shrink-0" disabled>
                  Ouvrir la table
                </Button>
              )}
            </div>
          </Card>
        )
      case "reserve-table":
        return <ReservationBookingFlow embedded />
      case "reserve-event":
        return <EventsBrowsePanel />
      case "orders":
        return <ClientPortalOrdersPanel />
      case "reservations":
        return <ClientPortalReservationsPanel />
      case "tickets":
        return <ClientPortalEventTicketsPanel />
      case "invoices":
        return <ClientPortalInvoicesPanel />
      case "addresses":
        return <div className="animate-fade-up">{addressesPanel}</div>
      case "profile":
        return (
          <PortalProfileForm
            email={profile.email}
            firstName={user?.firstName ?? ""}
            lastName={user?.lastName ?? ""}
            phone={user?.phone ?? ""}
          />
        )
      case "favorites":
        return <div className="animate-fade-up">{favoritesPanel}</div>
      case "loyalty":
        return <PortalLoyaltyPanel initialPoints={profile.loyaltyPoints} />
      case "notifications":
        return <PortalNotificationsPanel />
      default:
        return null
    }
  })()

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
        subtitle="Votre portail client : menu à gauche, contenu à droite."
        height="sm"
      />

      <div className="mesh-page-bg flex-1 border-t border-[color:var(--lux-gold)]/12">
        <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pb-28 sm:pt-12 lg:px-8 lg:pb-24 lg:pt-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            {/* Desktop sidebar — Outlook-style folder pane */}
            <aside
              className={cn(
                "hidden lg:flex lg:w-[272px] lg:shrink-0 lg:flex-col",
                "sticky top-24 max-h-[calc(100vh-7rem)] rounded-2xl border border-[color:var(--lux-bordeaux)]/10",
                "bg-gradient-to-b from-[color:var(--lux-cream)]/95 via-white to-[color:var(--lux-sand)]/25",
                "shadow-[var(--lux-shadow-soft)]",
              )}
            >
              <div className="border-b border-amber-900/10 px-4 py-4">
                <p className="font-display text-sm font-semibold text-[color:var(--lux-bordeaux)]">Portail client</p>
                <p className="mt-0.5 text-xs text-amber-900/55">Jannat Bloudan</p>
              </div>
              <ScrollArea className="flex-1">
                {renderSidebarNav()}
              </ScrollArea>
            </aside>

            {/* Main column */}
            <div className="min-w-0 flex-1 space-y-4">
              {/* Mobile: section header + drawer trigger */}
              <div className="flex items-center justify-between gap-3 lg:hidden">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-900/45">Section</p>
                  <h2 className="truncate font-display text-lg font-semibold text-amber-950">{activeLabel}</h2>
                </div>
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-full border-[color:var(--lux-gold)]/45 bg-white/90"
                    >
                      <Menu className="mr-2 h-4 w-4" />
                      Menu
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className={cn(
                      "w-[min(20rem,88vw)] border-r border-[color:var(--lux-bordeaux)]/10 p-0",
                      "bg-gradient-to-b from-[color:var(--lux-cream)] to-white",
                    )}
                  >
                    <SheetHeader className="border-b border-amber-900/10 px-4 py-4 text-left">
                      <SheetTitle className="font-display text-base text-amber-950">Navigation</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-5.5rem)]">{renderSidebarNav()}</ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>

              <div
                key={activeSection}
                className="min-h-[12rem] transition-opacity duration-300 motion-reduce:transition-none"
              >
                {sectionContent}
              </div>

              <div className="pt-2 text-center text-xs text-amber-900/50 lg:text-left">
                <Link
                  href="/account/notifications"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-[color:var(--lux-bordeaux)]/8 hover:text-amber-950"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Paramètres et préférences
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar — quick portal navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[color:var(--lux-bordeaux)]/10 bg-[color:var(--lux-cream)]/95 px-2 py-2 backdrop-blur-md lg:hidden"
        aria-label="Navigation rapide du compte"
      >
        <button
          type="button"
          onClick={() => selectNav("overview")}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition",
            activeSection === "overview" ? "text-[color:var(--lux-bordeaux)]" : "text-amber-900/55",
          )}
        >
          <LayoutDashboard className="h-5 w-5" strokeWidth={1.75} />
          Accueil
        </button>
        <button
          type="button"
          onClick={() => selectNav("order")}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition",
            activeSection === "order" ? "text-[color:var(--lux-bordeaux)]" : "text-amber-900/55",
          )}
        >
          <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
          Commander
        </button>
        <button
          type="button"
          onClick={() => selectNav("orders")}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition",
            activeSection === "orders" ? "text-[color:var(--lux-bordeaux)]" : "text-amber-900/55",
          )}
        >
          <Package className="h-5 w-5" strokeWidth={1.75} />
          Commandes
        </button>
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium text-amber-900/55 transition hover:text-[color:var(--lux-bordeaux)]"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
          Plus
        </button>
      </nav>

      <div className="pb-16 lg:pb-0">
        <SiteFooter />
      </div>
    </PageShell>
  )
}
