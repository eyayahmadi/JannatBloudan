"use client"

import Link from "next/link"
import { Compass, Home, Search, UtensilsCrossed, Calendar, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/site/PageShell"
import { PublicHeader } from "@/components/site/PublicHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SITE } from "@/lib/site-config"

const QUICK_LINKS = [
  { href: "/menu", label: "Voir le menu", icon: UtensilsCrossed },
  { href: "/reservation", label: "Réserver une table", icon: Calendar },
  { href: "/delivery", label: "Commander", icon: Search },
  { href: "/#contact", label: "Nous contacter", icon: Phone },
]

export default function NotFoundPage() {
  return (
    <PageShell>
      <PublicHeader />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-0 opacity-60"
          style={{
            backgroundImage: `radial-gradient(ellipse 60% 45% at 30% 20%, rgba(201, 162, 76, 0.18) 0%, transparent 60%),
                              radial-gradient(ellipse 50% 40% at 75% 80%, rgba(110, 29, 43, 0.12) 0%, transparent 60%)`,
          }}
        />

        <div className="relative z-[1] mx-auto w-full max-w-3xl text-center">
          <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl shadow-[0_18px_48px_-20px_rgba(201,162,76,0.45)] ring-2 ring-[color:var(--lux-gold)]/40 sm:h-24 sm:w-24">
            <span
              aria-hidden
              className="absolute inset-0 rounded-3xl"
              style={{ background: "var(--lux-gradient-ink)" }}
            />
            <Compass className="relative h-10 w-10 text-[color:var(--lux-gold-bright)] sm:h-12 sm:w-12" />
            <span className="aurora-ring" aria-hidden />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-800/70 animate-fade-up">
            Erreur 404
          </p>

          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-amber-950 sm:text-6xl md:text-7xl animate-fade-up [animation-delay:80ms]">
            <span className="text-gold">Page</span> introuvable
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-amber-900/80 sm:text-lg animate-fade-up [animation-delay:160ms]">
            La page que vous cherchez n&apos;existe pas, a été déplacée ou n&apos;est plus
            disponible. Laissez-vous guider vers nos saveurs de Damas.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-up [animation-delay:240ms]">
            <Button asChild variant="gold" size="lg" className="rounded-full px-7">
              <Link href="/">
                <Home className="h-4 w-4" />
                Retour à l&apos;accueil
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-[color:var(--lux-gold)]/45 bg-white/70 backdrop-blur-md hover:border-[color:var(--lux-gold)]"
            >
              <Link href="/menu">
                <UtensilsCrossed className="h-4 w-4" />
                Découvrir le menu
              </Link>
            </Button>
          </div>

          <div className="mt-14 animate-fade-up [animation-delay:320ms]">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-amber-800/60">
              Accès rapides
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group premium-card flex flex-col items-center gap-2 px-3 py-5 text-amber-950 transition"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--lux-gold)]/15 text-[color:var(--lux-bordeaux)] transition group-hover:scale-110 group-hover:bg-[color:var(--lux-gold)]/25">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <p className="mt-12 text-xs text-amber-900/60 animate-fade-up [animation-delay:400ms]">
            {SITE.name} — {SITE.tagline}
          </p>
        </div>
      </main>
      <SiteFooter />
    </PageShell>
  )
}
