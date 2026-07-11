"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { OrderProductName } from "@/components/orders/OrderProductName"
import type { KitchenOrder } from "@/lib/hooks/useRealtimeOrders"

type SplitBillDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: KitchenOrder[]
  /** Numéros de tables proposés par défaut (occupées). */
  tableOptions: number[]
  defaultTable?: number
}

type Person = {
  id: string
  name: string
}

/** Une « unité » à payer = 1 quantité d'un item d'une commande. */
type AssignableUnit = {
  id: string
  orderId: string
  orderNumber: string
  itemId: string
  name: string
  name_ar?: string | null
  unitPrice: number
  assignedTo: string | null
}

function makePersonId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function buildUnitsFromOrders(orders: KitchenOrder[]): AssignableUnit[] {
  const units: AssignableUnit[] = []
  for (const o of orders) {
    const totalQty = o.items.reduce((s, it) => s + Math.max(0, Number(it.quantity) || 0), 0)
    const total = Number(o.total) || 0
    const unitPrice = totalQty > 0 ? total / totalQty : 0
    for (const it of o.items) {
      const qty = Math.max(0, Math.floor(Number(it.quantity) || 0))
      for (let i = 0; i < qty; i++) {
        units.push({
          id: `${o.id}-${it.id}-${i}`,
          orderId: o.id,
          orderNumber: o.order_number,
          itemId: it.id,
          name: it.name,
          name_ar: it.name_ar,
          unitPrice,
          assignedTo: null,
        })
      }
    }
  }
  return units
}

function nf(v: number): string {
  if (!Number.isFinite(v)) return "0,00"
  return v.toFixed(2).replace(".", ",")
}

