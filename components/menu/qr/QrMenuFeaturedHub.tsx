"use client"

import { ChevronRight } from "lucide-react"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import {
  QR_FEATURED_SECTIONS,
  pickQrFeaturedProducts,
  type QrFeaturedSectionDef,
} from "@/lib/menu/qr-printed-menu"
import { cn } from "@/lib/utils"

type QrMenuFeaturedHubProps = {
  items: QrMenuItem[]
  onScrollToSection: (sectionId: string) => void
  onOpenProduct: (item: QrMenuItem) => void
  className?: string
}

function FeaturedCard({
  section,
  products,
  onScrollToSection,
  onOpenProduct,
}: {
  section: QrFeaturedSectionDef
  products: QrMenuItem[]
  onScrollToSection: (sectionId: string) => void
  onOpenProduct: (item: QrMenuItem) => void
}) {
  if (products.length === 0) return null

  return (
    <button
      type="button"
      onClick={() => onScrollToSection(section.scrollTargetId)}
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl text-left text-white shadow-lg shadow-black/10 transition-transform active:scale-[0.99]",
        "bg-gradient-to-br",
        section.gradient,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_55%)]" />
      <div className="relative flex min-h-[9.5rem] flex-col justify-between p-4 sm:min-h-[10.5rem] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-2xl sm:text-3xl">{section.icon}</span>
            <h3 className="mt-2 font-display text-lg font-bold tracking-tight sm:text-xl">
              {section.labelDe}
            </h3>
            <p className="mt-0.5 text-sm text-white/75" dir="rtl">
              {section.labelAr}
            </p>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition group-hover:bg-white/25">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex -space-x-2">
            {products.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenProduct(item)
                }}
                className="relative h-11 w-11 overflow-hidden rounded-xl border-2 border-white/30 bg-black/20 shadow-md transition hover:scale-105 sm:h-12 sm:w-12"
                aria-label={item.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          <span className="shrink-0 rounded-full bg-black/25 px-2.5 py-1 text-xs font-medium text-white/90">
            {products.length} {products.length === 1 ? "Gericht" : "Gerichte"}
          </span>
        </div>
      </div>
    </button>
  )
}

export function QrMenuFeaturedHub({
  items,
  onScrollToSection,
  onOpenProduct,
  className,
}: QrMenuFeaturedHubProps) {
  const cards = QR_FEATURED_SECTIONS.map((section) => ({
    section,
    products: pickQrFeaturedProducts(section.id, items),
  })).filter((c) => c.products.length > 0)

  if (cards.length === 0) return null

  return (
    <section className={cn("space-y-3", className)} aria-label="Empfehlungen">
      <div className="px-1">
        <h2 className="font-display text-lg font-bold tracking-tight text-amber-950 dark:text-white">
          Empfohlen
        </h2>
        <p className="text-sm text-amber-800/55 dark:text-amber-300/55" dir="rtl">
          مختاراتنا
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ section, products }) => (
          <FeaturedCard
            key={section.id}
            section={section}
            products={products}
            onScrollToSection={onScrollToSection}
            onOpenProduct={onOpenProduct}
          />
        ))}
      </div>
    </section>
  )
}
