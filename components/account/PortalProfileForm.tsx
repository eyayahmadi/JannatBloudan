"use client"

import { useEffect, useState } from "react"
import { UserRoundPen, Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { getSupabaseBrowserSetupMessage, hasBrowserSupabaseEnv } from "@/lib/supabase/config"
import { cn } from "@/lib/utils"

type Props = {
  email: string
  firstName: string
  lastName: string
  phone: string
}

export function PortalProfileForm({ email, firstName, lastName, phone }: Props) {
  const [fn, setFn] = useState(firstName)
  const [ln, setLn] = useState(lastName)
  const [tel, setTel] = useState(phone)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    setFn(firstName)
    setLn(lastName)
    setTel(phone)
  }, [firstName, lastName, phone])

  const handleSave = async () => {
    setFeedback(null)
    if (!hasBrowserSupabaseEnv()) {
      setFeedback({ ok: false, text: getSupabaseBrowserSetupMessage() })
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: fn.trim(),
          last_name: ln.trim(),
          phone: tel.trim() || null,
        },
      })
      if (error) throw error
      setFeedback({ ok: true, text: "Profil mis à jour." })
    } catch (e) {
      setFeedback({
        ok: false,
        text: e instanceof Error ? e.message : "Impossible d'enregistrer.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="premium-card animate-fade-up p-6 sm:p-8">
      <h2 className="mb-2 flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--lux-bordeaux)]/12 text-[color:var(--lux-bordeaux)]">
          <UserRoundPen className="h-5 w-5" />
        </span>
        Modifier mon profil
      </h2>
      <p className="mb-6 text-sm text-amber-900/65">
        Ces informations sont liées à votre compte Jannat Bloudan (Supabase Auth).
      </p>

      {feedback ? (
        <div
          role="status"
          className={cn(
            "mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm",
            feedback.ok
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
              : "border-red-200 bg-red-50/80 text-red-900",
          )}
        >
          {feedback.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {feedback.text}
        </div>
      ) : null}

      <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="portal-email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-900/35" />
            <Input id="portal-email" value={email} disabled className="bg-amber-50/50 pl-9" />
          </div>
          <p className="text-xs text-amber-900/55">L&apos;e-mail ne peut pas être modifié ici.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="portal-fn">Prénom</Label>
          <Input id="portal-fn" value={fn} onChange={(e) => setFn(e.target.value)} autoComplete="given-name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="portal-ln">Nom</Label>
          <Input id="portal-ln" value={ln} onChange={(e) => setLn(e.target.value)} autoComplete="family-name" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="portal-tel">Téléphone</Label>
          <Input
            id="portal-tel"
            type="tel"
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            autoComplete="tel"
            placeholder="06 12 34 56 78"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="gold"
        className="mt-6 rounded-full"
        disabled={saving || !fn.trim() || !ln.trim()}
        onClick={() => void handleSave()}
      >
        {saving ? "Enregistrement…" : "Enregistrer les modifications"}
      </Button>
    </Card>
  )
}
