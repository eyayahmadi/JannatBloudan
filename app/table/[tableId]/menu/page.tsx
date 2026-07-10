"use client"

import { PageShell } from "@/components/site/PageShell"
import { PremiumBackdrop } from "@/components/site/PremiumBackdrop"
import { QrMenuHero } from "@/components/menu/qr/QrMenuHero"
import { QrMenuCategoryNav } from "@/components/menu/qr/QrMenuCategoryNav"
import { QrMenuFeaturedStrip } from "@/components/menu/qr/QrMenuFeaturedStrip"
import { QrMenuEmptyState, QrMenuCardSkeleton } from "@/components/menu/qr/QrMenuEmptyState"
import { QrTableMenuShell } from "@/components/menu/qr/QrTableMenuShell"
import { useQrTableMenu } from "@/components/menu/qr/QrTableMenuProvider"
import { StationStatusBanner } from "@/components/stations/StationStatusBanner"

/** Marketing landing page — hero, category nav, curated promo strips only. */
export default function TableMenuHomePage() {
  const {
    tableId,
    displayLabel,
    cartCount,
    setCartOpen,
    activeOrder,
    categoryNavItems,
    bestsellerItems,
    todayItems,
    favoriteIds,
    handleToggleFavorite,
    openDetail,
    handleQuickAdd,
    getInCartQty,
    loading,
    loadError,
    offline,
    loadMenu,
    menuItems,
  } = useQrTableMenu()

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

      <div className="relative z-0 mx-auto max-w-2xl px-4 pt-3 pb-2">
        <StationStatusBanner />
      </div>

      <main className="relative z-0 mx-auto max-w-2xl px-4 py-5 pb-28">
        {offline && !loading ? (
          <QrMenuEmptyState variant="offline" onRetry={loadMenu} />
        ) : loading && menuItems.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <QrMenuCardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : loadError ? (
          <QrMenuEmptyState variant="error" onRetry={loadMenu} />
        ) : (
          <div className="space-y-8">
            <QrMenuCategoryNav categories={categoryNavItems} tableId={tableId} />

            {bestsellerItems.length > 0 ? (
              <QrMenuFeaturedStrip
                id="qr-featured-bestseller"
                icon="⭐"
                titleDe="Bestseller"
                titleAr="الأكثر مبيعاً"
                items={bestsellerItems}
                favoriteIds={new Set(favoriteIds)}
                onToggleFavorite={handleToggleFavorite}
                onOpenProduct={openDetail}
                onQuickAdd={handleQuickAdd}
                getInCartQty={getInCartQty}
              />
            ) : null}

            {todayItems.length > 0 ? (
              <QrMenuFeaturedStrip
                id="qr-featured-today"
                icon="🔥"
                titleDe="Heute empfohlen"
                titleAr="موصى به اليوم"
                items={todayItems}
                favoriteIds={new Set(favoriteIds)}
                onToggleFavorite={handleToggleFavorite}
                onOpenProduct={openDetail}
                onQuickAdd={handleQuickAdd}
                getInCartQty={getInCartQty}
              />
            ) : null}
          </div>
        )}
      </main>

      <QrTableMenuShell />
    </PageShell>
  )
}