export function SplitBillDialog({
  open,
  onOpenChange,
  orders,
  tableOptions,
  defaultTable,
}: SplitBillDialogProps) {
  const fallbackTable = tableOptions[0] ?? defaultTable ?? 1
  const [table, setTable] = useState<number>(defaultTable ?? fallbackTable)
  const [step, setStep] = useState<"pick" | "split">("pick")
  const [persons, setPersons] = useState<Person[]>([])
  const [units, setUnits] = useState<AssignableUnit[]>([])
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)
  const personInputs = useRef<Map<string, HTMLInputElement | null>>(new Map())

  useEffect(() => {
    if (!open) return
    setTable(defaultTable ?? fallbackTable)
    setStep("pick")
    const firstId = makePersonId()
    setPersons([{ id: firstId, name: "" }])
    setLastAddedId(firstId)
    setUnits([])
  }, [open, defaultTable, fallbackTable])

  // Focus le champ nom du dernier convive ajouté.
  useEffect(() => {
    if (!lastAddedId) return
    const el = personInputs.current.get(lastAddedId)
    if (el) {
      el.focus()
      el.select()
    }
  }, [lastAddedId, persons.length])

  const tableOrders = useMemo(
    () =>
      orders.filter(
        (o) => Number(o.table_number) === Number(table) && o.status !== "cancelled",
      ),
    [orders, table],
  )

  const startSplit = () => {
    const built = buildUnitsFromOrders(tableOrders)
    if (built.length === 0) {
      toast.error(`Table ${table} : aucun produit à fractionner.`)
      return
    }
    setUnits(built)
    setStep("split")
  }

  const addPerson = () => {
    const newId = makePersonId()
    setPersons((prev) => [...prev, { id: newId, name: "" }])
    setLastAddedId(newId)
  }

  const removePerson = (id: string) => {
    setPersons((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)))
    setUnits((prev) => prev.map((u) => (u.assignedTo === id ? { ...u, assignedTo: null } : u)))
    personInputs.current.delete(id)
  }

  const renamePerson = (id: string, name: string) => {
    setPersons((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
  }

  const assignUnit = (unitId: string, personId: string | null) => {
    setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, assignedTo: personId } : u)))
  }

  const totalsByPerson = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>()
    for (const p of persons) map.set(p.id, { count: 0, amount: 0 })
    for (const u of units) {
      if (!u.assignedTo) continue
      const acc = map.get(u.assignedTo)
      if (!acc) continue
      acc.count += 1
      acc.amount += u.unitPrice
    }
    return map
  }, [persons, units])

  const unassignedCount = units.filter((u) => !u.assignedTo).length
  const grandTotal = units.reduce((s, u) => s + u.unitPrice, 0)
  const assignedTotal = units.filter((u) => u.assignedTo).reduce((s, u) => s + u.unitPrice, 0)

  const namelessPersons = persons.filter((p) => !p.name.trim())

  const validate = () => {
    if (namelessPersons.length > 0) {
      toast.error(`Indiquez un nom pour chaque personne (${namelessPersons.length} sans nom).`)
      const firstNameless = namelessPersons[0]
      if (firstNameless) {
        setLastAddedId(firstNameless.id)
        personInputs.current.get(firstNameless.id)?.focus()
      }
      return
    }
    if (unassignedCount > 0) {
      toast.error(`${unassignedCount} produit(s) non assigné(s).`)
      return
    }
    const lines = persons.map((p) => {
      const t = totalsByPerson.get(p.id) ?? { count: 0, amount: 0 }
      return `${p.name.trim()} : ${t.count} produit(s) — ${nf(t.amount)} €`
    })
    toast.success(`Addition fractionnée — table ${table}`, {
      description: lines.join("\n"),
      duration: 8000,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fractionner l&apos;addition</DialogTitle>
          <DialogDescription>
            {step === "pick"
              ? "Choisissez la table puis répartissez chaque produit entre les personnes."
              : `Table ${table} — assignez chaque produit à une personne. Le total se met à jour en direct.`}
          </DialogDescription>
        </DialogHeader>

        {step === "pick" ? (
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="split-table">Table concernée</Label>
              <select
                id="split-table"
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                value={String(table)}
                onChange={(e) => setTable(Number(e.target.value))}
              >
                {tableOptions.length === 0 ? (
                  <option value={String(fallbackTable)}>Table {fallbackTable}</option>
                ) : (
                  tableOptions.map((n) => (
                    <option key={n} value={n}>
                      Table {n}
                    </option>
                  ))
                )}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {tableOrders.length === 0
                  ? `Aucune commande active sur la table ${table}.`
                  : `${tableOrders.length} commande(s) trouvée(s).`}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <section className="rounded-md border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  <Users className="mr-1 inline h-3 w-3" />
                  Personnes
                </Label>
                <Button type="button" size="sm" variant="outline" className="h-7 gap-1" onClick={addPerson}>
                  <Plus className="h-3 w-3" /> Ajouter
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {persons.map((p, idx) => {
                  const t = totalsByPerson.get(p.id) ?? { count: 0, amount: 0 }
                  const empty = !p.name.trim()
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border bg-background px-2 py-1.5",
                        empty ? "border-amber-300 dark:border-amber-700" : "",
                      )}
                    >
                      <Input
                        ref={(el) => {
                          if (el) personInputs.current.set(p.id, el)
                          else personInputs.current.delete(p.id)
                        }}
                        value={p.name}
                        onChange={(e) => renamePerson(p.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            if (idx === persons.length - 1 && p.name.trim()) {
                              addPerson()
                            }
                          }
                        }}
                        placeholder={`Nom de la personne ${idx + 1} (ex. Sami)`}
                        className="h-7 flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
                      />
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {t.count} · {nf(t.amount)} €
                      </span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                        onClick={() => removePerson(p.id)}
                        disabled={persons.length <= 1}
                        aria-label={`Supprimer ${p.name || `personne ${idx + 1}`}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
              {namelessPersons.length > 0 ? (
                <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">
                  Indiquez un nom pour chaque personne avant de valider.
                </p>
              ) : null}
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium uppercase tracking-wide text-muted-foreground">
                  Produits ({units.length})
                </span>
                <span className="text-muted-foreground">
                  Assignés {nf(assignedTotal)} € · Total {nf(grandTotal)} €
                </span>
              </div>
              <ScrollArea className="h-72 rounded-md border">
                <ul className="divide-y">
                  {units.map((u) => (
                    <li
                      key={u.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm",
                        u.assignedTo ? "bg-emerald-50/40 dark:bg-emerald-950/20" : "",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <OrderProductName
                          name={u.name}
                          name_ar={u.name_ar}
                          truncate
                          className="min-w-0"
                        />
                        <div className="text-[10px] text-muted-foreground">
                          {u.orderNumber} · {nf(u.unitPrice)} €
                        </div>
                      </div>
                      <select
                        className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                        value={u.assignedTo ?? ""}
                        onChange={(e) => assignUnit(u.id, e.target.value || null)}
                      >
                        <option value="">— Personne —</option>
                        {persons.map((p, idx) => (
                          <option key={p.id} value={p.id} disabled={!p.name.trim()}>
                            {p.name.trim() || `(personne ${idx + 1} — sans nom)`}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
              {unassignedCount > 0 ? (
                <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                  {unassignedCount} produit(s) non assigné(s).
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                  Tous les produits sont assignés.
                </p>
              )}
            </section>
          </div>
        )}

        <DialogFooter>
          {step === "split" ? (
            <Button type="button" variant="ghost" onClick={() => setStep("pick")}>
              ← Changer de table
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          {step === "pick" ? (
            <Button type="button" onClick={startSplit} disabled={tableOrders.length === 0}>
              Continuer
            </Button>
          ) : (
            <Button
              type="button"
              onClick={validate}
              disabled={unassignedCount > 0 || namelessPersons.length > 0}
            >
              Valider la répartition
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
