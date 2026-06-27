"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AdminFormModalShell } from "@/components/admin/menu/AdminFormModalShell"
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

type Category = { id: string; name: string; display_order?: number }
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

function serializeForm(form: ProductFormState): string {
  return JSON.stringify({
    ...form,
    tags: [...form.tags].sort(),
    recommended_ids: [...form.recommended_ids].sort(),
  })
}

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
  const nameInputRef = useRef<HTMLInputElement>(null)
  const initialSnapshotRef = useRef("")

  useEffect(() => {
    if (open) {
      setTab("general")
      initialSnapshotRef.current = serializeForm(form)
    }
    // Snapshot when modal opens for a given product/create session only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId])

  useEffect(() => {
    if (!open || tab !== "general") return
    const timer = window.setTimeout(() => nameInputRef.current?.focus(), 120)
    return () => window.clearTimeout(timer)
  }, [open, tab, editingId])

  const isDirty = open && serializeForm(form) !== initialSnapshotRef.current

  const sortedCategories = [...categories].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name),
  )

  return (
    <AdminFormModalShell
      open={open}
      onClose={onClose}
      title={editingId ? "Produkt bearbeiten" : "Neues Produkt"}
      titleId="product-form-title"
      subtitle={editingName}
      size="xl"
      isDirty={isDirty}
      headerExtra={
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                tab === t.id ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
      footer={
        <Button type="button" className="w-full" disabled={saving || !form.name.trim()} onClick={onSave}>
          {saving ? "Speichern…" : "Speichern"}
        </Button>
      }
    >
      <div className="space-y-7">
        {tab === "general" ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name (DE)</Label>
                <Input ref={nameInputRef} value={form.name} onChange={(e) => onChange({ name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Name (AR)</Label>
                <Input value={form.name_ar} onChange={(e) => onChange({ name_ar: e.target.value })} dir="rtl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea value={form.description} onChange={(e) => onChange({ description: e.target.value })} rows={3} />
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Preis (€)</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => onChange({ price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sortierung</Label>
                <Input type="number" value={form.display_order} onChange={(e) => onChange({ display_order: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Station</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                  value={form.station}
                  onChange={(e) => onChange({ station: e.target.value })}
                >
                  <option value="KITCHEN">KITCHEN</option>
                  <option value="BAR">BAR</option>
                  <option value="SHISHA">SHISHA</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                value={form.category_id}
                onChange={(e) => onChange({ category_id: e.target.value })}
              >
                <option value="">—</option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Produktbild</Label>
              <ProductMenuImageUpload compact value={form.image_url} onChange={(url) => onChange({ image_url: url })} />
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
          <div className="space-y-2">
            <Label>Empfohlene Produkte (Passt dazu)</Label>
            <select
              multiple
              className="h-48 w-full rounded-md border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
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
            <p className="text-xs text-slate-500">Strg/Cmd + Klick für Mehrfachauswahl</p>
          </div>
        ) : null}
      </div>
    </AdminFormModalShell>
  )
}
