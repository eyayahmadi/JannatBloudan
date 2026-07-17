"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageShell } from "@/components/site/PageShell"
import { PremiumBackdrop } from "@/components/site/PremiumBackdrop"
import { MenuSubcategoryHeader } from "@/components/menu/MenuSubcategoryHeader"
import { QrMenuHero } from "@/components/menu/qr/QrMenuHero"
import { QrMenuLayout } from "@/components/menu/qr/QrMenuLayout"
import { QrMenuEmptyState, QrMenuCardSkeleton } from "@/components/menu/qr/QrMenuEmptyState"
import { QrTableMenuProductGrid } from "@/components/menu/qr/QrTableMenuProductGrid"
import { QrTableMenuShell } from "@/components/menu/qr/QrTableMenuShell"
import { useQrTableMenu } from "@/components/menu/qr/QrTableMenuProvider"
import { isQrDrinkSectionId, isValidQrNavCategorySlug, navCategoryFromSlug } from "@/lib/menu/qr-printed-menu"
import { resolveQrCategoryLabel } from "@/lib/menu/qr-category-i18n"
import { useI18n } from "@/lib/i18n/context"
import { StationStatusBanner } from "@/components/stations/StationStatusBanner"

export default function TableMenuCategoryPage() {
  const { category } = useParams<{ category: string }>()
  const router = useRouter()
  const { t, locale } = useI18n()
  const {
    tableId,
    displayLabel,
    cartCount,
    setCartOpen,
    activeOrder,
    categoryNavItems,
    getCategoryBlock,
    loading,
    loadError,
    offline,
    loadMenu,
    menuItems,
    detailItemId,
  } = useQrTableMenu()

  const slug = String(category ?? "")
  const valid = isValidQrNavCategorySlug(slug)
  const navMeta = valid ? navCategoryFromSlug(slug) : undefined
  const block = valid ? getCategoryBlock(slug) : null

  const blockFrozenRef = useRef(block)
  if (!detailItemId) {
    blockFrozenRef.current = block
  }
  const displayBlock = detailItemId ? blockFrozenRef.current : block
  const categoryLabels =
    valid && navMeta
      ? resolveQrCategoryLabel(slug, locale, t, navMeta.labelDe, navMeta.labelAr)
      : null

  useEffect(() => {
    if (!loading && !valid) {
      router.replace(`/table/${tableId}/menu`)
    }
  }, [loading, valid, router, tableId])

  return (
    <PageShell stableViewport className="relative dark:bg-neutral-950">
      <PremiumBackdrop variant="cream" lite />

      <QrMenuHero
        tableId={tableId}
        tableLabel={displayLabel}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        activeOrder={activeOrder}
      />

      <div className="relative z-0 mx-auto max-w-4xl px-4 pt-3 pb-2">
        <StationStatusBanner />
      </div>

      <QrMenuLayout
        categories={categoryNavItems}
        tableId={tableId}
        activeSlug={valid ? slug : null}
        className="pb-28 pt-1"
      >
        <main data-menu-background>
          {offline && !loading ? (
            <QrMenuEmptyState variant="offline" onRetry={loadMenu} />
          ) : loading && menuItems.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <QrMenuCardSkeleton key={i} index={i} />
              ))}
            </div>
          ) : loadError ? (
            <QrMenuEmptyState variant="error" onRetry={loadMenu} />
          ) : !displayBlock || displayBlock.groups.every((g) => g.items.length === 0) ? (
            <QrMenuEmptyState variant="category" />
          ) : (
            <div className="space-y-8">
              <MenuSubcategoryHeader
                icon={displayBlock.icon}
                labelDe={categoryLabels?.primary ?? displayBlock.labelDe}
                labelAr={categoryLabels?.secondary ?? displayBlock.labelAr}
                variant="table"
                drink={isQrDrinkSectionId(displayBlock.id)}
                sweet={displayBlock.id === "qr-section-desserts"}
                premium
              />
              {displayBlock.groups.length === 1 && displayBlock.groups[0]?.key !== "other" ? (
                <QrTableMenuProductGrid items={displayBlock.groups[0].items} />
              ) : (
                <div className="space-y-10">
                  {displayBlock.groups.map((group) => (
                    <div key={group.key} className="space-y-4">
                      <MenuSubcategoryHeader
                        icon={group.icon}
                        labelDe={group.labelDe}
                        labelAr={group.labelAr}
                        subtitle={group.subtitle}
                        variant="table"
                        drink={isQrDrinkSectionId(displayBlock.id)}
                        sweet={displayBlock.id === "qr-section-desserts"}
                        premium
                      />
                      <QrTableMenuProductGrid items={group.items} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </QrMenuLayout>

      <QrTableMenuShell />
    </PageShell>
  )
}
