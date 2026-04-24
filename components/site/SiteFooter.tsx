"use client"

import Link from "next/link"
import { SITE } from "@/lib/site-config"
import { useI18n } from "@/lib/i18n/context"

export function SiteFooter() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/30 bg-gradient-to-br from-amber-950/95 via-stone-900 to-stone-950 py-10 text-center text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
      <div className="pointer-events-none absolute inset-0 syrian-pattern opacity-20" />
      <div className="relative">
        <p className="font-display text-lg font-medium">{SITE.name}</p>
        <p className="mt-1 text-sm text-amber-200/75">{SITE.tagline}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-amber-300/80">
          <Link href="/menu" className="transition hover:text-white">
            {t("nav.menu", "Menu")}
          </Link>
          <Link href="/delivery" className="transition hover:text-white">
            {t("nav.delivery", "Livraison")}
          </Link>
          <Link href="/reservation" className="transition hover:text-white">
            {t("nav.reservation", "Réserver")}
          </Link>
          <Link href="/events" className="transition hover:text-white">
            {t("nav.events", "Événements")}
          </Link>
        </div>
        <p className="mt-4 text-[11px] text-amber-300/50">
          © {year} {SITE.name} — {t("footer.rights", "Tous droits réservés")}
        </p>
      </div>
    </footer>
  )
}
