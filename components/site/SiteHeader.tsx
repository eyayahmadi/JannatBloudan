"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronLeft, LogOut, Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import { motion, useScroll, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"
import { SITE, SITE_DISCOVER_NAV, SITE_MAIN_NAV } from "@/lib/site-config"
import { ThemeToggle } from "@/components/site/ThemeToggle"
import { NotificationCenter } from "@/components/site/NotificationCenter"
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher"
import { useI18n } from "@/lib/i18n/context"
import { useAdminPortalOptional } from "@/components/admin/admin-portal-context"
import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole } from "@/lib/auth/roles"
import { getStaffPortalBackNav } from "@/lib/auth/staff-nav"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type SiteHeaderProps = {
  backHref?: string
  backLabel?: string
  /** Retour sans navigation (formulaires multi-étapes) */
  backOnClick?: () => void
  /** Zone centrale (ex. recherche), visible sur md+ dans la barre */
  center?: ReactNode
  /** Contenu sous la ligne principale (ex. recherche mobile) */
  bottom?: ReactNode
  trailing?: ReactNode
  /** Masquer la navigation desktop (liens Accueil, Menu…) */
  hideMainNav?: boolean
  className?: string
}

/**
 * Active si l'URL courante correspond exactement à la route OU
 * commence par cette route + "/" (sous-routes).
 * Les ancres internes (#about, #contact) ne sont actives qu'en strict equality sur "/".
 */
