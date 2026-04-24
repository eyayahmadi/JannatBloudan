"use client"

import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"

export default function ForbiddenPage() {
  return (
    <PageShell>
      <SiteHeader backHref="/" />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 ring-1 ring-amber-900/10 animate-fade-up">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-amber-950 animate-fade-up [animation-delay:80ms]">Accès refusé</h1>
        <p className="mt-3 max-w-md text-amber-900/75 animate-fade-up [animation-delay:160ms]">
          Vous n&apos;avez pas les droits nécessaires pour accéder à cette page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-up [animation-delay:240ms]">
          <Button asChild size="pill" className="px-6">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full border-amber-900/20 bg-white/80">
            <Link href="/login">Changer de compte</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
