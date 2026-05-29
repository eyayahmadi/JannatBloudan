import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageHeroProps = {
  imageSrc: string
  imageAlt?: string
  kicker?: string
  title: string
  subtitle?: string
  children?: ReactNode
  className?: string
  height?: "sm" | "md" | "lg" | "xl"
  /** Optionnel : ajouter du fil d'Ariane (breadcrumb) au-dessus du titre */
  breadcrumb?: ReactNode
  /**
   * Définit l'élément `<h1>` ou un autre niveau pour le titre.
   * Par défaut h1, mais utile si le hero n'est pas le titre principal de la page.
   */
  titleAs?: "h1" | "h2"
}

const heights = {
  sm: "min-h-[160px] md:min-h-[200px]",
  md: "min-h-[200px] md:min-h-[280px]",
  lg: "min-h-[260px] md:min-h-[360px]",
  xl: "min-h-[320px] md:min-h-[440px]",
}

export function PageHero({
  imageSrc,
  imageAlt = "",
  kicker,
  title,
  subtitle,
  children,
  className,
  height = "md",
  breadcrumb,
  titleAs = "h1",
}: PageHeroProps) {
  const TitleTag = titleAs
  const isDecorative = imageAlt.trim() === ""
  return (
    <section
      className={cn(
        "relative isolate flex w-full items-end overflow-hidden",
        heights[height],
        className,
      )}
      aria-labelledby="page-hero-title"
    >
      {/* Image avec ken burns subtil. `priority` LCP via fetchPriority="high". */}
      <img
        src={imageSrc}
        alt={imageAlt}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — fetchPriority is valid HTML, types may lag
        fetchPriority="high"
        loading="eager"
        decoding="async"
        aria-hidden={isDecorative ? true : undefined}
        role={isDecorative ? "presentation" : undefined}
        className="absolute inset-0 h-full w-full scale-[1.02] object-cover transition-transform duration-[10s] ease-out hover:scale-[1.06] motion-reduce:transition-none motion-reduce:hover:scale-[1.02]"
      />

      {/* Voile dégradé sombre principal */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-amber-950/95 via-amber-900/55 to-amber-950/10"
        aria-hidden
      />

      {/* Halo doré en bas à gauche */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-[color:var(--lux-gold)]/20 blur-[100px]"
      />

      {/* Halo bordeaux en haut à droite */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full bg-[color:var(--lux-bordeaux)]/35 blur-[120px]"
      />

      {/* Hairline doré en bas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--lux-gold) 30%, var(--lux-gold) 70%, transparent 100%)",
          opacity: 0.55,
        }}
      />

      <div className="relative z-[1] w-full py-10 sm:py-12">
        <div className="site-container flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl text-balance">
            {breadcrumb ? (
              <div className="mb-3 animate-fade-up text-xs text-amber-100/80">{breadcrumb}</div>
            ) : null}
            {kicker ? (
              <p className="mb-2 inline-flex animate-fade-up items-center gap-2 rounded-full border border-[color:var(--lux-gold)]/35 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--lux-gold-bright)] backdrop-blur-md">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--lux-gradient-gold)" }}
                />
                {kicker}
              </p>
            ) : null}
            <TitleTag
              id="page-hero-title"
              className="animate-fade-up [animation-delay:80ms] font-display text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl"
            >
              {title}
            </TitleTag>
            {subtitle ? (
              <p className="mt-3 max-w-xl animate-fade-up [animation-delay:160ms] text-sm leading-relaxed text-amber-100/90 md:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
          {children ? (
            <div className="flex flex-wrap items-center gap-4 text-white animate-fade-up [animation-delay:240ms]">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
