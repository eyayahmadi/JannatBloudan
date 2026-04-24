"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
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
import { SITE, SITE_NAV } from "@/lib/site-config"
import { useAuth } from "@/lib/context/AuthContext"
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher"
import { ThemeToggle } from "@/components/site/ThemeToggle"
import { useI18n } from "@/lib/i18n/context"
import { dashboardPathForRole, normalizeRole } from "@/lib/auth/roles"
import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[color:var(--lux-cream)]/80 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(110,29,43,0.25)] border-b border-[color:var(--lux-gold)]/20"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label={SITE.name}
        >
          <div
            className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl shadow-[0_10px_30px_-12px_rgba(201,162,76,0.55)] ring-2 ring-[color:var(--lux-gold)]/40 transition duration-300 group-hover:scale-[1.04] sm:h-12 sm:w-12"
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
          className="hidden items-center gap-2.5 lg:flex"
          aria-label={t("client.navLabel")}
        >
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "text-amber-950"
                    : "text-amber-900/80 hover:text-amber-950",
                )}
              >
                {item.label}
                {active ? (
                  <motion.span
                    layoutId="pubnav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full"
                    style={{ background: "var(--lux-gradient-gold)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                ) : null}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 md:flex">
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
              className="group hidden h-9 min-h-9 rounded-full border-[color:var(--lux-gold)]/35 bg-white/70 font-medium text-amber-950 backdrop-blur-md hover:border-[color:var(--lux-gold)]/70 hover:bg-white md:inline-flex"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
            >
              <User2 className="h-4 w-4" />
              <span className="hidden lg:inline">
                {isAuthenticated && user
                  ? (user.firstName || t("nav.account", "Mon compte"))
                  : t("nav.account", "Mon compte")}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition duration-300",
                  accountOpen && "rotate-180",
                )}
              />
            </Button>

            <AnimatePresence>
              {accountOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                  className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-[color:var(--lux-gold)]/30 bg-white/95 p-2 shadow-[0_24px_60px_-22px_rgba(26,20,16,0.45)] backdrop-blur-xl"
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
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("client.signOut")}
                      </button>
                    </>
                  ) : (
                    <>
                      <AccountMenuLink href="/login" icon={<LogIn className="h-4 w-4" />} onClick={() => setAccountOpen(false)} emphasis>
                        {t("client.signIn")}
                      </AccountMenuLink>
                      <AccountMenuLink href="/login?mode=signup" icon={<UserPlus className="h-4 w-4" />} onClick={() => setAccountOpen(false)}>
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
            className="group relative hidden overflow-hidden text-[color:var(--lux-ink)] shadow-[0_12px_30px_-14px_rgba(201,162,76,0.7)] transition hover:-translate-y-0.5 md:inline-flex"
          >
            <Link href="/delivery">
              <ShoppingBag className="h-4 w-4" />
              <span>{t("client.orderCta")}</span>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/50 to-transparent transition duration-700 group-hover:translate-x-[120%]"
              />
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((v) => !v)}
            className="shrink-0 text-amber-950 lg:hidden"
            aria-label={t("client.openMenu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-[color:var(--lux-gold)]/25 bg-white/90 backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-amber-950 hover:bg-[color:var(--lux-cream)]"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 hairline-gold" />
              {isAuthenticated && user ? (
                <>
                  <Link
                    href={dashHref}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-950 hover:bg-[color:var(--lux-cream)]"
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
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
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
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-950 hover:bg-[color:var(--lux-cream)]"
                  >
                    <LogIn className="h-4 w-4" />
                    {t("client.signIn")}
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-950 hover:bg-[color:var(--lux-cream)]"
                  >
                    <UserPlus className="h-4 w-4" />
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
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
        emphasis
          ? "text-[color:var(--lux-ink)]"
          : "text-amber-950 hover:bg-[color:var(--lux-cream)]",
      )}
      style={
        emphasis
          ? { background: "color-mix(in srgb, var(--lux-gold) 18%, white)" }
          : undefined
      }
      role="menuitem"
    >
      {icon}
      {children}
    </Link>
  )
}
