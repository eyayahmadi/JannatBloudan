import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  /** Action principale (bouton ou lien) */
  action?: ReactNode
  /** Action secondaire optionnelle */
  secondaryAction?: ReactNode
  /** Variante visuelle */
  variant?: "default" | "compact" | "inline"
  className?: string
}

/**
 * Empty state premium aligné sur le design system Jannat Bloudan.
 * Utilisable partout où une liste/recherche/section est vide.
 *
 * @example
 * <EmptyState
 *   icon={Search}
 *   title="Aucun plat ne correspond"
 *   description="Essayez d'élargir vos filtres."
 *   action={<Button>Réinitialiser</Button>}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
  className,
}: EmptyStateProps) {
  const isCompact = variant === "compact"
  const isInline = variant === "inline"

  if (isInline) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-2 px-4 py-8 text-center",
          className,
        )}
        role="status"
      >
        {Icon ? (
          <Icon
            className="h-8 w-8 text-amber-800/40"
            aria-hidden="true"
          />
        ) : null}
        <p className="text-sm font-medium text-amber-950/85">{title}</p>
        {description ? (
          <p className="text-xs text-amber-900/60">{description}</p>
        ) : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "premium-card relative mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center",
        isCompact ? "p-6 sm:p-8" : "p-8 sm:p-12",
        className,
      )}
      role="status"
    >
      {Icon ? (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-3xl bg-[color:var(--lux-gold)]/12 text-[color:var(--lux-bordeaux)] ring-1 ring-[color:var(--lux-gold)]/30",
            isCompact ? "h-12 w-12" : "h-16 w-16",
          )}
          aria-hidden
        >
          <Icon className={cn(isCompact ? "h-6 w-6" : "h-8 w-8")} />
        </div>
      ) : null}

      <div className="space-y-2">
        <h3
          className={cn(
            "font-display font-semibold tracking-tight text-amber-950",
            isCompact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl",
          )}
        >
          {title}
        </h3>
        {description ? (
          <p
            className={cn(
              "mx-auto max-w-md text-amber-900/75",
              isCompact ? "text-sm" : "text-sm sm:text-base",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action || secondaryAction ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}
