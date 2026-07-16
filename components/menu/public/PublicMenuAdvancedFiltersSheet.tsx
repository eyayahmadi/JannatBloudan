"use client"

import { RotateCcw, SlidersHorizontal } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useI18n } from "@/lib/i18n/context"
import type { MenuSortId } from "@/lib/menu/digital-menu-product"
import type { Station } from "@/lib/stations/config"

export type PublicAdvancedFiltersDraft = {
  categorySlug: string
  priceMin: string
  priceMax: string
  sortBy: MenuSortId
  stationFilter: "all" | Station
  availableOnly: boolean
  popularOnly: boolean
  newOnly: boolean
  spicyOnly: boolean
  vegetarianOnly: boolean
}

type CategoryOption = { id: string; slug: string; name: string }

type PublicMenuAdvancedFiltersSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: PublicAdvancedFiltersDraft
  onDraftChange: (patch: Partial<PublicAdvancedFiltersDraft>) => void
  categories: CategoryOption[]
  onApply: () => void
  onResetDraft: () => void
}

export function PublicMenuAdvancedFiltersSheet({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  categories,
  onApply,
  onResetDraft,
}: PublicMenuAdvancedFiltersSheetProps) {
  const { t } = useI18n()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[min(88vh,42rem)] overflow-y-auto rounded-t-2xl px-4 pb-6">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            {t("menu.filtersTitle")}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("menu.categoryLabel")}</Label>
            <Select
              value={draft.categorySlug}
              onValueChange={(v) => onDraftChange({ categorySlug: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("menu.categoryAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("menu.categoryAll")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("menu.priceMin")}</Label>
              <Input
                inputMode="decimal"
                placeholder="0"
                value={draft.priceMin}
                onChange={(e) => onDraftChange({ priceMin: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("menu.priceMax")}</Label>
              <Input
                inputMode="decimal"
                placeholder="∞"
                value={draft.priceMax}
                onChange={(e) => onDraftChange({ priceMax: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("menu.sortLabel")}</Label>
            <Select
              value={draft.sortBy}
              onValueChange={(v) => onDraftChange({ sortBy: v as MenuSortId })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">{t("menu.sort.recommended")}</SelectItem>
                <SelectItem value="name">{t("menu.sort.name")}</SelectItem>
                <SelectItem value="price_asc">{t("menu.sort.price_asc")}</SelectItem>
                <SelectItem value="price_desc">{t("menu.sort.price_desc")}</SelectItem>
                <SelectItem value="popular">{t("menu.sort.popular")}</SelectItem>
                <SelectItem value="new">{t("menu.sort.new")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("menu.stationLabel")}</Label>
            <Select
              value={draft.stationFilter}
              onValueChange={(v) => onDraftChange({ stationFilter: v as "all" | Station })}
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

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={draft.availableOnly}
                onCheckedChange={(v) => onDraftChange({ availableOnly: v === true })}
              />
              {t("menu.filterAvailable")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={draft.popularOnly}
                onCheckedChange={(v) => onDraftChange({ popularOnly: v === true })}
              />
              {t("menu.popularFilter")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={draft.newOnly}
                onCheckedChange={(v) => onDraftChange({ newOnly: v === true })}
              />
              {t("menu.filterNew")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={draft.spicyOnly}
                onCheckedChange={(v) => onDraftChange({ spicyOnly: v === true })}
              />
              {t("menu.filterSpicy")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
              <Checkbox
                checked={draft.vegetarianOnly}
                onCheckedChange={(v) => onDraftChange({ vegetarianOnly: v === true })}
              />
              {t("menu.filterVegetarian")}
            </label>
          </div>
        </div>

        <SheetFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" className="w-full gap-1 sm:w-auto" onClick={onResetDraft}>
            <RotateCcw className="h-3.5 w-3.5" />
            {t("menu.resetFilters")}
          </Button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              {t("common.close")}
            </Button>
            <Button type="button" className="w-full sm:w-auto" onClick={onApply}>
              {t("menu.applyFilters")}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function countAdvancedFilters(f: PublicAdvancedFiltersDraft): number {
  let n = 0
  if (f.categorySlug !== "all") n++
  if (f.priceMin.trim()) n++
  if (f.priceMax.trim()) n++
  if (f.sortBy !== "recommended") n++
  if (f.stationFilter !== "all") n++
  if (f.availableOnly) n++
  if (f.popularOnly) n++
  if (f.newOnly) n++
  if (f.spicyOnly) n++
  if (f.vegetarianOnly) n++
  return n
}

export function defaultAdvancedFilters(): PublicAdvancedFiltersDraft {
  return {
    categorySlug: "all",
    priceMin: "",
    priceMax: "",
    sortBy: "recommended",
    stationFilter: "all",
    availableOnly: false,
    popularOnly: false,
    newOnly: false,
    spicyOnly: false,
    vegetarianOnly: false,
  }
}

export function readAdvancedFiltersFromState(state: {
  categorySlug: string
  priceMin: string
  priceMax: string
  sortBy: MenuSortId
  stationFilter: "all" | Station
  availableOnly: boolean
  popularOnly: boolean
  newOnly: boolean
  spicyOnly: boolean
  vegetarianOnly: boolean
}): PublicAdvancedFiltersDraft {
  return {
    categorySlug: state.categorySlug,
    priceMin: state.priceMin,
    priceMax: state.priceMax,
    sortBy: state.sortBy,
    stationFilter: state.stationFilter,
    availableOnly: state.availableOnly,
    popularOnly: state.popularOnly,
    newOnly: state.newOnly,
    spicyOnly: state.spicyOnly,
    vegetarianOnly: state.vegetarianOnly,
  }
}
