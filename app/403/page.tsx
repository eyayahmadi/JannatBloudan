"use client"

import Link from "next/link"
import { ShieldAlert, Home, LogIn, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/site/PageShell"
import { PublicHeader } from "@/components/site/PublicHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

export default function ForbiddenPage() {
  return (
    <PageShell>
      <PublicHeader />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: `radial-gradient(ellipse 50% 40% at 30% 30%, rgba(110, 29, 43, 0.14) 0%, transparent 60%),
                              radial-gradient(ellipse 50% 40% at 75% 70%, rgba(201, 162, 76, 0.18) 0%, transparent 60%)`,
          }}
        />

        <div className="relative z-[1] mx-auto w-full max-w-2xl text-center">
          <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl shadow-[0_18px_48px_-20px_rgba(110,29,43,0.45)] ring-2 ring-[color:var(--lux-bordeaux)]/30 sm:h-24 sm:w-24 animate-fade-up">
            <span
              aria-hidden
              className="absolute inset-0 rounded-3xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--lux-bordeaux) 0%, var(--lux-bordeaux-dark) 100%)",
              }}
            />
            <ShieldAlert className="relative h-10 w-10 text-amber-100 sm:h-12 sm:w-12" />
            <span className="aurora-ring" aria-hidden />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-800/70 animate-fade-up [animation-delay:80ms]">
            Erreur 403
          </p>

          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-amber-950 sm:text-5xl md:text-6xl animate-fade-up [animation-delay:160ms]">
            Accès <span className="text-gold">refusé</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base text-amber-900/80 sm:text-lg animate-fade-up [animation-delay:240ms]">
            Vous n&apos;avez pas les droits nécessaires pour accéder à cette page. Si vous
            pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez votre administrateur ou
            connectez-vous avec un autre compte.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-up [animation-delay:320ms]">
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
              className="rounded-full border-[color:var(--lux-bordeaux)]/35 bg-white/70 backdrop-blur-md hover:border-[color:var(--lux-bordeaux)]"
            >
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Changer de compte
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => window.history.back()}
              className="rounded-full text-amber-900/80 hover:bg-amber-50 hover:text-amber-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Page précédente
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </PageShell>
  )
}
