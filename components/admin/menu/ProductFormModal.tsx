"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProductAttributePicker } from "@/components/admin/menu/ProductAttributePicker"
import { ProductFormExtrasPanel } from "@/components/admin/menu/ProductFormExtrasPanel"
import { ProductFormVariantsPanel } from "@/components/admin/menu/ProductFormVariantsPanel"
import { ProductFormRecipePanel } from "@/components/admin/menu/ProductFormRecipePanel"
import { ProductMenuImageUpload } from "@/components/admin/ProductMenuImageUpload"
import type { ProductMenuStatus } from "@/lib/menu/product-availability-status"
import { cn } from "@/lib/utils"

export type ProductFormState = {
  name: string
  name_ar: string
  description: string
  price: string
  category_id: string
  stock_quantity: string
  image_url: string
  station: string
  display_order: string
  menu_status: ProductMenuStatus
  tags: string[]
  recommended_ids: string[]
}

type Category = { id: string; name: string }
type ProductOption = { id: string; name: string }
type Ingredient = { id: string; name: string; unit?: string | null; stock_quantity?: number | null }
type RecipeLine = { quantity: number; ingredients?: Ingredient | null }

type ProductFormModalProps = {
  open: boolean
  editingId: string | null
  editingName?: string
  form: ProductFormState
  categories: Category[]
  productOptions: ProductOption[]
  ingredients: Ingredient[]
  recipeLines?: RecipeLine[]
  saving: boolean
  onClose: () => void
  onChange: (patch: Partial<ProductFormState>) => void
  onSave: () => void
}

const TABS = [
  { id: "general", label: "Allgemein" },
  { id: "attributes", label: "Attribute" },
  { id: "variants", label: "Varianten" },
  { id: "extras", label: "Extras" },
  { id: "recipe", label: "Rezeptur" },
  { id: "recommendations", label: "Empfehlungen" },
] as const

type TabId = (typeof TABS)[number]["id"]

export function ProductFormModal({
  open,
  editingId,
  editingName,
  form,
  categories,
  productOptions,
  ingredients,
  recipeLines,
  saving,
  onClose,
  onChange,
  onSave,
}: ProductFormModalProps) {
  const [tab, setTab] = useState<TabId>("general")

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">{editingId ? "Produkt bearbeiten" : "Neues Produkt"}</h2>
            {editingName ? <p className="text-sm text-slate-500">{editingName}</p> : null}
          </div>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b px-4 py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition",
                tab === t.id ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {tab === "general" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Name (DE)</Label>
                  <Input value={form.name} onChange={(e) => onChange({ name: e.target.value })} />
                </div>
                <div>
                  <Label>Name (AR)</Label>
                  <Input value={form.name_ar} onChange={(e) => onChange({ name_ar: e.target.value })} dir="rtl" />
                </div>
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea value={form.description} onChange={(e) => onChange({ description: e.target.value })} rows={3} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Preis (€)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => onChange({ price: e.target.value })} />
                </div>
                <div>
                  <Label>Sortierung</Label>
                  <Input type="number" value={form.display_order} onChange={(e) => onChange({ display_order: e.target.value })} />
                </div>
                <div>
                  <Label>Station</Label>
                  <select
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={form.station}
                    onChange={(e) => onChange({ station: e.target.value })}
                  >
                    <option value="KITCHEN">KITCHEN</option>
                    <option value="BAR">BAR</option>
                    <option value="SHISHA">SHISHA</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Kategorie</Label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={form.category_id}
                  onChange={(e) => onChange({ category_id: e.target.value })}
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Produktbild</Label>
                <ProductMenuImageUpload value={form.image_url} onChange={(url) => onChange({ image_url: url })} />
              </div>
            </>
          ) : null}

          {tab === "attributes" ? (
            <ProductAttributePicker
              value={form.tags}
              onChange={(tags) => onChange({ tags })}
              menuStatus={form.menu_status}
              onMenuStatusChange={(menu_status) => onChange({ menu_status })}
            />
          ) : null}

          {tab === "variants" ? <ProductFormVariantsPanel productId={editingId} /> : null}
          {tab === "extras" ? <ProductFormExtrasPanel productId={editingId} /> : null}
          {tab === "recipe" ? (
            <ProductFormRecipePanel productId={editingId} ingredients={ingredients} initialLines={recipeLines} />
          ) : null}

          {tab === "recommendations" ? (
            <div>
              <Label>Empfohlene Produkte (Passt dazu)</Label>
              <select
                multiple
                className="mt-1 h-48 w-full rounded-md border px-2 py-1 text-sm"
                value={form.recommended_ids}
                onChange={(e) =>
                  onChange({ recommended_ids: Array.from(e.target.selectedOptions).map((o) => o.value) })
                }
              >
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">Strg/Cmd + Klick für Mehrfachauswahl</p>
            </div>
          ) : null}
        </div>

        <div className="border-t px-5 py-4">
          <Button type="button" className="w-full" disabled={saving || !form.name.trim()} onClick={onSave}>
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  )
}
