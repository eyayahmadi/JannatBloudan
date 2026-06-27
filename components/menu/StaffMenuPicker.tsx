"use client"

import { Plus, Search } from "lucide-react"
import { useMemo, useState } from "react"
import type { DigitalMenuProduct } from "@/lib/menu/digital-menu-product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  filterStaffMenu,
  isProductOrderable,
  staffMenuCategories,
  stationBadgeForProduct,
} from "@/lib/menu/station-order-block"
import type { StationAvailability } from "@/lib/stations/availability"

type StaffMenuPickerProps = {
  catalog: DigitalMenuProduct[]
  categories: Array<{ name: string; slug: string; section?: string; display_order?: number }>
  stationAvailability?: StationAvailability[]
  loading?: boolean
  onAdd: (product: DigitalMenuProduct) => void
  className?: string
}

export function StaffMenuPicker({
  catalog,
  categories,
  stationAvailability = [],
  loading,
  onAdd,
  className,
}: StaffMenuPickerProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Tout")

  const catList = useMemo(() => staffMenuCategories(catalog, categories), [catalog, categories])
  const filtered = useMemo(
    () => filterStaffMenu(catalog, category, search),
    [catalog, category, search],
  )

  if (loading) {
    return <p className="text-sm text-slate-500">Menu wird geladen…</p>
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen…"
          className="pl-9"
        />
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {catList.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
              category === c
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid max-h-[50vh] gap-2 overflow-y-auto sm:grid-cols-2">
        {filtered.map((p) => {
          const orderable = isProductOrderable(p)
          const badge = stationBadgeForProduct(p, stationAvailability)
          return (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border bg-white p-3 dark:bg-slate-900",
                !orderable && "opacity-60",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                {p.name_ar ? (
                  <p className="truncate text-xs text-slate-500" dir="rtl">
                    {p.name_ar}
                  </p>
                ) : null}
                <p className="text-sm font-bold text-amber-700">{p.price.toFixed(2)} €</p>
                {badge ? (
                  <p
                    className={cn(
                      "mt-0.5 text-[10px] font-medium",
                      badge.tone === "danger" && "text-red-600",
                      badge.tone === "warn" && "text-amber-600",
                      badge.tone === "muted" && "text-slate-500",
                    )}
                  >
                    {badge.label}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!orderable}
                onClick={() => onAdd(p)}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
