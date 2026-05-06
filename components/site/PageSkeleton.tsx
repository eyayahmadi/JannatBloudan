import { cn } from "@/lib/utils"

type PageSkeletonProps = {
  /** Nombre de cartes squelettes à afficher (défaut : 6) */
  cards?: number
  /** Affiche un grand bandeau hero squelette en haut */
  hero?: boolean
  /** Texte d'accessibilité — annoncé aux lecteurs d'écran */
  label?: string
  className?: string
}

/**
 * Squelette de page premium.
 * - Respecte la palette luxe (or / ivoire) du design system
 * - Animation shimmer subtile (CSS `shimmer-gold` ou pulse natif)
 * - Annonce le statut "chargement" aux lecteurs d'écran via aria-live
 */
export function PageSkeleton({
  cards = 6,
  hero = true,
  label = "Chargement de la page…",
  className,
}: PageSkeletonProps) {
  return (
    <div
      className={cn("relative w-full", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>

      {hero ? (
        <div
          aria-hidden
          className="relative h-[200px] w-full overflow-hidden md:h-[280px]"
        >
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[color:var(--lux-ink)]/85 via-[color:var(--lux-bordeaux-dark)]/55 to-[color:var(--lux-ink)]/85" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--lux-gold)]/60 to-transparent" />
          <div className="relative z-[1] mx-auto flex h-full max-w-7xl flex-col justify-end gap-3 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="h-3 w-28 animate-pulse rounded-full bg-white/15" />
            <div className="h-8 w-64 animate-pulse rounded-lg bg-white/20 md:h-10 md:w-96" />
            <div className="h-4 w-72 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Toolbar skeleton */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="h-10 w-44 animate-pulse rounded-full bg-[color:var(--lux-sand)]/70" />
          <div className="h-10 w-28 animate-pulse rounded-full bg-[color:var(--lux-sand)]/50" />
          <div className="ml-auto h-10 w-32 animate-pulse rounded-full bg-[color:var(--lux-sand)]/60" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="premium-card relative overflow-hidden p-0"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-gradient-to-br from-[color:var(--lux-sand)]/80 via-[color:var(--lux-cream)] to-[color:var(--lux-sand)]/60" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-20 animate-pulse rounded-full bg-[color:var(--lux-gold)]/30" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-[color:var(--lux-ink)]/10" />
                <div className="h-4 w-full animate-pulse rounded bg-[color:var(--lux-ink)]/8" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-[color:var(--lux-ink)]/8" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-[color:var(--lux-bordeaux)]/15" />
                  <div className="h-9 w-24 animate-pulse rounded-full bg-[color:var(--lux-gold)]/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
