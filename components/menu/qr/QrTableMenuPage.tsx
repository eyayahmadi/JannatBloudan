"use client"

import { useState } from "react"
import { PageShell } from "@/components/site/PageShell"
import { PremiumBackdrop } from "@/components/site/PremiumBackdrop"
import { QrMenuHero } from "@/components/menu/qr/QrMenuHero"
import { QrMenuLayout } from "@/components/menu/qr/QrMenuLayout"
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
    categoryNavItems,
    bestsellerItems,
    todayItems,
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
        compact
      />

      <div className="relative z-0 mx-auto max-w-4xl px-4 pt-3 pb-2">
        <StationStatusBanner />
      </div>

      <QrMenuLayout categories={categoryNavItems} tableId={tableId} activeSlug={null} className="pb-28 pt-1">
        <main className="qr-home-main min-w-0" data-qr-homepage data-menu-background>
          {offline && !loading ? (
            <QrMenuEmptyState variant="offline" onRetry={loadMenu} />
          ) : loading && menuItems.length === 0 ? (
            <div className="space-y-8">
              {(["bestseller", "today"] as const).map((key) => (
                <div key={key} className="space-y-3">
                  <div className="h-6 w-44 animate-pulse rounded-lg bg-amber-200/40 dark:bg-amber-900/30" />
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <QrMenuCardSkeleton key={i} index={i} />
                    ))}
                  </div>
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
                />
              ) : null}

              {todayItems.length > 0 ? (
                <QrMenuFeaturedStrip
                  id="qr-featured-today"
                  icon="🔥"
                  titleKey="today"
                  titleAr="موصى به اليوم"
                  items={todayItems}
                />
              ) : null}
            </div>
          )}
        </main>
      </QrMenuLayout>

      <QrTableMenuShell />
      <QrMenuSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  )
}
