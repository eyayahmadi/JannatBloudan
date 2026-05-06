"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Calendar, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

export default function EventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[EventsError]", error)
    }
  }, [error])

  return (
    <PageShell>
      <SiteHeader backHref="/" />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16 sm:py-24">
        <div className="relative z-[1] mx-auto w-full max-w-2xl text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50/90 text-red-700 shadow-[0_18px_48px_-20px_rgba(220,38,38,0.4)] ring-2 ring-red-200">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-red-700/80">
            Erreur — Module Événements
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-amber-950 sm:text-5xl">
            Impossible de charger les événements
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-amber-900/80 sm:text-lg">
            Une erreur est survenue lors du chargement. Veuillez réessayer dans
            quelques instants.
          </p>
          {error?.digest ? (
            <p className="mx-auto mt-3 inline-block rounded-full bg-amber-50/70 px-3 py-1 text-[11px] font-mono text-amber-900/60">
              Réf : {error.digest}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="gold"
              size="lg"
              className="rounded-full px-7"
              onClick={() => reset()}
            >
              <RotateCcw className="h-4 w-4" />
              Réessayer
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-[color:var(--lux-gold)]/45 bg-white/70 backdrop-blur-md hover:border-[color:var(--lux-gold)]"
            >
              <Link href="/">
                <Calendar className="h-4 w-4" />
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
