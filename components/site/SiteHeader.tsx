"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { SITE, SITE_NAV } from "@/lib/site-config"
import { ThemeToggle } from "@/components/site/ThemeToggle"
import { NotificationCenter } from "@/components/site/NotificationCenter"
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher"
import { useI18n } from "@/lib/i18n/context"
import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"

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
  const [open, setOpen] = useState(false)
  const { t } = useI18n()
  const resolvedBackLabel = backLabel ?? t("common.back", "Retour")

  const navItems = SITE_NAV.map((item) => ({
    ...item,
    label: t(`nav.${item.key}`, item.label),
  }))

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/40 bg-white/75 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/55",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3 sm:h-16">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {backOnClick ? (
              <button
                type="button"
                onClick={backOnClick}
                className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-amber-900/85 transition hover:bg-white/80 hover:text-amber-950"
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                <span className="hidden sm:inline">{resolvedBackLabel}</span>
              </button>
            ) : backHref ? (
              <Link
                href={backHref}
                className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-amber-900/85 transition hover:bg-white/80 hover:text-amber-950"
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                <span className="hidden sm:inline">{resolvedBackLabel}</span>
              </Link>
            ) : null}

            <Link href="/" className="group flex min-w-0 items-center gap-2.5" aria-label={SITE.name}>
              <div
                className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md ring-2 ring-white/60 transition group-hover:shadow-lg sm:h-10 sm:w-10"
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

          <nav className="hidden items-center gap-2.5 lg:flex" aria-label="Principal">
            {!hideMainNav
              ? navItems.map((item) => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-sm font-medium transition",
                        active
                          ? "bg-amber-950/10 text-amber-950"
                          : "text-amber-900/75 hover:bg-white/70 hover:text-amber-950",
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })
              : null}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <NotificationCenter />
            <ThemeToggle />
            {trailing}
            {!hideMainNav ? (
              <button
                type="button"
                className="rounded-xl p-2 text-amber-950 lg:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label="Menu"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            ) : null}
          </div>
        </div>

        {open && !hideMainNav ? (
          <div className="border-t border-amber-200/40 py-3 lg:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-amber-950 hover:bg-white/80"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {center ? (
          <div className="border-t border-amber-200/30 py-3 md:hidden">{center}</div>
        ) : null}

        {bottom ? <div className="border-t border-amber-200/30 py-3">{bottom}</div> : null}
      </div>
    </header>
  )
}
