"use client"

import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Brain,
  Briefcase,
  CalendarDays,
  CalendarRange,
  ChefHat,
  ClipboardList,
  CreditCard,
  FileBarChart,
  FileText,
  FolderTree,
  Gift,
  Globe,
  HeartHandshake,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  MessageSquareText,
  Package,
  Percent,
  PiggyBank,
  Plug,
  QrCode,
  Receipt,
  ScrollText,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  Ticket,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  UtensilsCrossed,
  Wallet,
  Wind,
  Wine,
  Wrench,
} from "lucide-react"

export type AdminPortalNavItem = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badge?: "new" | "dot"
  /** Match prefix for nested routes */
  matchPrefix?: boolean
}

export type AdminPortalNavGroup = {
  id: string
  label: string
  items: AdminPortalNavItem[]
}

export const ADMIN_PORTAL_NAV: AdminPortalNavGroup[] = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    items: [
      { id: "dash", label: "Dashboard principal", href: "/admin", icon: LayoutDashboard },
      { id: "alerts", label: "Alertes intelligentes", href: "/admin#portal-alerts", icon: AlertTriangle },
      { id: "suggestions", label: "Suggestions d'optimisation", href: "/admin#portal-suggestions", icon: Sparkles },
    ],
  },
  {
    id: "catalog",
    label: "Catalogue & achats",
    items: [
      { id: "menu", label: "Menu", href: "/admin/menu", icon: UtensilsCrossed, matchPrefix: true },
      { id: "menu-products", label: "Produits", href: "/admin/menu/products", icon: Package, matchPrefix: true },
      { id: "menu-categories", label: "Catégories", href: "/admin/menu/categories", icon: FolderTree, matchPrefix: true },
      { id: "menu-extras", label: "Extras", href: "/admin/menu/extras", icon: Sparkles, matchPrefix: true },
      { id: "menu-variants", label: "Variantes", href: "/admin/menu/variants", icon: Tag, matchPrefix: true },
      { id: "menu-recos", label: "Recommandations", href: "/admin/menu/recommendations", icon: Lightbulb, matchPrefix: true },
      { id: "stock", label: "Stock", href: "/admin/inventory", icon: Package, matchPrefix: true },
      { id: "sup-inv", label: "Factures fournisseurs", href: "/admin/supplier-invoices", icon: FileText, matchPrefix: true },
      { id: "suppliers", label: "Fournisseurs", href: "/admin/supplier-intelligence", icon: Store, matchPrefix: true },
      { id: "purchases", label: "Achats à prévoir", href: "/admin/purchases", icon: ShoppingBag, matchPrefix: true },
      { id: "promo", label: "Promotions & réductions", href: "/admin/promotions", icon: Tag, matchPrefix: true },
      { id: "offers", label: "Offres", href: "/admin/offers", icon: Percent, matchPrefix: true },
      { id: "reductions", label: "Réductions", href: "/admin/reductions", icon: Percent, matchPrefix: true },
    ],
  },
  {
    id: "ops",
    label: "Commandes & opérations",
    items: [
      { id: "orders", label: "Commandes (POS)", href: "/pos", icon: ClipboardList, matchPrefix: true },
      { id: "qr", label: "Tables QR", href: "/admin/tables-qr", icon: QrCode, matchPrefix: true },
      { id: "kitchen", label: "Cuisine (KDS)", href: "/kitchen", icon: ChefHat, matchPrefix: true },
      { id: "bar", label: "Bar", href: "/bar", icon: Wine, matchPrefix: true },
      { id: "shisha", label: "Shisha", href: "/shisha", icon: Wind, matchPrefix: true },
      { id: "server", label: "Serveurs", href: "/server", icon: UtensilsCrossed, matchPrefix: true },
      { id: "delivery", label: "Livraisons", href: "/driver", icon: Truck, matchPrefix: true },
    ],
  },
  {
    id: "finance",
    label: "Caisse & finance",
    items: [
      { id: "caisse", label: "Caisse", href: "/caisse", icon: Wallet, matchPrefix: true },
      { id: "payments", label: "Paiements", href: "/admin/finance", icon: CreditCard, matchPrefix: true },
      { id: "invoices-fin", label: "Factures & écritures", href: "/admin/finance", icon: Receipt },
      { id: "cash-out", label: "Sorties caisse", href: "/admin/cash-sorties", icon: Receipt, matchPrefix: true },
      { id: "advances", label: "Avances employés", href: "/admin/hr", icon: Users },
      { id: "taxes", label: "Taxes", href: "/admin/taxes", icon: Percent, matchPrefix: true },
      { id: "expenses", label: "Dépenses", href: "/admin/cash-sorties", icon: PiggyBank },
      { id: "fin-reports", label: "Rapports financiers", href: "/admin/finance", icon: LineChart },
    ],
  },
  {
    id: "events",
    label: "Réservations & événements",
    items: [
      { id: "res-ai", label: "Réservations", href: "/admin/ai/reservation", icon: CalendarDays, matchPrefix: true },
      { id: "cal", label: "Calendrier", href: "/admin/events/calendar", icon: CalendarRange, matchPrefix: true },
      { id: "ev-priv", label: "Événements privés", href: "/admin/events/private", icon: Sparkles, matchPrefix: true },
      { id: "ev-pub", label: "Événements publics", href: "/admin/events", icon: Ticket, matchPrefix: true },
      { id: "ev-new", label: "Nouvel événement", href: "/admin/events/new", icon: Ticket },
      { id: "wait", label: "Liste d'attente", href: "/admin/events", icon: Users },
      { id: "res-notif", label: "Notifications réservation", href: "/admin/settings", icon: Bell },
    ],
  },
  {
    id: "hr",
    label: "Personnel",
    items: [
      { id: "staff", label: "Employés", href: "/admin/staff", icon: Users, matchPrefix: true },
      { id: "roles", label: "Rôles & permissions", href: "/admin/users", icon: UserCog, matchPrefix: true },
      { id: "pay", label: "Salaires", href: "/admin/hr", icon: Briefcase },
      { id: "attendance", label: "Présences", href: "/admin/hr", icon: CalendarDays },
      { id: "perf", label: "Performance", href: "/admin/staff", icon: BarChart3 },
    ],
  },
  {
    id: "crm",
    label: "Clients & CRM",
    items: [
      { id: "clients", label: "Clients", href: "/admin/users", icon: HeartHandshake, matchPrefix: true },
      { id: "loyalty", label: "Fidélité", href: "/admin/ai/loyalty", icon: Gift, matchPrefix: true },
      { id: "reviews", label: "Avis", href: "/admin/ai/sentiment", icon: Star, matchPrefix: true },
      { id: "cli-notif", label: "Notifications clients", href: "/admin/settings", icon: Bell },
      { id: "reco", label: "Recommandations", href: "/admin/ai/recommendations", icon: Lightbulb, matchPrefix: true },
    ],
  },
  {
    id: "intel",
    label: "Intelligence & analytics",
    items: [
      { id: "insights", label: "Insights ops", href: "/admin/insights", icon: Lightbulb, matchPrefix: true },
      { id: "menu-eng", label: "Menu engineering", href: "/admin/ai/menu-engineering", icon: UtensilsCrossed, matchPrefix: true },
      { id: "stock-ai", label: "Prévision stock", href: "/admin/ai/stock", icon: Package, matchPrefix: true },
      { id: "anom", label: "Détection anomalies", href: "/admin/ai/anomalies", icon: AlertTriangle, matchPrefix: true },
      { id: "auto", label: "Décisions automatiques", href: "/admin/ai/auto-decisions", icon: Brain, matchPrefix: true },
      { id: "reports", label: "Rapports", href: "/admin/reports", icon: FileBarChart, matchPrefix: true },
      { id: "audit", label: "Audit logs", href: "/admin/audit-log", icon: ScrollText, matchPrefix: true },
      { id: "ai-hub", label: "Centre IA", href: "/admin/ai", icon: Bot, matchPrefix: true },
      { id: "copilot", label: "Copilot ERP", href: "/admin/copilot", icon: MessageSquareText, matchPrefix: true },
      { id: "agents", label: "Observability IA", href: "/admin/agents", icon: Activity, matchPrefix: true },
      { id: "ai-memory", label: "Mémoire IA", href: "/admin/ai/memory", icon: Brain, matchPrefix: true },
      { id: "ai-journey", label: "Parcours client", href: "/admin/ai/customer-journey", icon: Users, matchPrefix: true },
      { id: "ai-upsell", label: "Upsell IA", href: "/admin/ai/upsell", icon: TrendingUp, matchPrefix: true },
      { id: "ai-rt", label: "Ops temps réel", href: "/admin/ai/realtime-ops", icon: Activity, matchPrefix: true },
      { id: "ai-learn", label: "Learning", href: "/admin/ai/learning", icon: Brain, matchPrefix: true },
      { id: "ai-planner", label: "Event planner IA", href: "/admin/ai/event-planner", icon: CalendarDays, matchPrefix: true },
      { id: "ai-vision", label: "Vision", href: "/admin/ai/vision", icon: Sparkles, matchPrefix: true },
      { id: "ai-quality", label: "Qualité", href: "/admin/ai/quality", icon: Star, matchPrefix: true },
      { id: "ai-price", label: "Pricing IA", href: "/admin/ai/pricing", icon: Percent, matchPrefix: true },
      { id: "ai-mkt", label: "Marketing IA", href: "/admin/ai/marketing", icon: Tag, matchPrefix: true },
      { id: "ai-next", label: "Next-gen", href: "/admin/ai/next-gen", icon: Sparkles, matchPrefix: true },
    ],
  },
  {
    id: "settings",
    label: "Paramètres",
    items: [
      { id: "sys", label: "Paramètres système", href: "/admin/settings", icon: Settings, matchPrefix: true },
      { id: "rest-conf", label: "Configuration restaurant", href: "/admin/settings", icon: Wrench },
      { id: "google-api", label: "Google API", href: "/admin/settings", icon: Globe },
      { id: "translate-api", label: "Traduction API", href: "/admin/settings", icon: Globe },
      { id: "ocr-api", label: "OCR API", href: "/admin/settings", icon: FileText },
      { id: "security", label: "Sécurité", href: "/admin/settings", icon: Shield },
      { id: "integrations", label: "Intégrations", href: "/admin/settings", icon: Plug },
    ],
  },
]

export function isAdminNavItemActive(pathname: string, item: AdminPortalNavItem, locationHash: string = ""): boolean {
  if (item.href.includes("#")) {
    const [base, frag] = item.href.split("#")
    const expectedHash = frag ? `#${frag}` : ""
    const pathOk =
      base === "/admin" ? pathname === "/admin" : pathname === base || pathname.startsWith(`${base}/`)
    return pathOk && locationHash === expectedHash
  }
  if (item.href === "/admin") return pathname === "/admin" && !locationHash
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }
  return pathname === item.href
}
