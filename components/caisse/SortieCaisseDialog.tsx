"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, ArrowDownCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole } from "@/lib/auth/roles"
import { CaisseMovementAttachmentUploader } from "@/components/caisse/CaisseMovementAttachmentUploader"

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type StaffOpt = {
  id: string
  user_id?: string | null
  position?: string | null
  employee_label?: string | null
}

type Props = {
  businessDate?: string
  onRecorded?: () => void
}

/**
 * Flux dédié « Sortie de caisse » — traçabilité (validé par l’utilisateur connecté).
 */
export function SortieCaisseDialog({ businessDate, onRecorded }: Props) {
  const { user } = useAuth()
  const role = user ? normalizeRole(user.role) : "CLIENT"
  const allowed = role === "ADMIN" || role === "CASHIER"
  const [open, setOpen] = useState(false)
  const [staff, setStaff] = useState<StaffOpt[]>([])
  const [amount, setAmount] = useState("")
  const [motif, setMotif] = useState("")
  const [personName, setPersonName] = useState("")
  const [roleLabel, setRoleLabel] = useState("")
  const [staffUserId, setStaffUserId] = useState("")
  const [movementLocal, setMovementLocal] = useState(() => toDatetimeLocalValue(new Date()))
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [createExpense, setCreateExpense] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !allowed) return
    void fetch("/api/caisse/staff-list")
      .then((r) => r.json())
      .then((j) => setStaff(Array.isArray(j.staff) ? j.staff : []))
      .catch(() => setStaff([]))
  }, [open])

  const validatorDisplay = useMemo(() => {
    if (!user) return "—"
    const nm = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    return nm ? `${nm} · ${user.email}` : user.email
  }, [user])

  const onStaffChange = (userIdFromSelect: string) => {
    setStaffUserId(userIdFromSelect)
    const row = staff.find((s) => s.user_id === userIdFromSelect)
    if (row?.employee_label) {
      const base = row.employee_label.split(" · ")[0]?.trim()
      if (base && !personName.trim()) setPersonName(base)
    }
    if (row?.position && !roleLabel.trim()) setRoleLabel(String(row.position))
  }

  const submit = useCallback(async () => {
    const n = Number(String(amount).replace(",", "."))
    if (!Number.isFinite(n) || n <= 0) {
      setMessage("Montant invalide")
      return
    }
    const desc = motif.trim()
    if (desc.length < 3) {
      setMessage("Motif / description (min. 3 caractères)")
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const attachmentOrEmpty = attachmentUrl.trim() ? attachmentUrl.trim() : undefined

      const picked = staff.find((s) => s.user_id === staffUserId)
      const inferredName =
        personName.trim() ||
        picked?.employee_label?.split(" · ").filter(Boolean)[0]?.trim() ||
        (picked?.position ? String(picked.position) : "")

      if (!staffUserId && !inferredName) {
        setMessage("Nom de la personne ou choix dans la liste employé")
        setLoading(false)
        return
      }

      const movementISO = new Date(movementLocal).toISOString()
      const res = await fetch("/api/staff/cash-register-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "sortie_caisse",
          amount: n,
          description: desc,
          movement_at: movementISO,
          beneficiary_user_id: staffUserId || undefined,
          beneficiary_display_name: inferredName,
          beneficiary_role_label: roleLabel.trim() || (picked?.position ? String(picked.position) : undefined),
          create_finance_expense: createExpense,
          attachment_url: attachmentOrEmpty,
          meta: {
            source: "sortie_caisse_dialog",
            ui_business_date: businessDate ?? null,
          },
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(typeof j?.error === "string" ? j.error : "Erreur enregistrement")
        setLoading(false)
        return
      }

      setMessage("Sortie enregistrée.")
      setAmount("")
      setMotif("")
      setPersonName("")
      setRoleLabel("")
      setStaffUserId("")
      setAttachmentUrl("")
      setMovementLocal(toDatetimeLocalValue(new Date()))
      onRecorded?.()
      setTimeout(() => setOpen(false), 900)
    } catch {
      setMessage("Réseau ou serveur.")
    } finally {
      setLoading(false)
    }
  }, [
    amount,
    motif,
    personName,
    roleLabel,
    staffUserId,
    movementLocal,
    attachmentUrl,
    createExpense,
    businessDate,
    onRecorded,
    staff,
  ])

  if (!allowed) return null

  return (
    <Dialog open={open} onOpenChange={(next) => {
      setOpen(next)
      if (!next) {
        setMessage(null)
        setAttachmentUrl("")
      }
    }}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="default" className="h-9 gap-1.5 bg-rose-700 hover:bg-rose-800">
          <ArrowDownCircle className="h-4 w-4" />
          Sortie de caisse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sortie de caisse</DialogTitle>
          <DialogDescription>
            Enregistrement d’un prélèvement d’espèces. Aucune suppression : en cas d’erreur, l’admin crée une annulation
            traçable.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
            <Label className="text-xs">Montant (€) *</Label>
            <Input
              className="h-9"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="grid gap-1">
            <Label className="text-xs">Motif / description *</Label>
            <Textarea rows={3} placeholder="Ex. rachat monnaie, achat urgent fournitures…" value={motif} onChange={(e) => setMotif(e.target.value)} />
          </div>

          <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1">
              <Label className="text-xs">Personne (prénom / nom)</Label>
              <Input className="h-9" value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Ou laisser vide si employé ci-dessous" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Rôle / fonction</Label>
              <Input className="h-9" value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} placeholder="Ex. serveur, gérant" />
            </div>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs">Employé relié (optionnel)</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={staffUserId}
              onChange={(e) => onStaffChange(e.target.value)}
            >
              <option value="">—</option>
              {staff
                .filter((s) => Boolean(s.user_id))
                .map((s) => (
                  <option key={String(s.id)} value={String(s.user_id)}>
                    {s.employee_label ?? s.position ?? s.id}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs">Date et heure du mouvement *</Label>
            <Input type="datetime-local" className="h-9" value={movementLocal} onChange={(e) => setMovementLocal(e.target.value)} />
          </div>

          <CaisseMovementAttachmentUploader value={attachmentUrl} onChange={setAttachmentUrl} disabled={loading} allowPdf />

          <div className="grid gap-1 rounded-md bg-muted/50 p-3 text-xs">
            <span className="font-medium text-foreground">Validé par (connecté)</span>
            <span className="text-muted-foreground">{validatorDisplay}</span>
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={createExpense} onChange={(e) => setCreateExpense(e.target.checked)} />
            Créer une ligne dépense finance (recommandé)
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {message ? <p className="mr-auto text-xs text-muted-foreground sm:max-w-[55%]">{message}</p> : null}
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Fermer
          </Button>
          <Button type="button" disabled={loading} onClick={() => void submit()} className="gap-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer la sortie
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