function isNavActive(pathname: string, href: string): boolean {
  if (href.includes("#")) return false
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function discoverGroupActive(pathname: string): boolean {
  return SITE_DISCOVER_NAV.some((i) => isNavActive(pathname, i.href))
}

function isAdminDashboardBackTarget(href: string | undefined): boolean {
  if (!href) return false
  const raw = href.split("?")[0]?.split("#")[0] ?? ""
  const n = raw.replace(/\/$/, "") || "/"
  return n === "/admin"
}

export function SiteHeader({
  backHref,
  backLabel,
  backOnClick,
  center,
  bottom,
  trailing,
  hideMainNav = false,
  className,
}: SiteHeaderProps) {
  const pathname = usePathname()
  const adminPortal = useAdminPortalOptional()
  const [open, setOpen] = useState(false)
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const resolvedBackLabel = backLabel ?? t("common.back", "Retour")
  const normalizedRole = user ? normalizeRole(user.role) : null
  const roleAwareBack =
    user && backHref && isAdminDashboardBackTarget(backHref) && normalizedRole !== "ADMIN"
      ? getStaffPortalBackNav(user.role, pathname)
      : null
  const effectiveBackHref = roleAwareBack?.href ?? backHref
  const effectiveBackLabel = roleAwareBack?.label ?? resolvedBackLabel

  const { scrollYProgress } = useScroll()
  const scrollProgress = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  })

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof document === "undefined") return
    const original = document.body.style.overflow
    document.body.style.overflow = open ? "hidden" : original
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  const mainNavItems = SITE_MAIN_NAV.map((item) => ({
    ...item,
    label: t(`nav.${item.key}`, item.label),
  }))
  const discoverNavItems = SITE_DISCOVER_NAV.map((item) => ({
    ...item,
    label: t(`nav.${item.key}`, item.label),
  }))

  if (adminPortal?.suppressPageHeaders) {
    return null
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/40 bg-white/75 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/55",
        className,
      )}
    >
      {/* Skip-to-content (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-[color:var(--lux-bordeaux)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--lux-gold)]"
      >
        {t("client.skipToContent", "Aller au contenu principal")}
      </a>

      {/* Barre de progression du scroll */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left"
        style={{
          scaleX: scrollProgress,
          background: "var(--lux-gradient-gold)",
        }}
      />

      <div className="site-container">
        <div className="flex h-14 items-center justify-between gap-3 sm:h-16">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {backOnClick ? (
              <button
                type="button"
                onClick={backOnClick}
                className="group flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-amber-900/85 transition hover:bg-white/80 hover:text-amber-950"
              >
                <ChevronLeft className="h-4 w-4 transition group-hover:-translate-x-0.5 rtl:rotate-180" />
                <span className="hidden sm:inline">{resolvedBackLabel}</span>
              </button>
            ) : effectiveBackHref ? (
              <Link
                href={effectiveBackHref}
                className="group flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-amber-900/85 transition hover:bg-white/80 hover:text-amber-950"
              >
                <ChevronLeft className="h-4 w-4 transition group-hover:-translate-x-0.5 rtl:rotate-180" />
                <span className="hidden sm:inline">{effectiveBackLabel}</span>
              </Link>
            ) : null}

            <Link href="/" className="group flex min-w-0 items-center gap-2.5" aria-label={SITE.name}>
              <div
                className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md ring-2 ring-white/60 transition group-hover:scale-[1.04] group-hover:shadow-lg sm:h-10 sm:w-10"
                style={{ background: "var(--lux-gradient-ink)" }}
              >
                <BloudanLogoMark withPhotoBack />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate font-display text-sm font-semibold tracking-tight text-amber-950 sm:text-base">
                  {SITE.name}
                </p>
                <p className="hidden truncate text-[10px] font-medium uppercase tracking-[0.2em] text-amber-800/65 sm:block">
                  {SITE.tagline}
                </p>
              </div>
            </Link>
          </div>

          {center ? (
            <div className="mx-2 hidden min-w-0 max-w-xl flex-1 md:block lg:max-w-md xl:max-w-xl">{center}</div>
          ) : null}

          <nav className="hidden items-center gap-4 xl:gap-6 lg:flex" aria-label={t("client.navLabel", "Navigation")}>
            {!hideMainNav ? (
              <>
                {mainNavItems
                  .filter((item) => item.key === "home")
                  .map((item) => {
                    const active = isNavActive(pathname, item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative rounded-full px-3.5 py-2 text-sm font-medium transition",
                          active
                            ? "text-amber-950"
                            : "text-amber-900/75 hover:bg-white/70 hover:text-amber-950",
                        )}
                      >
                        {item.label}
                        {active ? (
                          <motion.span
                            layoutId="siteheader-underline"
                            className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full"
                            style={{ background: "var(--lux-gradient-gold)" }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        ) : null}
                      </Link>
                    )
                  })}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium outline-none transition",
                      discoverGroupActive(pathname)
                        ? "text-amber-950"
                        : "text-amber-900/75 hover:bg-white/70 hover:text-amber-950",
                    )}
                    aria-label={t("nav.discover", "Découvrir")}
                  >
                    {t("nav.discover", "Découvrir")}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6} className="min-w-[12rem] rounded-xl p-1.5">
                    {discoverNavItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild className="cursor-pointer rounded-lg px-2.5 py-2">
                        <Link href={item.href} className="font-medium">
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {mainNavItems
                  .filter((item) => item.key !== "home")
                  .map((item) => {
                    const active = isNavActive(pathname, item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative rounded-full px-3.5 py-2 text-sm font-medium transition",
                          active
                            ? "text-amber-950"
                            : "text-amber-900/75 hover:bg-white/70 hover:text-amber-950",
                        )}
                      >
                        {item.label}
                        {active ? (
                          <motion.span
                            layoutId="siteheader-underline"
                            className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full"
                            style={{ background: "var(--lux-gradient-gold)" }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        ) : null}
                      </Link>
                    )
                  })}
              </>
            ) : null}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <NotificationCenter />
            <ThemeToggle />
            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--lux-gold)]/25 bg-white/90 text-amber-900 shadow-sm backdrop-blur-sm transition hover:border-[color:var(--lux-gold)]/40 hover:bg-white hover:shadow-md dark:border-[color:var(--lux-gold)]/30 dark:bg-zinc-900/90 dark:text-amber-200 dark:hover:bg-zinc-900"
                aria-label={t("auth.logout", "Déconnexion")}
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            {trailing}
            {!hideMainNav ? (
              <button
                type="button"
                className="rounded-xl p-2 text-amber-950 transition hover:bg-white/70 lg:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label={open ? t("common.close", "Fermer") : t("client.openMenu", "Ouvrir le menu")}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            ) : null}
          </div>
        </div>

        {open && !hideMainNav ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-amber-200/40 py-3 lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {mainNavItems
                .filter((item) => item.key === "home")
                .map((item) => {
                  const active = isNavActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-[color:var(--lux-gold)]/15 text-amber-950"
                          : "text-amber-950 hover:bg-white/80",
                      )}
                    >
                      <span>{item.label}</span>
                      {active ? (
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: "var(--lux-gradient-gold)" }}
                        />
                      ) : null}
                    </Link>
                  )
                })}
              <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800/60">
                {t("nav.discover", "Découvrir")}
              </p>
              {discoverNavItems.map((item) => {
                const active = isNavActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-[color:var(--lux-gold)]/15 text-amber-950"
                        : "text-amber-950 hover:bg-white/80",
                    )}
                  >
                    <span>{item.label}</span>
                    {active ? (
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--lux-gradient-gold)" }}
                      />
                    ) : null}
                  </Link>
                )
              })}
              {mainNavItems
                .filter((item) => item.key !== "home")
                .map((item) => {
                  const active = isNavActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-[color:var(--lux-gold)]/15 text-amber-950"
                          : "text-amber-950 hover:bg-white/80",
                      )}
                    >
                      <span>{item.label}</span>
                      {active ? (
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: "var(--lux-gradient-gold)" }}
                        />
                      ) : null}
                    </Link>
                  )
                })}
            </div>
          </motion.div>
        ) : null}

        {center ? (
          <div className="border-t border-amber-200/30 py-3 md:hidden">{center}</div>
        ) : null}

        {bottom ? <div className="border-t border-amber-200/30 py-3">{bottom}</div> : null}
      </div>
    </header>
  )
}
