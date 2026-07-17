"use client"

import { useState } from "react"
import { PageShell } from "@/components/site/PageShell"
import { PremiumBackdrop } from "@/components/site/PremiumBackdrop"
import { QrMenuHero } from "@/components/menu/qr/QrMenuHero"
import { QrMenuCategoryCards } from "@/components/menu/qr/QrMenuCategoryCards"
import { QrMenuFeaturedStrip } from "@/components/menu/qr/QrMenuFeaturedStrip"
import { QrMenuSearchOverlay } from "@/components/menu/qr/QrMenuSearchOverlay"
import { QrMenuEmptyState, QrMenuCardSkeleton } from "@/components/menu/qr/QrMenuEmptyState"
import { QrTableMenuShell } from "@/components/menu/qr/QrTableMenuShell"
import { useQrTableMenu } from "@/components/menu/qr/QrTableMenuProvider"
import { StationStatusBanner } from "@/components/stations/StationStatusBanner"

/**
 * QR table menu landing — opened after scanning a table QR code.
 * Independent from the public website menu (no site header, no advanced filter form).
 */
export function QrTableMenuPage() {
  const [searchOpen, setSearchOpen] = useState(false)
  const {
    tableId,
    displayLabel,
    cartCount,
    setCartOpen,
    activeOrder,
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
        onSearchOpen={() => setSearchOpen(true)}
        activeOrder={activeOrder}
      />

      <div className="relative z-0 mx-auto max-w-2xl px-4 pt-3 pb-2">
        <StationStatusBanner />
      </div>

      {!offline && !loadError && !(loading && menuItems.length === 0) ? (
        <div className="relative z-0 mx-auto max-w-2xl px-4 pb-2">
          <QrMenuCategoryCards tableId={tableId} />
        </div>
      ) : null}

      <main className="relative z-0 mx-auto max-w-2xl px-4 py-5 pb-28" data-menu-background>
        {offline && !loading ? (
          <QrMenuEmptyState variant="offline" onRetry={loadMenu} />
        ) : loading && menuItems.length === 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[72%] min-w-[11.5rem] shrink-0">
                <QrMenuCardSkeleton index={i} />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <QrMenuEmptyState variant="error" onRetry={loadMenu} />
        ) : (
          <div className="space-y-8">
            {bestsellerItems.length > 0 ? (
              <QrMenuFeaturedStrip
                id="qr-featured-bestseller"
                icon="⭐"
                titleKey="bestseller"
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
                titleKey="today"
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
      <QrMenuSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  )
}
