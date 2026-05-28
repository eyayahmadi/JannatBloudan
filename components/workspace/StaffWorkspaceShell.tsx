"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { LogOut, Menu, PanelLeftClose, PanelLeft } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher"
import { NotificationCenter } from "@/components/site/NotificationCenter"
import { ThemeToggle } from "@/components/site/ThemeToggle"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole, type AppRole } from "@/lib/auth/roles"
import { workspaceNavForRole } from "@/lib/nav/role-workspace-nav"

export type StaffWorkspaceShellProps = {
  children: ReactNode
  /** Surcharge du rôle pour la navigation (sinon dérivé de la session) */
  navRole?: AppRole
  title?: string
  subtitle?: string
}

export function StaffWorkspaceShell({ children, navRole, title, subtitle }: StaffWorkspaceShellProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = navRole ?? (user ? normalizeRole(user.role) : "CLIENT")
  const items = useMemo(() => workspaceNavForRole(role), [role])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const renderNav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-0.5 p-2" aria-label="Navigation espace équipe">
      {items.map((item) => {
        const Icon = item.icon
        // item.href peut contenir un query (ex. "/caisse?tab=tables") :
        // on isole le pathname et l'éventuel ?tab= pour comparer correctement.
        const [itemPath, itemQuery = ""] = item.href.split("?")
        const itemTab = new URLSearchParams(itemQuery).get("tab")
        const currentTab = searchParams?.get("tab") ?? null
        const samePath = pathname === itemPath || pathname.startsWith(`${itemPath}/`)
        const active = samePath && (itemTab ? currentTab === itemTab : true)
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/45",
              active
                ? "bg-[color:var(--lux-bordeaux)]/14 font-semibold text-[color:var(--lux-bordeaux)] shadow-[inset_3px_0_0_0_var(--lux-gold)]"
                : "text-amber-950/90 hover:bg-[color:var(--lux-bordeaux)]/[0.06] dark:text-amber-100/85 dark:hover:bg-white/5",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? item.label : undefined}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                active
                  ? "bg-[color:var(--lux-bordeaux)]/15 text-[color:var(--lux-bordeaux)]"
                  : "bg-amber-100/70 text-amber-900/75 dark:bg-zinc-800 dark:text-amber-200/80",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.65} />
            </span>
            {!collapsed ? (
              <span className="min-w-0 flex-1 leading-snug">
                {item.label}
                {item.hint ? (
                  <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-wide text-amber-900/45">
                    {item.hint}
                  </span>
                ) : null}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen min-h-dvh w-full bg-[color:var(--lux-cream)]/80 dark:bg-neutral-950">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-[color:var(--lux-bordeaux)]/10 bg-gradient-to-b from-[color:var(--lux-cream)] via-white to-[color:var(--lux-sand)]/30 md:flex md:flex-col",
          collapsed ? "md:w-[4.5rem]" : "md:w-60 lg:w-64",
        )}
      >
        <div className="flex items-center gap-2 border-b border-amber-900/10 px-3 py-3">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2" aria-label="Accueil">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md ring-2 ring-white/60"
              style={{ background: "var(--lux-gradient-ink)" }}
            >
              <BloudanLogoMark className="h-6 w-6" />
            </span>
            {!collapsed ? (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--lux-bordeaux)]">
                  Équipe
                </p>
                <p className="truncate text-[11px] text-amber-900/55">{role}</p>
              </div>
            ) : null}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 shrink-0 md:inline-flex"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Étendre le menu" : "Réduire le menu"}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
        <ScrollArea className="flex-1">{renderNav()}</ScrollArea>
        {user ? (
          <div className="border-t border-amber-900/10 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => void logout()}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed ? <span>Déconnexion</span> : null}
            </Button>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-[color:var(--lux-bordeaux)]/10 bg-white/85 backdrop-blur-md dark:bg-neutral-900/90">
          <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:px-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="md:hidden">
                  <Menu className="mr-2 h-4 w-4" />
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(20rem,90vw)] p-0">
                <SheetHeader className="border-b border-amber-900/10 px-4 py-3 text-left">
                  <SheetTitle className="font-display text-base">Espace équipe</SheetTitle>
                  <p className="text-xs text-amber-900/55">{role}</p>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-5rem)]">{renderNav(closeMobile)}</ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              {title ? (
                <h1 className="truncate font-display text-base font-semibold text-amber-950 dark:text-amber-100 sm:text-lg">
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="truncate text-xs text-amber-900/60 dark:text-amber-200/55">{subtitle}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <NotificationCenter />
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}
