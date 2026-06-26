"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  Flame,
  Minus,
  Plus,
  X,
  UtensilsCrossed,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useMenuCart } from "@/contexts/MenuCartContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/context"
import type { DigitalMenuProduct, MenuClientFilters, MenuSortId } from "@/lib/menu/digital-menu-product"
import { formatMenuPriceLabel } from "@/lib/menu/menu-display"
import { filterMenuProducts, similarProducts, sortMenuProducts } from "@/lib/menu/filter-menu-client"
import { filterProductsByAttributeTag, QR_MENU_ATTRIBUTE_FILTERS, attributeBadgeLabel, type QrAttributeFilterId } from "@/lib/menu/product-attributes"
import { ProductAttributeBadges } from "@/components/menu/ProductAttributeBadges"
import { QrAttributeFilterChips } from "@/components/menu/qr/QrAttributeFilterChips"
import type { Station } from "@/lib/stations/config"
import { StationStatusBanner } from "@/components/stations/StationStatusBanner"
import { groupMenuItemsByCategory } from "@/lib/menu/menu-category-groups"
import { MenuSubcategoryHeader } from "@/components/menu/MenuSubcategoryHeader"
import { ProductCustomizationModal } from "@/components/menu/ProductCustomizationModal"
import { formatKitchenTicketNotes, formatVariantLabel } from "@/lib/menu/cart-line"

type CatalogCategoryRow = {
  id: string
  name: string
  slug: string
  section?: string | null
}

const SECTION_IDS = ["all", "food", "desserts", "drinks", "special"] as const
type SectionId = (typeof SECTION_IDS)[number]

const SECTION_ICON: Record<SectionId, LucideIcon> = {
  all: UtensilsCrossed,
  food: UtensilsCrossed,
  desserts: Star,
  drinks: Sparkles,
  special: Flame,
}

function isSectionId(s: string): s is SectionId {
  return (SECTION_IDS as readonly string[]).includes(s)
}

