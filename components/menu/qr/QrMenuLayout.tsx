"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { LayoutGrid, X } from "lucide-react"
import type { QrCategoryNavItem } from "@/lib/menu/qr-printed-menu"
import { resolveQrCategoryLabel } from "@/lib/menu/qr-category-i18n"
import type { Locale } from "@/lib/i18n/config"
import { useI18n } from "@/lib/i18n/context"
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock"
import { cn } from "@/lib/utils"

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
 * Uses native document scroll; drawer lock is released on close (Android-safe).
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useBodyScrollLock(drawerOpen && isMobile)

  const navigate = (href: string) => {
    setDrawerOpen(false)
    router.push(href)
  }

  if (categories.length === 0) {
    return <div className={cn("menu-content min-w-0", className)}>{children}</div>
  }

  return (
    <div className={cn("qr-menu-layout relative z-0 mx-auto max-w-4xl px-4", className)}>
      <aside
        className="category-sidebar max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain"
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
        <div className="qr-categories-mobile-trigger mb-3">
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

      {drawerOpen && isMobile && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
              <button
                type="button"
                className="absolute inset-0 bg-black/45"
                aria-label={t("menu.qrBack")}
                onClick={() => setDrawerOpen(false)}
              />
              <aside className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col bg-[#faf6f0] shadow-2xl dark:bg-neutral-950">
                <div className="flex items-center justify-between border-b border-amber-200/60 px-4 py-4 dark:border-amber-900/40">
                  <p className="font-display text-base font-semibold text-amber-950 dark:text-white">
                    {t("menu.qrCategoriesAria")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-full p-2 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40"
                    aria-label={t("menu.qrBack")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
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
              </aside>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
