"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AdminFormModalShell } from "@/components/admin/menu/AdminFormModalShell"

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

function serializeCategoryForm(form: CategoryFormState): string {
  return JSON.stringify(form)
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
  const nameInputRef = useRef<HTMLInputElement>(null)
  const initialSnapshotRef = useRef("")

  useEffect(() => {
    if (open) {
      initialSnapshotRef.current = serializeCategoryForm(form)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingName])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => nameInputRef.current?.focus(), 120)
    return () => window.clearTimeout(timer)
  }, [open, editingName])

  const isDirty = open && serializeCategoryForm(form) !== initialSnapshotRef.current

  return (
    <AdminFormModalShell
      open={open}
      onClose={onClose}
      title="Kategorie bearbeiten"
      titleId="category-form-title"
      subtitle={editingName}
      size="lg"
      isDirty={isDirty}
      footer={
        <Button type="button" className="w-full" disabled={saving || !form.name.trim()} onClick={onSave}>
          {saving ? "Speichern…" : "Speichern"}
        </Button>
      }
    >
      <div className="space-y-7">
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
          <Label>Beschreibung (Untertitel Menü)</Label>
          <Textarea
            value={form.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Emoji</Label>
            <Input value={form.icon_emoji} onChange={(e) => onChange({ icon_emoji: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Sortierung</Label>
            <Input
              type="number"
              value={form.display_order}
              onChange={(e) => onChange({ display_order: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Bereich</Label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
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
    </AdminFormModalShell>
  )
}
