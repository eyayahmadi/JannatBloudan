"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion"
import {
  ChevronDown,
  LogOut,
  Menu as MenuIcon,
  ShoppingBag,
  User2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SITE, SITE_NAV } from "@/lib/site-config"
import { useAuth } from "@/lib/context/AuthContext"
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher"
import { ThemeToggle } from "@/components/site/ThemeToggle"
import { useI18n } from "@/lib/i18n/context"
import { dashboardPathForRole, normalizeRole } from "@/lib/auth/roles"
import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"

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
  const [accountOpen, setAccountOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

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
    setAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof document === "undefined") return
    const original = document.body.style.overflow
    document.body.style.overflow = mobileOpen ? "hidden" : original
    return () => {
      document.body.style.overflow = original
    }
  }, [mobileOpen])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!accountRef.current) return
      if (!accountRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const dashHref = user ? dashboardPathForRole(normalizeRole(user.role)) : "/account"

  const navItems = SITE_NAV.map((i) => ({
    ...i,
    label: t(`nav.${i.key}`, i.label),
  }))

  return (
    <header className="sticky top-0 z-50 px-3 pb-2 pt-3 transition-colors duration-500 ease-out motion-reduce:duration-150 sm:px-5 lg:pb-4 lg:pt-5">
      {/* Skip to content link (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[color:var(--lux-bordeaux)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--lux-gold)]"
      >
        {t("client.skipToContent", "Aller au contenu principal")}
      </a>

      <div
        className={cn(
          "relative mx-auto flex max-h-[calc(100vh-1.5rem)] max-w-7xl flex-col overflow-hidden rounded-[20px] border transition-[box-shadow,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-150",
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
          className="hidden items-center gap-1 lg:flex"
          aria-label={t("client.navLabel")}
        >
          {navItems.map((item) => {
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
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="hidden rounded-full bg-gradient-to-br from-white/92 to-[color:var(--lux-cream)]/75 p-1 shadow-[inset_0_1px_0_0_rgba(255,253,247,0.92)] ring-1 ring-[color:var(--lux-gold)]/18 backdrop-blur-md dark:from-zinc-900/90 dark:to-zinc-950/85 dark:ring-[color:var(--lux-gold)]/22 md:flex md:items-center md:gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* Account menu */}
          <div className="relative" ref={accountRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAccountOpen((v) => !v)}
              className={cn(
                "group hidden h-11 min-h-11 gap-2 rounded-full border-0 px-5 font-semibold text-[color:var(--lux-ink)] shadow-[0_10px_32px_-16px_rgba(201,162,76,0.55)] transition-all duration-300 md:inline-flex",
                "bg-gradient-to-r from-[color:var(--lux-gold)] via-amber-200/95 to-[color:var(--lux-gold)]",
                "ring-2 ring-transparent ring-offset-2 ring-offset-[color:var(--lux-cream)] dark:ring-offset-zinc-950",
                "hover:-translate-y-0.5 hover:shadow-[0_18px_48px_-20px_rgba(201,162,76,0.65)] hover:brightness-[1.02] hover:scale-[1.03] active:translate-y-0 active:scale-[1]",
                "motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/70 focus-visible:ring-offset-[3px] focus-visible:ring-offset-[color:var(--lux-cream)] dark:focus-visible:ring-offset-zinc-950",
              )}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
            >
              <span className="text-base opacity-95" aria-hidden>
                👤
              </span>
              <User2 className="h-4 w-4 opacity-90" aria-hidden />
              <span className="hidden lg:inline">
                {isAuthenticated && user
                  ? (user.firstName || t("nav.account", "Mon compte"))
                  : t("nav.account", "Mon compte")}
              </span>
              <motion.span
                layout
                className="inline-flex shrink-0"
                aria-hidden
                animate={{ rotate: accountOpen ? 180 : 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0.12, ease: "easeOut" }
                    : { type: "spring", stiffness: 360, damping: 32 }
                }
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </Button>

            <AnimatePresence>
              {accountOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={
                    reduceMotion
                      ? { duration: 0.08 }
                      : { duration: 0.24, ease: [0.16, 1, 0.3, 1] }
                  }
                  className="absolute right-0 top-[calc(100%+12px)] z-50 w-[17rem] overflow-hidden rounded-2xl border border-[color:var(--lux-gold)]/28 bg-[color:var(--lux-cream)]/97 p-2 shadow-[0_32px_80px_-38px_rgba(26,20,16,0.62)] backdrop-blur-2xl dark:border-[color:var(--lux-gold)]/22 dark:bg-zinc-950/94"
                  role="menu"
                >
                  {isAuthenticated && user ? (
                    <>
                      <div className="rounded-xl bg-gradient-to-br from-[color:var(--lux-cream)] to-white px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800/70">
                          {t("client.connectedAs")}
                        </p>
                        <p className="mt-1 truncate font-display text-base font-semibold text-amber-950">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="truncate text-xs text-amber-900/70">{user.email}</p>
                      </div>
                      <div className="my-2 hairline-gold" />
                      <AccountMenuLink href={dashHref} icon={<User2 className="h-4 w-4" />} onClick={() => setAccountOpen(false)}>
                        {t("client.mySpace")}
                      </AccountMenuLink>
                      {!["ADMIN","SERVER","KITCHEN","BAR","SHISHA","CASHIER","DELIVERY"].includes(normalizeRole(user.role)) ? (
                        <>
                          <AccountMenuLink href="/account/history" icon={<ShoppingBag className="h-4 w-4" />} onClick={() => setAccountOpen(false)}>
                            {t("client.myOrders")}
                          </AccountMenuLink>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={async () => {
                          setAccountOpen(false)
                          await logout()
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-700 outline-none transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400/50"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("client.signOut")}
                      </button>
                    </>
                  ) : (
                    <>
                      <AccountMenuLink href="/login" icon={<span className="text-lg leading-none">🔐</span>} onClick={() => setAccountOpen(false)} emphasis>
                        {t("client.signIn")}
                      </AccountMenuLink>
                      <AccountMenuLink href="/login?mode=signup" icon={<span className="text-lg leading-none">✨</span>} onClick={() => setAccountOpen(false)}>
                        {t("client.createAccount")}
                      </AccountMenuLink>
                      <div className="my-1 hairline-gold" />
                      <p className="px-3 py-1 text-[11px] text-amber-900/70">
                        {t("client.accountHint")}
                      </p>
                    </>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

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
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
              {navItems.map((item) => {
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
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-950 outline-none transition hover:bg-[color:var(--lux-gold)]/14 active:scale-[0.99] motion-reduce:active:scale-100 focus-visible:bg-[color:var(--lux-gold)]/12 focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40"
                  >
                    <span className="text-lg" aria-hidden>
                      🔐
                    </span>
                    {t("client.signIn")}
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-950 outline-none transition hover:bg-[color:var(--lux-gold)]/14 active:scale-[0.99] motion-reduce:active:scale-100 focus-visible:bg-[color:var(--lux-gold)]/12 focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/40"
                  >
                    <span className="text-lg" aria-hidden>
                      ✨
                    </span>
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
  )
}

function AccountMenuLink({
  href,
  icon,
  children,
  emphasis = false,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  emphasis?: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors duration-200",
        "hover:bg-[color:var(--lux-gold)]/12 active:scale-[0.99] motion-reduce:active:scale-100",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-cream)] dark:focus-visible:ring-offset-zinc-950",
        emphasis
          ? "text-[color:var(--lux-ink)] shadow-[inset_0_1px_0_0_rgba(255,253,247,0.55)] dark:text-amber-50"
          : "text-amber-950 hover:bg-[color:var(--lux-cream)] dark:text-slate-100 dark:hover:bg-zinc-800/90",
      )}
      style={
        emphasis
          ? {
              background:
                "linear-gradient(115deg, color-mix(in srgb, var(--lux-gold) 24%, white) 0%, color-mix(in srgb, var(--lux-gold) 10%, white) 100%)",
            }
          : undefined
      }
      role="menuitem"
    >
      <span className="transition duration-200 group-hover:scale-110 motion-reduce:group-hover:scale-100">{icon}</span>
      {children}
    </Link>
  )
}
