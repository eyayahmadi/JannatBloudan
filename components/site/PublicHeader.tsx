"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion"
import {
  ChevronDown,
  LogIn,
  LogOut,
  Menu as MenuIcon,
  ShoppingBag,
  User2,
  UserPlus,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SITE, SITE_DISCOVER_NAV, SITE_MAIN_NAV } from "@/lib/site-config"
import { useAuth } from "@/lib/context/AuthContext"
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher"
import { ThemeToggle } from "@/components/site/ThemeToggle"
import { useI18n } from "@/lib/i18n/context"
import { dashboardPathForRole, normalizeRole } from "@/lib/auth/roles"
import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"
import { PromoBanner } from "@/components/site/PromoBanner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Active si l'URL courante correspond exactement à la route de l'item, OU
 * commence par cette route + "/" (pour matcher les sous-routes).
 * Les ancres internes (#about, #contact) ne sont actives qu'en strict equality
 * sur la racine "/".
 */
function isNavActive(pathname: string, href: string): boolean {
  if (href.includes("#")) return false
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function discoverGroupActive(pathname: string): boolean {
  return SITE_DISCOVER_NAV.some((i) => isNavActive(pathname, i.href))
}

/**
 * En-tête public épuré.
 * N'expose PAS les interfaces internes (admin, kitchen, bar…).
 * Affiche un menu "Mon compte" : Connexion / Créer un compte,
 * ou Profil / Mon espace / Déconnexion si l'utilisateur est connecté.
 */
export function PublicHeader() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const { scrollYProgress } = useScroll()
  const reduceMotion = useReducedMotion()
  const scrollProgress = useSpring(scrollYProgress, {
    stiffness: reduceMotion ? 900 : 200,
    damping: reduceMotion ? 80 : 30,
    restDelta: 0.001,
  })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof document === "undefined") return
    const original = document.body.style.overflow
    document.body.style.overflow = mobileOpen ? "hidden" : original
    return () => {
      document.body.style.overflow = original
    }
  }, [mobileOpen])

  const dashHref = user ? dashboardPathForRole(normalizeRole(user.role)) : "/account"

  const mainNavItems = SITE_MAIN_NAV.map((i) => ({
    ...i,
    label: t(`nav.${i.key}`, i.label),
  }))
  const discoverNavItems = SITE_DISCOVER_NAV.map((i) => ({
    ...i,
    label: t(`nav.${i.key}`, i.label),
  }))

  return (
    <>
      <PromoBanner context="all" />
      <header className="sticky top-0 z-50 px-6 pb-2 pt-3 transition-colors duration-500 ease-out motion-reduce:duration-150 lg:pb-4 lg:pt-5">
      {/* Skip to content link (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[color:var(--lux-bordeaux)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--lux-gold)]"
      >
        {t("client.skipToContent", "Aller au contenu principal")}
      </a>

      <div
        className={cn(
          "relative mx-auto flex max-h-[calc(100vh-1.5rem)] w-full max-w-[1200px] flex-col overflow-hidden rounded-[20px] border transition-[box-shadow,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-150",
          "border-[color:var(--lux-gold)]/24 bg-[color:var(--lux-cream)]/[0.58] shadow-[0_16px_48px_-32px_rgba(26,20,16,0.42),inset_0_1px_0_0_rgba(255,253,247,0.76)] backdrop-blur-2xl backdrop-saturate-[1.08]",
          "dark:border-[color:var(--lux-gold)]/16 dark:bg-zinc-950/48 dark:shadow-[0_26px_64px_-40px_rgba(0,0,0,0.68),inset_0_1px_0_0_rgba(217,183,106,0.07)] dark:backdrop-blur-xl dark:backdrop-saturate-[1.05]",
          scrolled &&
            "border-[color:var(--lux-gold)]/42 shadow-[0_28px_80px_-40px_rgba(110,29,43,0.43),inset_0_1px_0_0_rgba(255,253,247,0.92)] ring-1 ring-[color:var(--lux-gold)]/18 backdrop-saturate-[1.32] dark:ring-[color:var(--lux-gold)]/12 dark:backdrop-saturate-[1.18]",
          !scrolled && "shadow-[0_12px_40px_-34px_rgba(26,20,16,0.28)]",
        )}
      >
        {/* Barre de progression du scroll — bord inférieur du verre */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[2.5px] origin-left rounded-b-[20px] motion-reduce:transition-none"
          style={{
            scaleX: reduceMotion ? scrollYProgress : scrollProgress,
            background: "linear-gradient(90deg, color-mix(in srgb, var(--lux-bordeaux) 45%, transparent), var(--lux-gold), color-mix(in srgb, var(--lux-bordeaux) 35%, var(--lux-gold)))",
          }}
        />

        <div className="relative z-[2] flex h-14 items-center justify-between gap-3 px-4 py-2.5 sm:h-[4.375rem] sm:gap-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-cream)] dark:focus-visible:ring-offset-zinc-950"
          aria-label={SITE.name}
        >
          <div
            className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl shadow-[0_10px_30px_-12px_rgba(201,162,76,0.55)] ring-2 ring-[color:var(--lux-gold)]/40 transition duration-300 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100 sm:h-12 sm:w-12"
            style={{ background: "var(--lux-gradient-ink)" }}
          >
            <BloudanLogoMark withPhotoBack />
            <span className="aurora-ring" aria-hidden />
          </div>
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="font-display text-base font-semibold tracking-tight text-amber-950">
              {SITE.name}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-amber-800/70">
              {t("landing.footer.tagline")}
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-4 xl:gap-6 lg:flex"
          aria-label={t("client.navLabel")}
        >
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
                    "relative rounded-full px-4 py-2.5 text-sm font-medium outline-none transition-colors duration-200",
                    "md:hover:-translate-y-px md:hover:bg-[color:var(--lux-gold)]/10 motion-reduce:md:hover:translate-y-0",
                    "focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-cream)] dark:focus-visible:ring-offset-zinc-950",
                    active
                      ? "text-amber-950"
                      : "text-amber-900/85 hover:text-amber-950",
                  )}
                >
                  {item.label}
                  {active ? (
                    <motion.span
                      layoutId="pubnav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full motion-reduce:!transition-colors"
                      style={{ background: "var(--lux-gradient-gold)" }}
                      transition={
                        reduceMotion
                          ? { duration: 0.14, ease: "easeOut" }
                          : { type: "spring", stiffness: 400, damping: 30 }
                      }
                    />
                  ) : null}
                </Link>
              )
            })}

          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                "relative inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium outline-none transition-colors duration-200",
                "md:hover:-translate-y-px md:hover:bg-[color:var(--lux-gold)]/10 motion-reduce:md:hover:translate-y-0",
                "focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-cream)] dark:focus-visible:ring-offset-zinc-950",
                discoverGroupActive(pathname)
                  ? "text-amber-950"
                  : "text-amber-900/85 hover:text-amber-950",
              )}
              aria-label={t("nav.discover", "Découvrir")}
            >
              {t("nav.discover", "Découvrir")}
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={8}
              className={cn(
                "z-[200] min-w-[12rem] rounded-xl border border-[color:var(--lux-gold)]/22 bg-[color:var(--lux-cream)]/98 p-1.5 shadow-xl backdrop-blur-xl dark:border-[color:var(--lux-gold)]/20 dark:bg-zinc-950/98",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
              )}
            >
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
              const anchorActive = isNavActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={anchorActive ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-2.5 text-sm font-medium outline-none transition-colors duration-200",
                    "md:hover:-translate-y-px md:hover:bg-[color:var(--lux-gold)]/10 motion-reduce:md:hover:translate-y-0",
                    "focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-cream)] dark:focus-visible:ring-offset-zinc-950",
                    anchorActive
                      ? "text-amber-950"
                      : "text-amber-900/85 hover:text-amber-950",
                  )}
                >
                  {item.label}
                  {anchorActive ? (
                    <motion.span
                      layoutId="pubnav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full motion-reduce:!transition-colors"
                      style={{ background: "var(--lux-gradient-gold)" }}
                      transition={
                        reduceMotion
                          ? { duration: 0.14, ease: "easeOut" }
                          : { type: "spring", stiffness: 400, damping: 30 }
                      }
                    />
                  ) : null}
                </Link>
              )
            })}
        </nav>

        {/* Actions — hauteur pill unifiée (h-9), menus en portail */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                "hidden h-9 items-center gap-2 rounded-full border border-[color:var(--lux-gold)]/25 bg-white/90 px-3 text-sm font-medium text-amber-950 shadow-sm outline-none transition",
                "hover:border-[color:var(--lux-gold)]/45 hover:bg-white hover:shadow-md",
                "focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-cream)] dark:border-[color:var(--lux-gold)]/30 dark:bg-zinc-900/90 dark:text-amber-50 dark:hover:bg-zinc-900 dark:focus-visible:ring-offset-zinc-950",
                "md:inline-flex",
              )}
              aria-label={t("nav.account", "Compte")}
            >
              <User2 className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span>{t("nav.account", "Compte")}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className={cn(
                "z-[200] w-[17rem] rounded-xl border border-[color:var(--lux-gold)]/22 bg-[color:var(--lux-cream)]/98 p-1.5 shadow-xl backdrop-blur-xl dark:border-[color:var(--lux-gold)]/20 dark:bg-zinc-950/98",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
              )}
            >
              {isAuthenticated && user ? (
                <>
                  <DropdownMenuLabel className="px-2 py-2 font-normal">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("client.connectedAs")}
                    </p>
                    <p className="mt-1 truncate font-display text-sm font-semibold text-amber-950 dark:text-amber-50">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[color:var(--lux-gold)]/15" />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2.5 py-2">
                    <Link href={dashHref} className="flex items-center gap-2 font-medium">
                      <User2 className="h-4 w-4 shrink-0" aria-hidden />
                      {t("client.mySpace")}
                    </Link>
                  </DropdownMenuItem>
                  {!["ADMIN", "SERVER", "KITCHEN", "BAR", "SHISHA", "CASHIER", "DELIVERY"].includes(normalizeRole(user.role)) ? (
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2.5 py-2">
                      <Link href="/account/history" className="flex items-center gap-2 font-medium">
                        <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
                        {t("client.myOrders")}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator className="bg-[color:var(--lux-gold)]/15" />
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer rounded-lg px-2.5 py-2"
                    onSelect={() => {
                      void logout()
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("client.signOut")}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2.5 py-2 focus:bg-[color:var(--lux-gold)]/12">
                    <Link href="/login" className="flex items-center gap-2 font-medium">
                      <LogIn className="h-4 w-4 shrink-0" aria-hidden />
                      {t("client.signIn")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2.5 py-2 focus:bg-[color:var(--lux-gold)]/12">
                    <Link href="/signup" className="flex items-center gap-2 font-medium">
                      <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                      {t("client.createAccount")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[color:var(--lux-gold)]/15" />
                  <p className="px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">{t("client.accountHint")}</p>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary CTA */}
          <Button
            asChild
            variant="gold"
            size="headerGold"
            className="group relative hidden overflow-hidden text-[color:var(--lux-ink)] shadow-[0_14px_40px_-18px_rgba(201,162,76,0.72)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_-24px_rgba(201,162,76,0.78)] hover:scale-[1.03] motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 active:translate-y-0 active:scale-[1] focus-within:outline-none focus-within:ring-2 focus-within:ring-[color:var(--lux-gold)]/40 focus-within:ring-offset-2 focus-within:ring-offset-[color:var(--lux-cream)] dark:focus-within:ring-offset-zinc-950 md:inline-flex [&>a]:rounded-full [&>a]:outline-none [&>a]:focus-visible:ring-2 [&>a]:focus-visible:ring-[color:var(--lux-gold)]/55 [&>a]:focus-visible:ring-offset-2 [&>a]:focus-visible:ring-offset-[color:var(--lux-cream)] dark:[&>a]:focus-visible:ring-offset-zinc-950"
          >
            <Link href="/delivery">
              <ShoppingBag className="h-4 w-4" />
              <span>{t("client.orderCta")}</span>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-[transform] duration-[1350ms] ease-out motion-reduce:duration-0 motion-reduce:transition-none group-hover:translate-x-[120%] motion-reduce:group-hover:translate-x-[-120%]"
              />
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              "shrink-0 rounded-full shadow-[0_10px_30px_-16px_rgba(110,29,43,0.38)] outline-none lg:hidden",
              "border border-[color:var(--lux-gold)]/25 bg-gradient-to-br from-white/95 to-[color:var(--lux-cream)]/90 text-amber-950 transition-all duration-300",
              "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(201,162,76,0.45)] hover:scale-[1.04] motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 dark:from-zinc-900 dark:to-zinc-950 dark:text-amber-100",
              "active:scale-[0.98] motion-reduce:active:scale-100",
              "focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-cream)] dark:focus-visible:ring-offset-zinc-950",
            )}
            aria-label={t("client.openMenu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-[color:var(--lux-gold)]/22 bg-[color:var(--lux-cream)]/92 backdrop-blur-2xl dark:border-[color:var(--lux-gold)]/18 dark:bg-zinc-950/88 lg:hidden"
          >
            <div className="site-container flex flex-col gap-1 py-4">
              {mainNavItems
                .filter((item) => item.key === "home")
                .map((item) => {
                  const active = isNavActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition",
                        active
                          ? "bg-[color:var(--lux-gold)]/15 text-amber-950"
                          : "text-amber-950 hover:bg-[color:var(--lux-cream)]",
                        "focus-visible:bg-[color:var(--lux-gold)]/12 focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40",
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
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition",
                      active
                        ? "bg-[color:var(--lux-gold)]/15 text-amber-950"
                        : "text-amber-950 hover:bg-[color:var(--lux-cream)]",
                      "focus-visible:bg-[color:var(--lux-gold)]/12 focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40",
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
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition",
                        active
                          ? "bg-[color:var(--lux-gold)]/15 text-amber-950"
                          : "text-amber-950 hover:bg-[color:var(--lux-cream)]",
                        "focus-visible:bg-[color:var(--lux-gold)]/12 focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40",
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
              <div className="my-2 hairline-gold" />
              {isAuthenticated && user ? (
                <>
                  <Link
                    href={dashHref}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition text-amber-950 hover:bg-[color:var(--lux-cream)] focus-visible:bg-[color:var(--lux-gold)]/12 focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40"
                  >
                    <User2 className="h-4 w-4" />
                    {t("client.mySpace")}
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileOpen(false)
                      await logout()
                    }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400/50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("client.signOut")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-950 outline-none transition hover:bg-[color:var(--lux-gold)]/14 focus-visible:bg-[color:var(--lux-gold)]/12 focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40"
                  >
                    <LogIn className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    {t("client.signIn")}
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-950 outline-none transition hover:bg-[color:var(--lux-gold)]/14 focus-visible:bg-[color:var(--lux-gold)]/12 focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40"
                  >
                    <UserPlus className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    {t("client.createAccount")}
                  </Link>
                </>
              )}
              <Button
                asChild
                variant="gold"
                size="pill"
                className="mt-2 w-full text-[color:var(--lux-ink)]"
              >
                <Link href="/delivery" onClick={() => setMobileOpen(false)} className="w-full justify-center text-[color:var(--lux-ink)]">
                  <ShoppingBag className="h-4 w-4" />
                  {t("client.orderNow")}
                </Link>
              </Button>
              <div className="flex items-center justify-center gap-2 pt-3">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
    </>
  )
}

