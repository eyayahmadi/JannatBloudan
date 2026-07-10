"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { PageShell } from "@/components/site/PageShell"
import { PremiumBackdrop } from "@/components/site/PremiumBackdrop"
import { MenuSubcategoryHeader } from "@/components/menu/MenuSubcategoryHeader"
import { QrMenuCategoryNav } from "@/components/menu/qr/QrMenuCategoryNav"
import { QrMenuEmptyState, QrMenuCardSkeleton } from "@/components/menu/qr/QrMenuEmptyState"
import { QrTableMenuProductGrid } from "@/components/menu/qr/QrTableMenuProductGrid"
import { QrTableMenuShell } from "@/components/menu/qr/QrTableMenuShell"
import { useQrTableMenu } from "@/components/menu/qr/QrTableMenuProvider"
import { isQrDrinkSectionId, isValidQrNavCategorySlug, navCategoryFromSlug } from "@/lib/menu/qr-printed-menu"
import { StationStatusBanner } from "@/components/stations/StationStatusBanner"

export default function TableMenuCategoryPage() {
  const { category } = useParams<{ category: string }>()
  const router = useRouter()
  const {
    tableId,
    displayLabel,
    cartCount,
    setCartOpen,
    categoryNavItems,
    getCategoryBlock,
    loading,
    loadError,
    offline,
    loadMenu,
    menuItems,
  } = useQrTableMenu()

  const slug = String(category ?? "")
  const valid = isValidQrNavCategorySlug(slug)
  const navMeta = valid ? navCategoryFromSlug(slug) : undefined
  const block = valid ? getCategoryBlock(slug) : null

  useEffect(() => {
    if (!loading && !valid) {
      router.replace(`/table/${tableId}/menu`)
    }
  }, [loading, valid, router, tableId])

  return (
    <PageShell stableViewport className="relative dark:bg-neutral-950">
      <PremiumBackdrop variant="cream" lite />

      <header className="relative z-10 border-b border-amber-200/50 bg-[#faf6f0]/90 backdrop-blur-md dark:border-amber-900/40 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.push(`/table/${tableId}/menu`)}
            className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-amber-950 transition hover:bg-amber-100/80 dark:text-amber-100 dark:hover:bg-amber-900/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate font-display text-base font-bold text-amber-950 dark:text-white">
              {navMeta?.labelDe ?? "Kategorie"}
            </p>
            <p className="truncate text-xs text-amber-800/60 dark:text-amber-300/60" dir="rtl">
              {navMeta?.labelAr}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-white shadow-md"
            aria-label="Warenkorb"
          >
            🛒
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold">
                {cartCount}
              </span>
            ) : null}
          </button>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <QrMenuCategoryNav
            categories={categoryNavItems}
            tableId={tableId}
            activeSlug={valid ? slug : null}
          />
        </div>
      </header>

      <div className="relative z-0 mx-auto max-w-2xl px-4 pt-3 pb-2">
        <StationStatusBanner />
        <p className="text-xs text-amber-800/50 dark:text-amber-300/50">Tisch {displayLabel}</p>
      </div>

      <main className="relative z-0 mx-auto max-w-2xl px-4 py-5 pb-28">
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
        ) : !block || block.groups.every((g) => g.items.length === 0) ? (
          <QrMenuEmptyState variant="category" />
        ) : (
          <div className="space-y-8">
            <MenuSubcategoryHeader
              icon={block.icon}
              labelDe={block.labelDe}
              labelAr={block.labelAr}
              variant="table"
              drink={isQrDrinkSectionId(block.id)}
              sweet={block.id === "qr-section-desserts"}
              premium
            />
            {block.groups.length === 1 && block.groups[0]?.key !== "other" ? (
              <QrTableMenuProductGrid items={block.groups[0].items} />
            ) : (
              <div className="space-y-10">
                {block.groups.map((group) => (
                  <div key={group.key} className="space-y-4">
                    <MenuSubcategoryHeader
                      icon={group.icon}
                      labelDe={group.labelDe}
                      labelAr={group.labelAr}
                      subtitle={group.subtitle}
                      variant="table"
                      drink={isQrDrinkSectionId(block.id)}
                      sweet={block.id === "qr-section-desserts"}
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

      <QrTableMenuShell />
    </PageShell>
  )
}
