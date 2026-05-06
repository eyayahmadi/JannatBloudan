"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, UtensilsCrossed, Calendar, Truck, User } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"

type NavItem = {
  href: string
  labelKey: string
  fallback: string
  icon: LucideIcon
}

const ITEMS: readonly NavItem[] = [
  { href: "/", labelKey: "nav.home", fallback: "Accueil", icon: Home },
  { href: "/menu", labelKey: "nav.menu", fallback: "Menu", icon: UtensilsCrossed },
  { href: "/reservation", labelKey: "nav.reservation", fallback: "Réserver", icon: Calendar },
  { href: "/delivery", labelKey: "nav.delivery", fallback: "Livraison", icon: Truck },
  { href: "/account", labelKey: "client.mySpace", fallback: "Compte", icon: User },
] as const

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Barre de navigation mobile fixée en bas, type app native.
 * - Affichée uniquement < lg (cohérent avec le header desktop)
 * - Respecte les safe-areas iOS (env(safe-area-inset-bottom))
 * - Mise en évidence de l'item actif avec animation layout (framer-motion)
 * - 5 items max pour respecter le pouce ergonomique
 *
 * À placer dans les pages publiques (juste avant `<SiteFooter />`).
 */
export function MobileBottomNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <nav
      aria-label={t("client.bottomNav", "Navigation principale")}
      className={cn(
        "lg:hidden",
        "fixed inset-x-0 bottom-0 z-40 print:hidden",
        "border-t border-white/45 bg-white/85 backdrop-blur-xl",
        "supports-[backdrop-filter]:bg-white/65",
        "shadow-[0_-12px_30px_-15px_rgba(26,20,16,0.12)]",
        className,
      )}
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--lux-gold) 30%, var(--lux-gold) 70%, transparent 100%)",
          opacity: 0.55,
        }}
      />
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around gap-1 px-2 py-1.5">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          const label = t(item.labelKey, item.fallback)
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5",
                  "min-h-12 rounded-xl px-1 py-1.5 transition",
                  "text-[10px] font-medium",
                  active
                    ? "text-[color:var(--lux-bordeaux)]"
                    : "text-amber-900/70 hover:text-amber-950",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="mobilenav-pill"
                    className="absolute inset-1 rounded-xl bg-[color:var(--lux-gold)]/15 ring-1 ring-[color:var(--lux-gold)]/35"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <Icon
                  className={cn(
                    "relative z-[1] transition",
                    active ? "h-5 w-5" : "h-[18px] w-[18px]",
                  )}
                  aria-hidden
                />
                <span className="relative z-[1] truncate leading-none">
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * Padding bottom à appliquer sur le body / dernière section
 * pour éviter que le contenu soit caché derrière la nav.
 * Usage : `<div className={MOBILE_NAV_BOTTOM_PAD} />` ou en classe Tailwind directe.
 */
export const MOBILE_NAV_BOTTOM_PAD = "pb-20 lg:pb-0"
