"use client"

import Link from "next/link"
import { CalendarX, Home, Calendar, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

export default function EventsNotFound() {
  return (
    <PageShell>
      <SiteHeader backHref="/" />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: `radial-gradient(ellipse 60% 45% at 30% 30%, rgba(201, 162, 76, 0.18) 0%, transparent 60%),
                              radial-gradient(ellipse 50% 40% at 75% 70%, rgba(110, 29, 43, 0.12) 0%, transparent 60%)`,
          }}
        />

        <div className="relative z-[1] mx-auto w-full max-w-2xl text-center">
          <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl shadow-[0_18px_48px_-20px_rgba(201,162,76,0.45)] ring-2 ring-[color:var(--lux-gold)]/40">
            <span
              aria-hidden
              className="absolute inset-0 rounded-3xl"
              style={{ background: "var(--lux-gradient-ink)" }}
            />
            <CalendarX className="relative h-10 w-10 text-[color:var(--lux-gold-bright)]" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-800/70">
            Événement introuvable
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-amber-950 sm:text-5xl">
            Cet <span className="text-gold">événement</span> n&apos;existe plus
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-amber-900/80 sm:text-lg">
            L&apos;événement recherché a été supprimé, archivé ou n&apos;est plus
            disponible. Découvrez nos événements à venir.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="gold" size="lg" className="rounded-full px-7">
              <Link href="/events">
                <Calendar className="h-4 w-4" />
                Voir tous les événements
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-[color:var(--lux-gold)]/45 bg-white/70 backdrop-blur-md hover:border-[color:var(--lux-gold)]"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                Retour à l&apos;accueil
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </PageShell>
  )
}
