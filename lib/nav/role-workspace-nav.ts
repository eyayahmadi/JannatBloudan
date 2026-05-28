import type { LucideIcon } from "lucide-react"
import {
  Banknote,
  ChefHat,
  ClipboardList,
  LayoutGrid,
  MapPin,
  Monitor,
  PackageOpen,
  Receipt,
  Table2,
  Truck,
  Wallet,
  Wind,
  Wine,
} from "lucide-react"
import type { AppRole } from "@/lib/auth/roles"

export type WorkspaceNavItem = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** Si défini, affiché comme badge discret (ex. bientôt) */
  hint?: string
}

const SERVER_NAV: WorkspaceNavItem[] = [
  { id: "tables", label: "Plan de salle & tables", href: "/server/tables", icon: LayoutGrid },
  { id: "walk-in", label: "Commande sans table", href: "/server/walk-in", icon: PackageOpen },
]

const KITCHEN_NAV: WorkspaceNavItem[] = [
  { id: "orders", label: "Commandes cuisine (KDS)", href: "/kitchen/orders", icon: ChefHat },
]

const BAR_NAV: WorkspaceNavItem[] = [{ id: "orders", label: "Commandes bar", href: "/bar/orders", icon: Wine }]

const SHISHA_NAV: WorkspaceNavItem[] = [{ id: "orders", label: "Commandes chicha", href: "/shisha/orders", icon: Wind }]

const CASHIER_NAV: WorkspaceNavItem[] = [
  { id: "caisse", label: "Caisse — synthèse", href: "/caisse?tab=vue", icon: Banknote },
  { id: "pos", label: "POS", href: "/pos", icon: Monitor },
  {
    id: "encaisser",
    label: "Tables à encaisser",
    href: "/caisse?tab=encaisser",
    icon: Receipt,
    hint: "addition demandée · partiel · non payée",
  },
  { id: "tables", label: "Tables & sessions", href: "/caisse?tab=tables", icon: Table2, hint: "onglet Tables" },
  { id: "factures", label: "Factures du jour", href: "/caisse?tab=factures", icon: Banknote, hint: "onglet Factures" },
  { id: "externes", label: "Entrées externes", href: "/caisse?tab=externes", icon: Truck, hint: "Lieferando · Wolt · virements" },
  { id: "mouvements", label: "Mouvements caisse", href: "/caisse?tab=mouvements", icon: Wallet, hint: "sorties / avances" },
  { id: "cloture", label: "Clôture caisse", href: "/caisse?tab=cloture", icon: Banknote, hint: "fin de service" },
]

const DELIVERY_NAV: WorkspaceNavItem[] = [
  { id: "dash", label: "Livraisons assignées", href: "/delivery/dashboard", icon: Truck },
  { id: "driver", label: "Vue chauffeur (carte)", href: "/driver", icon: MapPin },
]

/** Liens rapides lorsqu’un ADMIN ouvre l’interface équipe (hors AdminPortalShell). */
const ADMIN_WORKSPACE_NAV: WorkspaceNavItem[] = [
  { id: "admin", label: "Admin ERP", href: "/admin", icon: ClipboardList },
  { id: "tables", label: "Plan salle", href: "/server/tables", icon: LayoutGrid },
  { id: "kitchen", label: "Cuisine (KDS)", href: "/kitchen/orders", icon: ChefHat },
  { id: "bar", label: "Bar", href: "/bar/orders", icon: Wine },
  { id: "shisha", label: "Chicha", href: "/shisha/orders", icon: Wind },
  { id: "caisse", label: "Caisse", href: "/caisse", icon: Banknote },
  { id: "delivery", label: "Livraison", href: "/delivery/dashboard", icon: Truck },
]

export function workspaceNavForRole(role: AppRole): WorkspaceNavItem[] {
  switch (role) {
    case "SERVER":
      return SERVER_NAV
    case "KITCHEN":
      return KITCHEN_NAV
    case "BAR":
      return BAR_NAV
    case "SHISHA":
      return SHISHA_NAV
    case "CASHIER":
      return CASHIER_NAV
    case "DELIVERY":
      return DELIVERY_NAV
    case "ADMIN":
      return ADMIN_WORKSPACE_NAV
    default:
      return []
  }
}
