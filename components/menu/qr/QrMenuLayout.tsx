"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutGrid } from "lucide-react"
import type { QrCategoryNavItem } from "@/lib/menu/qr-printed-menu"
import { resolveQrCategoryLabel } from "@/lib/menu/qr-category-i18n"
import type { Locale } from "@/lib/i18n/config"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type QrMenuLayoutProps = {
  categories: QrCategoryNavItem[]
  tableId: string
  /** `null` = QR homepage (Bestseller / Heute empfohlen). */
  activeSlug?: string | null
  children: React.ReactNode
  className?: string
  hrefForCategory?: (slug: string) => string
  hrefForHome?: string
}

function CategoryItem({
  icon,
  label,
  active,
  onSelect,
}: {
  icon: string
  label: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "category-item w-full rounded-xl px-3 py-2.5 text-start text-sm font-medium transition-colors",
        active
          ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/20"
          : "border border-amber-200/80 bg-white text-amber-950 hover:border-amber-300 dark:border-amber-800 dark:bg-neutral-900 dark:text-amber-100 dark:hover:border-amber-700",
      )}
    >
      <span className="flex items-center gap-2">
        <span className="shrink-0 text-base leading-none">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
    </button>
  )
}

function CategoryList({
  categories,
  tableId,
  activeSlug,
  locale,
  t,
  onSelect,
  hrefForCategory,
  hrefForHome,
}: {
  categories: QrCategoryNavItem[]
  tableId: string
  activeSlug?: string | null
  locale: Locale
  t: (key: string) => string
  onSelect: (href: string) => void
  hrefForCategory?: (slug: string) => string
  hrefForHome?: string
}) {
  const homeHref = hrefForHome ?? `/table/${tableId}/menu`
  const isHome = activeSlug == null

  return (
    <div className="category-drawer flex flex-col gap-2">
      <CategoryItem
        icon="🏠"
        label={t("menu.qrHome")}
        active={isHome}
        onSelect={() => onSelect(homeHref)}
      />
      {categories.map((category) => {
        const { primary } = resolveQrCategoryLabel(
          category.slug,
          locale,
          t,
          category.labelDe,
          category.labelAr,
        )
        const href =
          hrefForCategory?.(category.slug) ?? `/table/${tableId}/menu/${category.slug}`
        return (
          <CategoryItem
            key={category.slug}
            icon={category.icon}
            label={primary}
            active={activeSlug === category.slug}
            onSelect={() => onSelect(href)}
          />
        )
      })}
    </div>
  )
}

/**
 * QR table menu shell — vertical category sidebar (desktop) + drawer (mobile).
 */
export function QrMenuLayout({
  categories,
  tableId,
  activeSlug = null,
  children,
  className,
  hrefForCategory,
  hrefForHome,
}: QrMenuLayoutProps) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navigate = (href: string) => {
    setDrawerOpen(false)
    router.push(href)
  }

  if (categories.length === 0) {
    return <div className={cn("menu-content min-w-0", className)}>{children}</div>
  }

  return (
    <div
      className={cn(
        "qr-menu-layout relative z-0 mx-auto grid max-w-4xl grid-cols-1 gap-4 px-4 md:grid-cols-[11.25rem_minmax(0,1fr)]",
        className,
      )}
    >
      <aside
        className="category-sidebar sticky top-3 hidden max-h-[calc(100dvh-1.5rem)] self-start overflow-y-auto overscroll-contain md:flex md:flex-col md:gap-2"
        aria-label={t("menu.qrCategoriesAria")}
        data-menu-category-sidebar
      >
        <CategoryList
          categories={categories}
          tableId={tableId}
          activeSlug={activeSlug}
          locale={locale}
          t={t}
          onSelect={navigate}
          hrefForCategory={hrefForCategory}
          hrefForHome={hrefForHome}
        />
      </aside>

      <div className="menu-content min-w-0">
        <div className="mb-3 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white px-4 py-2 text-sm font-medium text-amber-950 shadow-sm transition hover:border-amber-300 dark:border-amber-800 dark:bg-neutral-900 dark:text-amber-100"
          >
            <LayoutGrid className="h-4 w-4" />
            {t("menu.qrCategoriesAria")}
          </button>
        </div>

        {children}
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[min(100%,18rem)] gap-0 p-0">
          <SheetHeader className="border-b border-amber-200/60 px-4 py-4 dark:border-amber-900/40">
            <SheetTitle className="text-left font-display text-base text-amber-950 dark:text-white">
              {t("menu.qrCategoriesAria")}
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-3 py-3">
            <CategoryList
              categories={categories}
              tableId={tableId}
              activeSlug={activeSlug}
              locale={locale}
              t={t}
              onSelect={navigate}
              hrefForCategory={hrefForCategory}
              hrefForHome={hrefForHome}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
