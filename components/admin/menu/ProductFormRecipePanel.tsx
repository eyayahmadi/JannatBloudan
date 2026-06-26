"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Ingredient = {
  id: string
  name: string
  unit?: string | null
  stock_quantity?: number | null
}

type RecipeLine = {
  ingredient_id: string
  quantity: string
}

type ProductFormRecipePanelProps = {
  productId: string | null
  ingredients: Ingredient[]
  initialLines?: Array<{ quantity: number; ingredients?: Ingredient | null }>
}

export function ProductFormRecipePanel({
  productId,
  ingredients,
  initialLines = [],
}: ProductFormRecipePanelProps) {
  const [lines, setLines] = useState<RecipeLine[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hydrate = useCallback(() => {
    setLines(
      initialLines
        .filter((l) => l.ingredients?.id)
        .map((l) => ({
          ingredient_id: String(l.ingredients!.id),
          quantity: String(l.quantity ?? 0),
        })),
    )
    setSaved(false)
  }, [initialLines])

  useEffect(() => {
    hydrate()
  }, [hydrate, productId])

  if (!productId) {
    return <p className="text-sm text-slate-500">Speichern Sie das Produkt zuerst, dann die Rezeptur bearbeiten.</p>
  }

  const addLine = () => {
    const unused = ingredients.find((i) => !lines.some((l) => l.ingredient_id === i.id))
    if (!unused) return
    setLines((prev) => [...prev, { ingredient_id: unused.id, quantity: "1" }])
    setSaved(false)
  }

  const updateLine = (index: number, patch: Partial<RecipeLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
    setSaved(false)
  }

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/product-ingredients/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines
            .filter((l) => l.ingredient_id)
            .map((l) => ({
              ingredient_id: l.ingredient_id,
              quantity: parseFloat(l.quantity) || 0,
            })),
        }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const ingredientById = new Map(ingredients.map((i) => [i.id, i]))

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Zutaten pro Portion — steuert die Verfügbarkeit im QR-Menü über Lagerbestand.
      </p>

      {lines.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-slate-500">
          Keine Rezeptzeilen — Produkt nutzt nur Lagerbestand am Produkt.
        </p>
      ) : (
        <div className="space-y-2">
          {lines.map((line, index) => {
            const ing = ingredientById.get(line.ingredient_id)
            return (
              <div key={`${line.ingredient_id}-${index}`} className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
                <div className="min-w-[160px] flex-1">
                  <Label>Zutat</Label>
                  <select
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={line.ingredient_id}
                    onChange={(e) => updateLine(index, { ingredient_id: e.target.value })}
                  >
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <Label>Menge</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  />
                </div>
                <div className="w-16 pb-2 text-sm text-slate-500">{ing?.unit ?? "—"}</div>
                <Button type="button" size="icon" variant="outline" onClick={() => removeLine(index)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={ingredients.length === 0}>
          <Plus className="mr-1 h-4 w-4" />
          Zeile
        </Button>
        <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
          <Save className="mr-1 h-4 w-4" />
          {saving ? "Speichern…" : saved ? "Gespeichert" : "Rezeptur speichern"}
        </Button>
      </div>
    </div>
  )
}
