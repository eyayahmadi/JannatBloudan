"use client"

import { useRouter } from "next/navigation"
import { ChevronRight, Wind } from "lucide-react"
import { useQrTableMenu } from "@/components/menu/qr/QrTableMenuProvider"
import { buildQrCategoryNavCards, type QrCategoryNavCard } from "@/lib/menu/qr-printed-menu"
import { isShishaCategorySlug } from "@/lib/menu/category-display-icon"
import { resolveQrCategoryLabel } from "@/lib/menu/qr-category-i18n"
import { QrHorizontalScrollItem, QrHorizontalScrollRow } from "@/components/menu/qr/QrHorizontalScrollRow"
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
          {isShishaCategorySlug(card.slug) ? (
            <Wind className="h-8 w-8 stroke-[1.75] text-sky-200 sm:h-9 sm:w-9" aria-hidden />
          ) : (
            <span className="text-2xl sm:text-3xl">{card.icon}</span>
          )}
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
 * Category cards — one horizontal swipeable row (13 categories, no grid wrap).
 */
export function QrMenuCategoryCards({ tableId, className }: QrMenuCategoryCardsProps) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const { categoryRows, menuItems } = useQrTableMenu()
  const cards = buildQrCategoryNavCards(categoryRows, menuItems)

  return (
    <QrHorizontalScrollRow
      className={className}
      ariaLabel={t("menu.qrCategoriesAria")}
      data-qr-category-carousel
    >
      {cards.map((card) => {
        const { primary, secondary } = resolveQrCategoryLabel(
          card.slug,
          locale,
          t,
          card.labelDe,
          card.labelAr,
        )
        return (
          <QrHorizontalScrollItem
            key={card.slug}
            className="w-[78vw] min-w-[78vw] max-w-[18rem] snap-center sm:w-[16.5rem] sm:min-w-[16.5rem]"
          >
            <CategoryCard
              card={card}
              primaryLabel={primary}
              secondaryLabel={secondary}
              onOpen={() => router.push(`/table/${tableId}/menu/${card.slug}`)}
            />
          </QrHorizontalScrollItem>
        )
      })}
    </QrHorizontalScrollRow>
  )
}
