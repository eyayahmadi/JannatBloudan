"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, LayoutDashboard, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[AdminError]", error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-[color:var(--lux-cream)] px-4 py-16">
      <div className="mx-auto w-full max-w-2xl text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50/90 text-red-700 shadow-[0_18px_48px_-20px_rgba(220,38,38,0.4)] ring-2 ring-red-200">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-red-700/80">
          Erreur — Espace administration
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-amber-950 sm:text-4xl">
          Une erreur est survenue dans l&apos;administration
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base text-amber-900/80">
          Le module admin a rencontré un problème inattendu. Vous pouvez
          réessayer ou retourner au tableau de bord principal.
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
            className="rounded-full"
          >
            <Link href="/admin/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Tableau de bord
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
