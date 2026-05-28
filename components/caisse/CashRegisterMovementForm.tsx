"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, MinusCircle, PlusCircle, Lock } from "lucide-react"
import { CaisseMovementAttachmentUploader } from "@/components/caisse/CaisseMovementAttachmentUploader"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole } from "@/lib/auth/roles"

type Kind = "sortie_caisse" | "avance_client" | "ajustement"

/**
 * Journal caisse boutique : relié à POST /api/staff/cash-register-movements.
 * Réservé ADMIN / CASHIER. Garde côté composant en plus de la garde de page,
 * pour empêcher tout affichage involontaire (re-use dans une autre page).
 */
export function CashRegisterMovementForm() {
  const { user } = useAuth()
  const role = user ? normalizeRole(user.role) : "CLIENT"
  const allowed = role === "ADMIN" || role === "CASHIER"
  if (!allowed) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" />
          Réservé caisse / administration
        </div>
        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
          Le journal caisse (sorties, avances, ajustements) est réservé aux rôles
          ADMIN et CASHIER.
        </p>
      </div>
    )
  }

  return <CashRegisterMovementFormInner />
}

function CashRegisterMovementFormInner() {
  const [kind, setKind] = useState<Kind>("sortie_caisse")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [beneficiaryUserId, setBeneficiaryUserId] = useState("")
  const [createExpense, setCreateExpense] = useState(true)
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [staff, setStaff] = useState<{ id: string; user_id?: string | null; position?: string | null; employee_label?: string | null }[]>([])

  useEffect(() => {
    void fetch("/api/caisse/staff-list")
      .then((r) => r.json())
      .then((j) => setStaff(Array.isArray(j.staff) ? j.staff : []))
      .catch(() => setStaff([]))
  }, [])

  const submit = useCallback(async () => {
    const n = Number(String(amount).replace(",", "."))
    if (!Number.isFinite(n) || n <= 0) {
      setMessage("Montant invalide")
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/staff/cash-register-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          amount: n,
          description: description.trim() || `${kind}`,
          beneficiary_user_id: beneficiaryUserId || undefined,
          create_finance_expense: kind === "sortie_caisse" && createExpense,
          attachment_url: attachmentUrl.trim() || undefined,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(typeof j?.error === "string" ? j.error : "Erreur enregistrement")
        return
      }
      setMessage("Enregistré.")
      setAmount("")
      setDescription("")
      setAttachmentUrl("")
    } catch {
      setMessage("Réseau ou serveur.")
    } finally {
      setLoading(false)
    }
  }, [amount, description, kind, beneficiaryUserId, createExpense, attachmentUrl])

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Caisse — journal
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sortie_caisse">
                <span className="flex items-center gap-2">
                  <MinusCircle className="h-3.5 w-3.5 text-rose-500" /> Sortie caisse (dépense)
                </span>
              </SelectItem>
              <SelectItem value="avance_client">
                <span className="flex items-center gap-2">
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-500" /> Avance client
                </span>
              </SelectItem>
              <SelectItem value="ajustement">Ajustement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Montant (€)</Label>
          <Input
            className="h-9 text-sm"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Description</Label>
          <Input
            className="h-9 text-sm"
            placeholder="Ex. achat consommables"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1 lg:col-span-2">
          <Label className="text-xs">Personne ayant prélevé (optionnel)</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={beneficiaryUserId}
            onChange={(e) => setBeneficiaryUserId(e.target.value)}
          >
            <option value="">—</option>
            {staff
              .filter((s) => Boolean(s.user_id))
              .map((s) => (
                <option key={String(s.id)} value={String(s.user_id)}>
                  {s.employee_label ?? (s.position ?? "Staff").toString()}
                </option>
              ))}
          </select>
        </div>
        <div className="space-y-1 lg:col-span-4">
          <CaisseMovementAttachmentUploader
            value={attachmentUrl}
            onChange={setAttachmentUrl}
            disabled={loading}
            compact
          />
        </div>
        {kind === "sortie_caisse" ? (
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 lg:col-span-4">
            <input type="checkbox" checked={createExpense} onChange={(e) => setCreateExpense(e.target.checked)} />
            Créer ligne dépense finance (recommandé)
          </label>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" className="h-8 gap-1" disabled={loading} onClick={() => submit()}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Valider
        </Button>
        {message ? <span className="text-xs text-slate-600 dark:text-slate-300">{message}</span> : null}
      </div>
    </div>
  )
}
