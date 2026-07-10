"use client"

import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { QR_CATEGORY_NAV_CARDS, type QrCategoryNavCard } from "@/lib/menu/qr-printed-menu"
import { cn } from "@/lib/utils"

type QrMenuCategoryCardsProps = {
  tableId: string
  className?: string
}

function CategoryCard({
  card,
  onOpen,
}: {
  card: QrCategoryNavCard
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative w-full shrink-0 overflow-hidden rounded-3xl text-left text-white shadow-lg shadow-black/10 transition-transform active:scale-[0.99]",
        "bg-gradient-to-br sm:min-w-0",
        card.gradient,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_55%)]" />
      <div className="relative flex min-h-[6.75rem] items-center justify-between gap-3 p-4 sm:min-h-[7.25rem] sm:p-5">
        <div className="min-w-0">
          <span className="text-2xl sm:text-3xl">{card.icon}</span>
          <h3 className="mt-2 font-display text-base font-bold tracking-tight sm:text-lg">
            {card.labelDe}
          </h3>
          <p className="mt-0.5 text-sm text-white/75" dir="rtl">
            {card.labelAr}
          </p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition group-hover:bg-white/25">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  )
}

/** Large colored category cards — navigation only, opens category page. */
export function QrMenuCategoryCards({ tableId, className }: QrMenuCategoryCardsProps) {
  const router = useRouter()

  return (
    <section className={cn("space-y-3", className)} aria-label="Kategorien">
      <div className="flex gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
        {QR_CATEGORY_NAV_CARDS.map((card) => (
          <div
            key={card.slug}
            className="w-[72%] min-w-[11.5rem] max-w-[16rem] sm:w-auto sm:min-w-0 sm:max-w-none"
          >
            <CategoryCard
              card={card}
              onOpen={() => router.push(`/table/${tableId}/menu/${card.slug}`)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
