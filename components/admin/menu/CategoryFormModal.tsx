"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type CategoryFormState = {
  name: string
  name_ar: string
  description: string
  section: string
  icon_emoji: string
  display_order: string
  is_active: boolean
}

type CategoryFormModalProps = {
  open: boolean
  editingName?: string
  form: CategoryFormState
  saving: boolean
  onClose: () => void
  onChange: (patch: Partial<CategoryFormState>) => void
  onSave: () => void
}

export function CategoryFormModal({
  open,
  editingName,
  form,
  saving,
  onClose,
  onChange,
  onSave,
}: CategoryFormModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-form-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 id="category-form-title" className="text-lg font-bold">
              Kategorie bearbeiten
            </h2>
            {editingName ? <p className="text-sm text-slate-500">{editingName}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Schließen">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
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
            <Label>Beschreibung (Untertitel Menü)</Label>
            <Textarea
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Emoji</Label>
              <Input value={form.icon_emoji} onChange={(e) => onChange({ icon_emoji: e.target.value })} />
            </div>
            <div>
              <Label>Sortierung</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => onChange({ display_order: e.target.value })}
              />
            </div>
            <div>
              <Label>Bereich</Label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                value={form.section}
                onChange={(e) => onChange({ section: e.target.value })}
              >
                <option value="food">Food</option>
                <option value="drinks">Drinks</option>
                <option value="desserts">Desserts</option>
                <option value="special">Special / Shisha</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => onChange({ is_active: e.target.checked })}
            />
            Kategorie aktiv (im Menü sichtbar)
          </label>
        </div>

        <div className="border-t px-5 py-4">
          <Button type="button" className="w-full" disabled={saving || !form.name.trim()} onClick={onSave}>
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
