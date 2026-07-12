"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, ShoppingCart } from "lucide-react"
import { MenuSubcategoryHeader } from "@/components/menu/MenuSubcategoryHeader"
import { QrMenuCategoryNav } from "@/components/menu/qr/QrMenuCategoryNav"
import { QrMenuEmptyState, QrMenuCardSkeleton } from "@/components/menu/qr/QrMenuEmptyState"
import { QrProductDetailSheet } from "@/components/menu/qr/QrProductDetailSheet"
import { StaffVisualProductGrid } from "@/components/menu/staff/StaffVisualProductGrid"
import { useStaffTableMenu } from "@/components/menu/staff/StaffTableMenuProvider"
import {
  isQrDrinkSectionId,
  isValidQrNavCategorySlug,
  navCategoryFromSlug,
} from "@/lib/menu/qr-printed-menu"
import { StationStatusBanner } from "@/components/stations/StationStatusBanner"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function StaffTableMenuCategoryPage() {
  const { category, tableId } = useParams<{ category: string; tableId: string }>()
  const router = useRouter()
  const {
    displayLabel,
    menuItems,
    categoryNavItems,
    getCategoryBlock,
    loading,
    cartCount,
    cartTotal,
    detailItem,
    detailItemId,
    closeDetail,
    openDetail,
    catalog,
    addToCart,
    submitOrder,
    submitting,
  } = useStaffTableMenu()

  const slug = String(category ?? "")
  const valid = isValidQrNavCategorySlug(slug)
  const navMeta = valid ? navCategoryFromSlug(slug) : undefined
  const block = valid ? getCategoryBlock(slug) : null

  const blockFrozenRef = useRef(block)
  if (!detailItemId) {
    blockFrozenRef.current = block
  }
  const displayBlock = detailItemId ? blockFrozenRef.current : block

  useEffect(() => {
    if (!loading && !valid) {
      router.replace(`/server/${tableId}/menu`)
    }
  }, [loading, valid, router, tableId])

  const handleSubmit = async () => {
    const ok = await submitOrder()
    if (ok) {
      toast.success("Commande envoyée aux stations")
      router.push(`/server/${tableId}`)
    } else {
      toast.error("Échec envoi commande")
    }
  }

  const hasItems =
    displayBlock != null && displayBlock.groups.some((g) => g.items.length > 0)

  return (
    <div className="relative min-h-screen bg-[#faf6f0] dark:bg-neutral-950">
      <header className="sticky top-0 z-20 border-b border-amber-200/50 bg-[#faf6f0]/95 backdrop-blur-md dark:border-amber-900/40 dark:bg-neutral-950/95">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href={`/server/${tableId}`}
            className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-amber-950 transition hover:bg-amber-100/80 dark:text-amber-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Table {displayLabel}
          </Link>
          <div className="min-w-0 text-center">
            <p className="truncate font-display text-base font-bold text-amber-950 dark:text-white">
              {navMeta?.labelDe ?? "Kategorie"}
            </p>
            <p className="truncate text-xs text-amber-800/60 dark:text-amber-300/60" dir="rtl">
              {navMeta?.labelAr}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cartCount > 0 ? (
              <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-bold text-white">
                {cartCount}
              </span>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={cartCount === 0 || submitting}
              onClick={() => void handleSubmit()}
              className="gap-1"
            >
              <Send className="h-3.5 w-3.5" />
              Envoyer
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-2 pb-2">
          <QrMenuCategoryNav
            categories={categoryNavItems}
            tableId={tableId}
            activeSlug={slug}
            hrefForCategory={(s) => `/server/${tableId}/menu/${s}`}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 py-4 pb-28">
        <StationStatusBanner className="mb-4" />
        {loading && menuItems.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <QrMenuCardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : !hasItems ? (
          <QrMenuEmptyState variant="category" onRetry={() => router.refresh()} />
        ) : displayBlock ? (
          <div className="space-y-8">
            <MenuSubcategoryHeader
              icon={displayBlock.icon}
              labelDe={displayBlock.labelDe}
              labelAr={displayBlock.labelAr}
              variant="table"
              drink={isQrDrinkSectionId(displayBlock.id)}
              sweet={displayBlock.id === "qr-section-desserts"}
              premium
            />
            {displayBlock.groups.length === 1 && displayBlock.groups[0]?.key !== "other" ? (
              <StaffVisualProductGrid items={displayBlock.groups[0].items} />
            ) : (
              <div className="space-y-10">
                {displayBlock.groups.map((group) =>
                  group.items.length === 0 ? null : (
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
                      <StaffVisualProductGrid items={group.items} />
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        ) : null}
      </main>

      {cartCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-amber-200/60 bg-white/95 p-3 backdrop-blur dark:border-amber-900/40 dark:bg-neutral-900/95">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4 text-amber-600" />
              {cartCount} art. · {cartTotal.toFixed(2)} €
            </div>
            <Button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
              Envoyer en cuisine
            </Button>
          </div>
        </div>
      ) : null}

      <QrProductDetailSheet
        product={detailItem}
        catalog={menuItems}
        oftenOrderedWith={{}}
        open={Boolean(detailItem && detailItemId)}
        onClose={closeDetail}
        onOpenProduct={openDetail}
        onConfirm={(payload) => {
          const product = catalog.find((p) => p.id === payload.productId)
          if (!product) return
          addToCart({
            product,
            quantity: payload.quantity,
            unitPrice: payload.unitPrice,
            variant: payload.variant,
            extras: payload.extras,
          })
          closeDetail()
        }}
      />
    </div>
  )
}
