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
  labelKey: string
  href: string
  icon: LucideIcon
  hintKey?: string
}

const SERVER_NAV: WorkspaceNavItem[] = [
  { id: "tables", labelKey: "workspace.nav.server.tables", href: "/server/tables", icon: LayoutGrid },
  { id: "walk-in", labelKey: "workspace.nav.server.walkIn", href: "/server/walk-in", icon: PackageOpen },
]

const KITCHEN_NAV: WorkspaceNavItem[] = [
  { id: "orders", labelKey: "workspace.nav.kitchen.orders", href: "/kitchen/orders", icon: ChefHat },
]

const BAR_NAV: WorkspaceNavItem[] = [
  { id: "orders", labelKey: "workspace.nav.bar.orders", href: "/bar/orders", icon: Wine },
]

const SHISHA_NAV: WorkspaceNavItem[] = [
  { id: "orders", labelKey: "workspace.nav.shisha.orders", href: "/shisha/orders", icon: Wind },
]

const CASHIER_NAV: WorkspaceNavItem[] = [
  { id: "caisse", labelKey: "workspace.nav.cashier.caisse", href: "/caisse?tab=vue", icon: Banknote },
  { id: "pos", labelKey: "workspace.nav.cashier.pos", href: "/pos", icon: Monitor },
  {
    id: "encaisser",
    labelKey: "workspace.nav.cashier.encaisser",
    href: "/caisse?tab=encaisser",
    icon: Receipt,
    hintKey: "workspace.nav.cashier.encaisserHint",
  },
  {
    id: "tables",
    labelKey: "workspace.nav.cashier.tables",
    href: "/caisse?tab=tables",
    icon: Table2,
    hintKey: "workspace.nav.cashier.tablesHint",
  },
  {
    id: "factures",
    labelKey: "workspace.nav.cashier.factures",
    href: "/caisse?tab=factures",
    icon: Banknote,
    hintKey: "workspace.nav.cashier.facturesHint",
  },
  {
    id: "externes",
    labelKey: "workspace.nav.cashier.externes",
    href: "/caisse?tab=externes",
    icon: Truck,
    hintKey: "workspace.nav.cashier.externesHint",
  },
  {
    id: "mouvements",
    labelKey: "workspace.nav.cashier.mouvements",
    href: "/caisse?tab=mouvements",
    icon: Wallet,
    hintKey: "workspace.nav.cashier.mouvementsHint",
  },
  {
    id: "cloture",
    labelKey: "workspace.nav.cashier.cloture",
    href: "/caisse?tab=cloture",
    icon: Banknote,
    hintKey: "workspace.nav.cashier.clotureHint",
  },
]

const DELIVERY_NAV: WorkspaceNavItem[] = [
  { id: "dash", labelKey: "workspace.nav.delivery.dash", href: "/delivery/dashboard", icon: Truck },
  { id: "driver", labelKey: "workspace.nav.delivery.driver", href: "/driver", icon: MapPin },
]

const ADMIN_WORKSPACE_NAV: WorkspaceNavItem[] = [
  { id: "admin", labelKey: "workspace.nav.admin.erp", href: "/admin", icon: ClipboardList },
  { id: "tables", labelKey: "workspace.nav.admin.tables", href: "/server/tables", icon: LayoutGrid },
  { id: "kitchen", labelKey: "workspace.nav.admin.kitchen", href: "/kitchen/orders", icon: ChefHat },
  { id: "bar", labelKey: "workspace.nav.admin.bar", href: "/bar/orders", icon: Wine },
  { id: "shisha", labelKey: "workspace.nav.admin.shisha", href: "/shisha/orders", icon: Wind },
  { id: "caisse", labelKey: "workspace.nav.admin.caisse", href: "/caisse", icon: Banknote },
  { id: "delivery", labelKey: "workspace.nav.admin.delivery", href: "/delivery/dashboard", icon: Truck },
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
