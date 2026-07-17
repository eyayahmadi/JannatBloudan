"use client"

import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { QR_CATEGORY_NAV_CARDS, type QrCategoryNavCard } from "@/lib/menu/qr-printed-menu"
import { resolveQrCategoryLabel } from "@/lib/menu/qr-category-i18n"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

type QrMenuCategoryCardsProps = {
  tableId: string
  className?: string
}

function CategoryCard({
  card,
  primaryLabel,
  secondaryLabel,
  onOpen,
}: {
  card: QrCategoryNavCard
  primaryLabel: string
  secondaryLabel?: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative h-full min-h-[6.75rem] w-full overflow-hidden rounded-3xl text-left text-white shadow-lg shadow-black/10 transition-transform active:scale-[0.99] sm:min-h-[7.25rem]",
        "bg-gradient-to-br",
        card.gradient,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_55%)]" />
      <div className="relative flex h-full items-center justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <span className="text-2xl sm:text-3xl">{card.icon}</span>
          <h3 className="mt-2 font-display text-base font-bold tracking-tight sm:text-lg">{primaryLabel}</h3>
          {secondaryLabel ? (
            <p className="mt-0.5 text-sm text-white/75" dir="rtl">
              {secondaryLabel}
            </p>
          ) : null}
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition group-hover:bg-white/25">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  )
}

/**
 * Large colored category cards — ONE horizontal swipeable row only (never wraps to grid).
 */
export function QrMenuCategoryCards({ tableId, className }: QrMenuCategoryCardsProps) {
  const router = useRouter()
  const { t, locale } = useI18n()

  return (
    <section
      className={cn("w-full min-w-0", className)}
      aria-label={t("menu.qrCategoriesAria")}
      data-qr-category-carousel
    >
      <div className="-mx-4 overflow-hidden sm:-mx-0">
        <div
          className="flex flex-row flex-nowrap items-stretch gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-2 snap-x snap-mandatory touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] sm:px-0 [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {QR_CATEGORY_NAV_CARDS.map((card) => {
            const { primary, secondary } = resolveQrCategoryLabel(
              card.slug,
              locale,
              t,
              card.labelDe,
              card.labelAr,
            )
            return (
              <div
                key={card.slug}
                className="flex w-[min(72vw,13.5rem)] shrink-0 grow-0 basis-[min(72vw,13.5rem)] snap-start"
              >
                <CategoryCard
                  card={card}
                  primaryLabel={primary}
                  secondaryLabel={secondary}
                  onOpen={() => router.push(`/table/${tableId}/menu/${card.slug}`)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
