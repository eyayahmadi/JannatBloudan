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
  height?: "sm" | "md" | "lg"
}

const heights = {
  sm: "min-h-[140px] md:min-h-[180px]",
  md: "min-h-[180px] md:min-h-[240px]",
  lg: "min-h-[220px] md:min-h-[320px]",
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
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative isolate flex w-full items-end overflow-hidden",
        heights[height],
        className,
      )}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out hover:scale-[1.02]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-amber-950/90 via-amber-900/45 to-amber-950/20"
        aria-hidden
      />
      <div className="relative z-[1] w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl text-balance">
            {kicker ? (
              <p className="mb-2 animate-fade-up text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/90">{kicker}</p>
            ) : null}
            <h1 className="animate-fade-up [animation-delay:80ms] font-display text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-2 animate-fade-up [animation-delay:160ms] max-w-xl text-sm leading-relaxed text-amber-100/90 md:text-base">{subtitle}</p> : null}
          </div>
          {children ? <div className="animate-fade-up [animation-delay:240ms] flex flex-wrap items-center gap-4 text-white">{children}</div> : null}
        </div>
      </div>
    </section>
  )
}
