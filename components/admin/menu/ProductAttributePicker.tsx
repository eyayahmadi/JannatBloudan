"use client"

import type { ProductMenuStatus } from "@/lib/menu/product-availability-status"
import { MENU_STATUS_LABELS } from "@/lib/menu/product-availability-status"
import {
  MENU_ATTRIBUTE_GROUPS,
  MENU_PRODUCT_ATTRIBUTES,
  toggleAttributeTag,
} from "@/lib/menu/product-attributes"
import { cn } from "@/lib/utils"

type ProductAttributePickerProps = {
  value: string[]
  onChange: (tags: string[]) => void
  menuStatus?: ProductMenuStatus
  onMenuStatusChange?: (status: ProductMenuStatus) => void
  className?: string
}

const STATUS_OPTIONS: ProductMenuStatus[] = ["available", "sold_out", "hidden"]

export function ProductAttributePicker({
  value,
  onChange,
  menuStatus = "available",
  onMenuStatusChange,
  className,
}: ProductAttributePickerProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <p className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        Attribute werden nur manuell gesetzt. Verfügbarkeit steuert die QR-Anzeige sofort.
      </p>

      {onMenuStatusChange ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Verfügbarkeit</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => {
              const active = menuStatus === status
              const lbl = MENU_STATUS_LABELS[status]
              return (
                <label
                  key={status}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                    active && status === "available" && "border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-900/30",
                    active && status === "sold_out" && "border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-900/30",
                    active && status === "hidden" && "border-slate-500 bg-slate-100 text-slate-900 dark:bg-slate-800",
                    !active && "border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800",
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="product-menu-status"
                    checked={active}
                    onChange={() => onMenuStatusChange(status)}
                  />
                  <span>{lbl.de}</span>
                  <span className="text-xs text-slate-400">{lbl.en}</span>
                </label>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Verfügbar = bestellbar · Ausverkauft = sichtbar, nicht bestellbar · Versteckt = nicht im QR-Menü
          </p>
        </div>
      ) : null}

      {MENU_ATTRIBUTE_GROUPS.map((group) => {
        const attrs = MENU_PRODUCT_ATTRIBUTES.filter((a) => a.group === group.id)
        if (attrs.length === 0) return null
        return (
          <div key={group.id}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.labelDe}</p>
            <div className="flex flex-wrap gap-2">
              {attrs.map((attr) => {
                const checked = value.includes(attr.id)
                return (
                  <label
                    key={attr.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                      checked
                        ? "border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-900/30 dark:text-amber-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={(e) => onChange(toggleAttributeTag(value, attr.id, e.target.checked))}
                    />
                    <span>{attr.labelDe}</span>
                    <span className="text-xs text-slate-400" dir="rtl">
                      {attr.labelAr}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