export function DigitalMenuExperience() {
  const { locale, t } = useI18n()
  const { add, open, setOpen, items, setQty, subtotal, count, clear } = useMenuCart()
  const [data, setData] = useState<{
    catalog: DigitalMenuProduct[]
    by_section: Record<string, DigitalMenuProduct[]>
    chef_choice: DigitalMenuProduct[]
    recommended: DigitalMenuProduct[]
    most_popular: DigitalMenuProduct[]
    categories: CatalogCategoryRow[]
    often_ordered_with: Record<string, string[]>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [section, setSection] = useState<SectionId>("all")
  const [categorySlug, setCategorySlug] = useState("all")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [availableOnly, setAvailableOnly] = useState(false)
  const [popularOnly, setPopularOnly] = useState(false)
  const [newOnly, setNewOnly] = useState(false)
  const [spicyOnly, setSpicyOnly] = useState(false)
  const [vegetarianOnly, setVegetarianOnly] = useState(false)
  const [attributeFilter, setAttributeFilter] = useState<QrAttributeFilterId>("all")
  const [stationFilter, setStationFilter] = useState<"all" | Station>("all")
  const [sortBy, setSortBy] = useState<MenuSortId>("name")
  const [placing, setPlacing] = useState(false)
  const [customizeItem, setCustomizeItem] = useState<DigitalMenuProduct | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({
        locale,
        include_unavailable: "1",
      })
      const res = await fetch(`/api/menu?${qs.toString()}`, { cache: "no-store" })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error)
      setData({
        catalog: j.items ?? [],
        by_section: j.by_section ?? {},
        chef_choice: j.chef_choice ?? [],
        recommended: j.recommended ?? [],
        most_popular: j.most_popular ?? [],
        categories: j.categories ?? [],
        often_ordered_with: j.often_ordered_with ?? {},
      })
    } catch (e) {
      console.error(e)
      toast.error(t("menu.errorLoad"))
    } finally {
      setLoading(false)
    }
  }, [locale, t])

  useEffect(() => {
    void load()
  }, [load])

  const parsedMin = priceMin.trim() === "" ? null : Number(priceMin.replace(",", "."))
  const parsedMax = priceMax.trim() === "" ? null : Number(priceMax.replace(",", "."))

  const tagMeta = useCallback(
    (tag: string) => {
      const badge = attributeBadgeLabel(tag)
      if (badge) {
        const text = locale === "ar" ? badge.ar : badge.de
        if (tag === "popular") return { text, className: "bg-amber-500/20 text-amber-900" }
        if (tag === "new") return { text, className: "bg-emerald-500/20 text-emerald-900" }
        if (tag === "spicy") return { text, className: "bg-rose-500/20 text-rose-900" }
        if (tag === "vegetarian" || tag === "vegan")
          return { text, className: "bg-lime-500/20 text-lime-900" }
        if (tag === "kids") return { text, className: "bg-sky-500/20 text-sky-900" }
        if (tag === "chef_recommendation") return { text, className: "bg-violet-500/20 text-violet-900" }
        return { text, className: "bg-slate-500/10 text-slate-700" }
      }
      if (tag === "popular" || tag === "populaire")
        return { text: t("menu.tagPopular"), className: "bg-amber-500/20 text-amber-900" }
      if (tag === "new" || tag === "nouveau")
        return { text: t("menu.tagNew"), className: "bg-emerald-500/20 text-emerald-900" }
      if (tag === "spicy" || tag === "épicé")
        return { text: t("menu.tagSpicy"), className: "bg-rose-500/20 text-rose-900" }
      if (tag === "vegetarian" || tag === "végétarien")
        return { text: t("menu.tagVegetarian"), className: "bg-lime-500/20 text-lime-900" }
      return { text: tag, className: "bg-slate-500/10 text-slate-700" }
    },
    [t, locale],
  )

  const categoriesForSection = useMemo(() => {
    if (!data) return []
    if (section === "all") return data.categories
    return data.categories.filter((c) => (c.section ?? "food") === section)
  }, [data, section])

  const filtered = useMemo(() => {
    if (!data) return []
    const f: MenuClientFilters = {
      search: q,
      section: section as MenuClientFilters["section"],
      categorySlug,
      priceMin:
        parsedMin !== null && Number.isFinite(parsedMin) ? parsedMin : null,
      priceMax:
        parsedMax !== null && Number.isFinite(parsedMax) ? parsedMax : null,
      availableOnly,
      popularOnly,
      newOnly,
      spicyOnly,
      vegetarianOnly,
      station: stationFilter,
    }
    const list = filterMenuProducts(data.catalog as DigitalMenuProduct[], f)
    const tagged = filterProductsByAttributeTag(list, attributeFilter)
    return sortMenuProducts(tagged, sortBy)
  }, [
    data,
    q,
    section,
    categorySlug,
    parsedMin,
    parsedMax,
    availableOnly,
    popularOnly,
    newOnly,
    spicyOnly,
    vegetarianOnly,
    stationFilter,
    sortBy,
    attributeFilter,
  ])

  const groupedSection = useMemo(() => {
    if (categorySlug !== "all") return null
    if (section === "drinks" || section === "desserts") return section
    return null
  }, [section, categorySlug])

  const groupedItems = useMemo(() => {
    if (!groupedSection) return null
    return groupMenuItemsByCategory(filtered, groupedSection)
  }, [filtered, groupedSection])

  const handleAddProduct = useCallback(
    (item: DigitalMenuProduct) => {
      if (item.is_customizable) {
        setCustomizeItem(item)
        return
      }
      add({
        productId: item.id,
        name: item.name,
        basePrice: item.price,
        price: item.price,
        maxOrderable: item.max_orderable,
      })
    },
    [add],
  )

  const catalogById = useMemo(() => new Map(data?.catalog.map((p) => [p.id, p]) ?? []), [data])

  const resetFilters = useCallback(() => {
    setQ("")
    setSection("all")
    setCategorySlug("all")
    setPriceMin("")
    setPriceMax("")
    setAvailableOnly(false)
    setPopularOnly(false)
    setNewOnly(false)
    setSpicyOnly(false)
    setVegetarianOnly(false)
    setAttributeFilter("all")
    setStationFilter("all")
    setSortBy("name")
  }, [])

  const showcaseVisible =
    section === "all" &&
    !q.trim() &&
    categorySlug === "all" &&
    !availableOnly &&
    !popularOnly &&
    !newOnly &&
    !spicyOnly &&
    !vegetarianOnly &&
    attributeFilter === "all" &&
    stationFilter === "all" &&
    sortBy === "name" &&
    priceMin === "" &&
    priceMax === ""

  type Chip = { key: string; label: string; onClear: () => void }
  const activeChips = useMemo((): Chip[] => {
    const chips: Chip[] = []
    if (q.trim()) chips.push({ key: "q", label: `${t("menu.chip.search")}: ${q.trim()}`, onClear: () => setQ("") })
    if (section !== "all")
      chips.push({
        key: "section",
        label: `${t("menu.chip.section")}: ${t(`menu.section.${section}`)}`,
        onClear: () => setSection("all"),
      })
    if (categorySlug !== "all") {
      const nm = data?.categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug
      chips.push({
        key: "cat",
        label: `${t("menu.chip.category")}: ${nm}`,
        onClear: () => setCategorySlug("all"),
      })
    }
    if (priceMin !== "") chips.push({ key: "pmin", label: `${t("menu.chip.min")}: ${priceMin} €`, onClear: () => setPriceMin("") })
    if (priceMax !== "") chips.push({ key: "pmax", label: `${t("menu.chip.max")}: ${priceMax} €`, onClear: () => setPriceMax("") })
    if (availableOnly)
      chips.push({ key: "avail", label: t("menu.filterAvailableShort"), onClear: () => setAvailableOnly(false) })
    if (popularOnly) chips.push({ key: "pop", label: t("menu.popularFilter"), onClear: () => setPopularOnly(false) })
    if (newOnly) chips.push({ key: "new", label: t("menu.filterNewShort"), onClear: () => setNewOnly(false) })
    if (spicyOnly) chips.push({ key: "spicy", label: t("menu.filterSpicyShort"), onClear: () => setSpicyOnly(false) })
    if (vegetarianOnly)
      chips.push({
        key: "veg",
        label: t("menu.filterVegetarianShort"),
        onClear: () => setVegetarianOnly(false),
      })
    if (attributeFilter !== "all") {
      const chip = QR_MENU_ATTRIBUTE_FILTERS.find((c) => c.id === attributeFilter)
      chips.push({
        key: "attr",
        label: chip?.labelDe ?? attributeFilter,
        onClear: () => setAttributeFilter("all"),
      })
    }
    if (stationFilter !== "all") {
      chips.push({
        key: "station",
        label: `${t("menu.chip.station")}: ${t(stationFilter === "KITCHEN" ? "stations.kitchen" : stationFilter === "BAR" ? "stations.bar" : "stations.shisha")}`,
        onClear: () => setStationFilter("all"),
      })
    }
    if (sortBy !== "name")
      chips.push({
        key: "sort",
        label: `${t("menu.sortLabel")}: ${t(`menu.sort.${sortBy}`)}`,
        onClear: () => setSortBy("name"),
      })
    return chips
  }, [
    q,
    section,
    categorySlug,
    priceMin,
    priceMax,
    availableOnly,
    popularOnly,
    newOnly,
    spicyOnly,
    vegetarianOnly,
    attributeFilter,
    stationFilter,
    sortBy,
    data?.categories,
    t,
  ])

  const placeOrder = async () => {
    if (items.length === 0) return
    setPlacing(true)
    try {
      const body = {
        customerName: "Web Menu",
        orderType: "a emporter",
        subtotal: subtotal,
        deliveryFee: 0,
        tax: 0,
        total: subtotal,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          subtotal: i.price * i.quantity,
          specialInstructions: formatKitchenTicketNotes(i.extras, i.variant) ?? undefined,
        })),
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const j = await res.json()
      if (!res.ok) {
        toast.error(j.error || t("menu.orderFailed"))
        return
      }
      toast.success(t("menu.orderSuccess"))
      clear()
      setOpen(false)
      void load()
    } finally {
      setPlacing(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {t("menu.loading")}
      </div>
    )
  }

  if (!data?.catalog?.length) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">{t("menu.emptyTitle")}</p>
        <p className="text-sm">{t("menu.emptyHint")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="site-container pt-4">
        <StationStatusBanner />
      </div>
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="site-container flex flex-col gap-3 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("menu.searchPlaceholder")}
                className="pl-9"
                aria-label={t("menu.searchPlaceholder")}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={resetFilters}>
                <RotateCcw className="h-3.5 w-3.5" />
                {t("menu.resetFilters")}
              </Button>
              <Button type="button" className="relative" onClick={() => setOpen(true)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {t("menu.cart")}
                {count > 0 && (
                  <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs text-primary-foreground">
                    {count}
                  </span>
                )}
              </Button>
            </div>
          </div>

          <QrAttributeFilterChips activeId={attributeFilter} onSelect={setAttributeFilter} />

          <div className="flex w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECTION_IDS.map((sid) => {
              const Icon = SECTION_ICON[sid]
              return (
                <Button
                  key={sid}
                  type="button"
                  size="sm"
                  variant={section === sid ? "default" : "secondary"}
                  className={cn(
                    "shrink-0 rounded-full",
                    sid === "special" && section === sid && "bg-violet-900 text-violet-50",
                  )}
                  onClick={() => {
                    setSection(sid)
                    setCategorySlug("all")
                  }}
                >
                  <Icon className="mr-1 h-4 w-4" />
                  {t(`menu.section.${sid}`)}
                </Button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide">{t("menu.filtersTitle")}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">{t("menu.categoryLabel")}</Label>
              <Select value={categorySlug} onValueChange={setCategorySlug}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("menu.categoryAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("menu.categoryAll")}</SelectItem>
                  {categoriesForSection.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("menu.priceMin")}</Label>
              <Input
                inputMode="decimal"
                placeholder="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("menu.priceMax")}</Label>
              <Input
                inputMode="decimal"
                placeholder="∞"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">{t("menu.sortLabel")}</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as MenuSortId)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t("menu.sort.name")}</SelectItem>
                  <SelectItem value="price_asc">{t("menu.sort.price_asc")}</SelectItem>
                  <SelectItem value="price_desc">{t("menu.sort.price_desc")}</SelectItem>
                  <SelectItem value="popular">{t("menu.sort.popular")}</SelectItem>
                  <SelectItem value="new">{t("menu.sort.new")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-2 xl:col-span-2">
              <Label className="text-xs text-muted-foreground">{t("menu.stationLabel")}</Label>
              <Select
                value={stationFilter}
                onValueChange={(v) => setStationFilter(v as "all" | Station)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("stations.allStations")}</SelectItem>
                  <SelectItem value="KITCHEN">{t("stations.kitchen")}</SelectItem>
                  <SelectItem value="BAR">{t("stations.bar")}</SelectItem>
                  <SelectItem value="SHISHA">{t("stations.shisha")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={availableOnly} onCheckedChange={(v) => setAvailableOnly(v === true)} />
              {t("menu.filterAvailable")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={popularOnly} onCheckedChange={(v) => setPopularOnly(v === true)} />
              {t("menu.popularFilter")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={newOnly} onCheckedChange={(v) => setNewOnly(v === true)} />
              {t("menu.filterNew")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={spicyOnly} onCheckedChange={(v) => setSpicyOnly(v === true)} />
              {t("menu.filterSpicy")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={vegetarianOnly}
                onCheckedChange={(v) => setVegetarianOnly(v === true)}
              />
              {t("menu.filterVegetarian")}
            </label>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <Badge
                  key={chip.key}
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1.5 hover:bg-muted-foreground/20"
                  onClick={() => chip.onClear()}
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.chef_choice.length > 0 && showcaseVisible && (
        <div className="site-container">
          <Block title={t("menu.chefBlockTitle")} subtitle={t("menu.chefBlockSubtitle")} variant="amber">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.chef_choice.slice(0, 3).map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  catalog={data.catalog}
                  oftenOrderedWith={data.often_ordered_with[item.id]}
                  onSuggestSearch={(name) => setQ(name)}
                  onAdd={handleAddProduct}
                  tagMeta={tagMeta}
                />
              ))}
            </div>
          </Block>
        </div>
      )}

      {data.most_popular.length > 0 && showcaseVisible && (
        <div className="site-container">
          <Block title={t("menu.popularBlockTitle")} subtitle={t("menu.popularBlockSubtitle")} variant="default">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.most_popular.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  catalog={data.catalog}
                  oftenOrderedWith={data.often_ordered_with[item.id]}
                  onSuggestSearch={(name) => setQ(name)}
                  onAdd={handleAddProduct}
                  tagMeta={tagMeta}
                />
              ))}
            </div>
          </Block>
        </div>
      )}

      {data.recommended.length > 0 && showcaseVisible && (
        <div className="site-container">
          <Block title={t("menu.recommendedBlockTitle")} subtitle={t("menu.recommendedBlockSubtitle")} variant="violet">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.recommended.slice(0, 4).map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  catalog={data.catalog}
                  oftenOrderedWith={data.often_ordered_with[item.id]}
                  onSuggestSearch={(name) => setQ(name)}
                  onAdd={handleAddProduct}
                  tagMeta={tagMeta}
                />
              ))}
            </div>
          </Block>
        </div>
      )}

      <div
        className={cn(
          "site-container",
          section === "special" && "rounded-3xl bg-zinc-950 p-4 text-zinc-100 ring-1 ring-violet-500/30",
          section === "drinks" && "rounded-3xl bg-gradient-to-br from-cyan-50 to-blue-100 p-4",
          section === "desserts" && "rounded-3xl bg-gradient-to-br from-rose-50 to-amber-50 p-4",
        )}
      >
        <h2
          className={cn(
            "mb-4 text-xl font-semibold",
            section === "special" && "text-violet-200",
          )}
        >
          {section === "all"
            ? t("menu.menuTitle")
            : isSectionId(section)
              ? t(`menu.section.${section}`)
              : t("menu.categoryFallback")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groupedItems
            ? groupedItems.map((group) => (
                <div key={group.key} className="contents">
                  <div className="col-span-full">
                    <MenuSubcategoryHeader
                      icon={group.icon}
                      labelDe={group.labelDe}
                      labelAr={group.labelAr}
                      drink={groupedSection === "drinks"}
                      sweet={groupedSection === "desserts"}
                    />
                  </div>
                  {group.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <MenuCard
                        item={item}
                        catalog={data.catalog}
                        oftenOrderedWith={data.often_ordered_with[item.id]}
                        onSuggestSearch={(name) => setQ(name)}
                        onAdd={handleAddProduct}
                        tagMeta={tagMeta}
                        dark={section === "special"}
                        sweet={section === "desserts"}
                        drink={section === "drinks"}
                      />
                    </motion.div>
                  ))}
                </div>
              ))
            : filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <MenuCard
                    item={item}
                    catalog={data.catalog}
                    oftenOrderedWith={data.often_ordered_with[item.id]}
                    onSuggestSearch={(name) => setQ(name)}
                    onAdd={handleAddProduct}
                    tagMeta={tagMeta}
                    dark={section === "special"}
                    sweet={section === "desserts"}
                    drink={section === "drinks"}
                  />
                </motion.div>
              ))}
        </div>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm font-medium text-muted-foreground">{t("menu.noResults")}</p>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            className="fixed right-0 top-0 z-[60] h-full w-full max-w-md border-l border-border bg-background shadow-2xl"
          >
            <div className="flex h-full flex-col p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("menu.cartDrawerTitle")}</h3>
                <Button type="button" size="icon" variant="ghost" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("menu.cartEmpty")}</p>
                ) : (
                  items.map((i) => (
                    <div
                      key={i.lineId}
                      className="flex items-center justify-between gap-2 rounded-xl border p-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{i.name}</p>
                        {i.variant ? (
                          <p className="text-xs text-muted-foreground">{formatVariantLabel(i.variant)}</p>
                        ) : null}
                        {i.extras.length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {i.extras.map((e) => `+ ${e.name}`).join(", ")}
                          </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {(i.price * i.quantity).toFixed(2)} €
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={() => setQty(i.lineId, i.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center">{i.quantity}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={() => setQty(i.lineId, i.quantity + 1)}
                          disabled={i.quantity >= i.maxOrderable}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>{t("menu.total")}</span>
                  <span className="font-semibold">{subtotal.toFixed(2)} €</span>
                </div>
                <Button
                  className="w-full"
                  disabled={items.length === 0 || placing}
                  onClick={() => void placeOrder()}
                >
                  {placing ? t("menu.orderPlacing") : t("menu.orderPlace")}
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <ProductCustomizationModal
        open={!!customizeItem}
        product={
          customizeItem
            ? {
                id: customizeItem.id,
                name: customizeItem.name,
                name_ar: customizeItem.name_ar,
                price: customizeItem.price,
                modifiers: customizeItem.modifiers,
                variants: customizeItem.variants,
              }
            : null
        }
        onClose={() => setCustomizeItem(null)}
        addLabel={t("menu.addToCart")}
        onConfirm={(payload) => {
          add({
            productId: payload.productId,
            name: payload.name,
            basePrice: payload.basePrice,
            price: payload.unitPrice,
            maxOrderable: customizeItem?.max_orderable ?? 99,
            variant: payload.variant,
            extras: payload.extras,
            quantity: payload.quantity,
          })
          setCustomizeItem(null)
        }}
      />
    </div>
  )
}

function Block({
  title,
  subtitle,
  variant,
  children,
}: {
  title: string
  subtitle: string
  variant: "default" | "amber" | "violet"
  children: React.ReactNode
}) {
  const cls =
    variant === "amber"
      ? "border-amber-200/50 bg-amber-50/40"
      : variant === "violet"
        ? "border-violet-200/50 bg-violet-50/40"
        : "border-border/60 bg-card/30"
  return (
    <section className={cn("rounded-3xl border p-4 sm:p-6", cls)}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function MenuCard({
  item,
  catalog,
  oftenOrderedWith,
  onSuggestSearch,
  onAdd,
  tagMeta,
  dark,
  sweet,
  drink,
}: {
  item: DigitalMenuProduct
  catalog: DigitalMenuProduct[]
  oftenOrderedWith?: string[] | undefined
  onSuggestSearch: (name: string) => void
  tagMeta: (tag: string) => { text: string; className: string }
  onAdd: (item: DigitalMenuProduct) => void
  dark?: boolean
  sweet?: boolean
  drink?: boolean
}) {
  const { t, locale } = useI18n()
  const can = item.can_order
  const often = useMemo(() => {
    const byId = new Map(catalog.map((p) => [p.id, p]))
    return (oftenOrderedWith ?? []).map((id) => byId.get(id)).filter((x): x is DigitalMenuProduct => !!x)
  }, [catalog, oftenOrderedWith])
  const sim = useMemo(() => similarProducts(catalog, item.id, 3), [catalog, item.id])
  return (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:-translate-y-0.5 hover:shadow-md",
        dark && "border-violet-500/20 bg-zinc-900/90",
        sweet && "border-rose-200/60",
        drink && "border-cyan-200/50 bg-white/80",
        !can && "opacity-80",
      )}
    >
      <div
        className={cn(
          "relative aspect-[4/3] w-full overflow-hidden bg-muted",
          !item.image_url && "flex items-center justify-center text-4xl",
        )}
      >
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className={cn(
              "h-full w-full object-cover transition duration-500 group-hover:scale-105",
              !can && "grayscale-[0.35]",
            )}
          />
        ) : (
          <span>{sectionEmoji(item.section)}</span>
        )}
        {!can ? (
          <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {t("menu.unavailableBadge")}
          </span>
        ) : null}
        {can && item.is_customizable && !item.tags.includes("popular") && !item.tags.includes("best_seller") && !item.tags.includes("new") ? (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-amber-900 shadow dark:bg-zinc-800/90 dark:text-amber-200">
            {item.has_variants && item.modifiers.length > 0
              ? "Wahl"
              : item.has_variants
                ? "Größe"
                : "Extras"}
          </span>
        ) : null}
        {can && (item.tags.includes("popular") || item.tags.includes("best_seller")) ? (
          <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-xs font-medium text-white">
            {t("menu.tagPopular")}
          </span>
        ) : null}
        {can && item.tags.includes("new") ? (
          <span className="absolute left-2 top-10 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            {t("menu.tagNew")}
          </span>
        ) : null}
        {item.availability === "limited" && can ? (
          <span className="absolute bottom-2 right-2 rounded bg-amber-600/90 px-2 py-0.5 text-xs text-white">
            {t("menu.limitedBadge")}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <ProductAttributeBadges tags={item.tags} locale={locale} max={6} size="xs" className="mb-1" />
        <h3 className={cn("font-semibold leading-tight", dark && "text-zinc-50")}>{item.name}</h3>
        {item.name_ar && locale !== "ar" && (
          <p className="text-sm text-muted-foreground" dir="rtl">
            {item.name_ar}
          </p>
        )}
        <p
          className={cn(
            "mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground",
            dark && "text-zinc-300",
          )}
        >
          {item.description}
        </p>
        {(sim.length > 0 || often.length > 0) && (
          <div className="mt-2 space-y-1.5 border-t border-border/70 pt-2 text-[11px] text-muted-foreground">
            {sim.length > 0 ? (
              <p className="flex flex-wrap items-baseline gap-1 gap-y-0.5 leading-relaxed">
                <span className="shrink-0 font-semibold text-foreground">{t("menu.similar")}:</span>
                {sim.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="rounded-full bg-muted px-2 py-0.5 text-left text-muted-foreground transition hover:bg-muted-foreground/15 hover:text-foreground"
                    onClick={() => onSuggestSearch(s.name)}
                  >
                    {s.name}
                  </button>
                ))}
              </p>
            ) : null}
            {often.length > 0 ? (
              <p className="flex flex-wrap items-baseline gap-1 gap-y-0.5 leading-relaxed">
                <span className="shrink-0 font-semibold text-foreground">{t("menu.oftenWith")}:</span>
                {often.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="rounded-full bg-muted px-2 py-0.5 text-left transition hover:bg-muted-foreground/15 hover:text-foreground"
                    onClick={() => onSuggestSearch(s.name)}
                  >
                    {s.name}
                  </button>
                ))}
              </p>
            ) : null}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={cn("text-lg font-bold tabular-nums", drink && "text-cyan-900", sweet && "text-rose-900")}>
            {formatMenuPriceLabel({
              price: item.price,
              hasVariants: item.has_variants,
              variants: item.variants,
              isCustomizable: item.is_customizable && !item.has_variants,
              currency: " €",
            })}
          </span>
          <Button
            type="button"
            size="sm"
            className="transition active:scale-95"
            disabled={!can}
            onClick={() => onAdd(item)}
          >
            {can ? t("menu.addToCart") : t("menu.unavailableShort")}
          </Button>
        </div>
      </div>
    </div>
  )
}

function sectionEmoji(s: string) {
  if (s === "desserts") return "🍰"
  if (s === "drinks") return "🥤"
  if (s === "special") return "💨"
  return "🍽️"
}
