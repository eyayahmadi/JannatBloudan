"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeft } from "lucide-react"
import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher"
import { NotificationCenter } from "@/components/site/NotificationCenter"
import { ThemeToggle } from "@/components/site/ThemeToggle"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  AdminPortalProvider,
  type AdminDashboardPeriod,
} from "@/components/admin/admin-portal-context"
import { ADMIN_PORTAL_NAV, isAdminNavItemActive } from "@/components/admin/admin-portal-nav"
import { useAuth } from "@/lib/context/AuthContext"
import { usePurchaseNotifications } from "@/lib/hooks/usePurchaseNotifications"
import { useI18n } from "@/lib/i18n/context"

const PERIOD_IDS: AdminDashboardPeriod[] = ["today", "week", "month"]

function NavGroups({
  onNavigate,
  collapsedGroups,
  toggleGroup,
  locationHash,
}: {
  onNavigate?: () => void
  collapsedGroups: Record<string, boolean>
  toggleGroup: (id: string) => void
  locationHash: string
}) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <nav className="flex flex-col gap-1 p-2" aria-label={t("admin.shell.navAriaLabel", "Modules administration")}>
      {ADMIN_PORTAL_NAV.map((group) => {
        const collapsed = collapsedGroups[group.id]
        return (
          <div key={group.id} className="rounded-xl border border-amber-900/8 bg-white/40 dark:bg-zinc-900/30">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-amber-900/55 transition hover:text-amber-950 dark:text-amber-200/55 dark:hover:text-amber-100"
              aria-expanded={!collapsed}
            >
              {t(`admin.nav.groups.${group.id}`, group.label)}
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 transition-transform", collapsed ? "-rotate-90" : "rotate-0")}
              />
            </button>
            {!collapsed ? (
              <ul className="space-y-0.5 border-t border-amber-900/8 px-1.5 pb-2 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isAdminNavItemActive(pathname, item, locationHash)
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => onNavigate?.()}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/45",
                          active
                            ? "bg-[color:var(--lux-bordeaux)]/12 font-semibold text-[color:var(--lux-bordeaux)] shadow-[inset_3px_0_0_0_var(--lux-gold)]"
                            : "text-amber-950/90 hover:bg-[color:var(--lux-bordeaux)]/[0.06] dark:text-amber-100/85 dark:hover:bg-white/5",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            active
                              ? "bg-[color:var(--lux-bordeaux)]/15 text-[color:var(--lux-bordeaux)]"
                              : "bg-amber-100/70 text-amber-900/75 dark:bg-zinc-800 dark:text-amber-200/80",
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={1.65} />
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">
                          {t(`admin.nav.items.${item.id}`, item.label)}
                        </span>
                        {item.badge === "new" ? (
                          <span className="rounded-full bg-[color:var(--lux-gold)]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[color:var(--lux-bordeaux)]">
                            {t("admin.shell.badgeNew", "New")}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

export function AdminPortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { t } = useI18n()
  const [locationHash, setLocationHash] = useState("")
  const [dashboardPeriod, setDashboardPeriod] = useState<AdminDashboardPeriod>("today")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const g of ADMIN_PORTAL_NAV) init[g.id] = false
    return init
  })

  const toggleGroup = useCallback((id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  // Pousse les digests « achats à prévoir » dans le centre de notifications.
  usePurchaseNotifications()

  const portalValue = useMemo(
    () => ({
      suppressPageChrome: true,
      suppressPageHeaders: true,
      dashboardPeriod,
      setDashboardPeriod,
    }),
    [dashboardPeriod],
  )

  const isDashboard = pathname === "/admin"

  useEffect(() => {
    const syncHash = () => setLocationHash(typeof window !== "undefined" ? window.location.hash : "")
    syncHash()
    window.addEventListener("hashchange", syncHash)
    return () => window.removeEventListener("hashchange", syncHash)
  }, [pathname])

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return
    const id = window.location.hash.slice(1)
    if (!id) return
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [pathname, locationHash])

  return (
    <AdminPortalProvider value={portalValue}>
      <div className="relative min-h-screen min-h-dvh mesh-page-bg grain-overlay overflow-x-hidden">
        {/* Barre supérieure ERP — toujours visible (logo, filtres, langue, notifications, thème, déconnexion) */}
        <header
          role="banner"
          className="sticky top-0 z-50 border-b border-[color:var(--lux-bordeaux)]/14 bg-[color:var(--lux-cream)]/95 shadow-[0_8px_30px_-12px_rgba(110,29,43,0.12)] backdrop-blur-md dark:border-zinc-700/50 dark:bg-zinc-950/95"
        >
          <div className="mx-auto flex min-h-[4rem] max-w-[1920px] flex-wrap items-center gap-3 px-3 py-2.5 sm:px-4 lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-xl border-[color:var(--lux-gold)]/40 lg:hidden"
                    aria-label={t("admin.shell.openMenu", "Ouvrir le menu")}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[min(22rem,92vw)] border-r border-[color:var(--lux-bordeaux)]/15 bg-gradient-to-b from-[color:var(--lux-cream)] to-white p-0 dark:from-zinc-950 dark:to-zinc-900"
                >
                  <SheetHeader className="border-b border-amber-900/10 px-4 py-4 text-left">
                    <SheetTitle className="font-display text-base text-amber-950 dark:text-amber-100">
                      {t("admin.shell.navTitle", "Navigation admin")}
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-5rem)]">
                    <NavGroups
                      onNavigate={() => setMobileOpen(false)}
                      collapsedGroups={collapsedGroups}
                      toggleGroup={toggleGroup}
                      locationHash={locationHash}
                    />
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <Link
                href="/admin"
                className="flex min-w-0 items-center gap-2.5 rounded-xl pr-2 transition hover:opacity-90"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--lux-bordeaux)]/10 ring-2 ring-[color:var(--lux-gold)]/25">
                  <BloudanLogoMark className="h-7 w-7 text-[color:var(--lux-bordeaux)]" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-amber-950 dark:text-amber-50">
                    {t("admin.shell.brandName", "Jannat Bloudan")}
                  </p>
                  <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--lux-bordeaux)] dark:text-amber-300/90">
                    {t("admin.shell.portalTitle", "Administration ERP")}
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {isDashboard ? (
                <div className="mr-1 hidden flex-wrap items-center gap-1 rounded-full border border-amber-900/10 bg-white/70 p-1 dark:border-zinc-700 dark:bg-zinc-900/80 sm:flex">
                  {PERIOD_IDS.map((id) => (
                    <Button
                      key={id}
                      type="button"
                      size="sm"
                      variant={dashboardPeriod === id ? "default" : "ghost"}
                      className={cn(
                        "h-8 rounded-full px-3 text-xs",
                        dashboardPeriod === id
                          ? "bg-[color:var(--lux-bordeaux)] text-white hover:bg-[color:var(--lux-bordeaux)]/90"
                          : "",
                      )}
                      onClick={() => setDashboardPeriod(id)}
                    >
                      {t(`admin.shell.periods.${id}`, id)}
                    </Button>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center gap-1.5 rounded-full border border-amber-900/10 bg-white/70 px-1.5 py-1 dark:border-zinc-700 dark:bg-zinc-900/80">
                <LanguageSwitcher />
                <NotificationCenter />
                <ThemeToggle />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 rounded-full border-[color:var(--lux-bordeaux)]/30 text-[color:var(--lux-bordeaux)] hover:bg-[color:var(--lux-bordeaux)]/10 dark:border-amber-200/25 dark:text-amber-100 dark:hover:bg-white/10"
                onClick={() => void logout()}
                aria-label={t("admin.shell.logout", "Déconnexion")}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{t("admin.shell.logout", "Déconnexion")}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hidden h-9 w-9 rounded-full lg:inline-flex"
                onClick={() => setSidebarCollapsed((v) => !v)}
                aria-label={
                  sidebarCollapsed
                    ? t("admin.shell.expandSidebar", "Afficher le menu latéral")
                    : t("admin.shell.collapseSidebar", "Masquer le menu latéral")
                }
              >
                {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {isDashboard ? (
            <div className="flex border-t border-amber-900/8 px-3 py-2 sm:hidden dark:border-zinc-800">
              <div className="flex w-full gap-1 rounded-full bg-white/70 p-1 dark:bg-zinc-900/80">
                {PERIOD_IDS.map((id) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={dashboardPeriod === id ? "default" : "ghost"}
                    className={cn(
                      "h-8 flex-1 rounded-full text-xs",
                      dashboardPeriod === id ? "bg-[color:var(--lux-bordeaux)] text-white" : "",
                    )}
                    onClick={() => setDashboardPeriod(id)}
                  >
                    {t(`admin.shell.periods.${id}`, id)}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </header>

        <div className="mx-auto flex max-w-[1920px]">
          <aside
            className={cn(
              "hidden shrink-0 border-r border-[color:var(--lux-bordeaux)]/10 bg-gradient-to-b from-[color:var(--lux-cream)]/80 via-white/95 to-[color:var(--lux-sand)]/20 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 lg:sticky lg:top-[var(--admin-header-h,7.25rem)] lg:flex lg:max-h-[calc(100dvh-7.25rem)] lg:flex-col",
              sidebarCollapsed ? "lg:w-0 lg:overflow-hidden lg:border-0" : "lg:w-[300px] xl:w-[320px]",
            )}
            style={{ "--admin-header-h": "7.25rem" } as React.CSSProperties}
          >
            <div className="border-b border-amber-900/10 px-4 py-3 dark:border-zinc-800">
              <p className="font-display text-sm font-semibold text-[color:var(--lux-bordeaux)]">
                {t("admin.shell.sidebarTitle", "Portail admin")}
              </p>
              <p className="text-xs text-amber-900/55 dark:text-amber-200/50">
                {t("admin.shell.sidebarSubtitle", "Modules regroupés par domaine")}
              </p>
            </div>
            <ScrollArea className="flex-1">
              <NavGroups
                collapsedGroups={collapsedGroups}
                toggleGroup={toggleGroup}
                locationHash={locationHash}
              />
            </ScrollArea>
          </aside>

          <main className="min-w-0 flex-1 px-3 py-6 sm:px-5 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </AdminPortalProvider>
  )
}
