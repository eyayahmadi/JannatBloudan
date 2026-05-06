"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2 } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function AdminTaxesPage() {
  const [scope, setScope] = useState("online_only")
  const [rate, setRate] = useState("0.19")
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    void fetch("/api/admin/finance-tax-settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.vat_scope) setScope(String(j.vat_scope))
        if (j.vat_rate != null) setRate(String(j.vat_rate))
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    const r = Number(rate.replace(",", "."))
    setMsg(null)
    const res = await fetch("/api/admin/finance-tax-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vat_rate: Number.isFinite(r) ? r : 0.19,
        vat_scope: scope,
      }),
    })
    const j = await res.json().catch(() => ({}))
    setMsg(res.ok ? "Enregistré." : j.error ?? "Erreur")
  }

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <SiteHeader
          backHref="/admin"
          backLabel="Admin"
          hideMainNav
          trailing={
            <Button asChild size="sm" variant="outline" className="gap-1">
              <Link href="/caisse">
                <Building2 className="h-4 w-4" /> Caisse
              </Link>
            </Button>
          }
        />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Gestion des taxes TVA</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Par défaut, la TVA à suivre provient uniquement des encaissements hors espèce (factures payées en ligne /
              carte avec TVA renseignée). Vous pouvez étendre la base avec la partie d’espèces officiellement déclarée en
              clôture.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Règle de calcul configurable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? <p className="text-sm text-muted-foreground">Chargement...</p> : null}
              <div className="space-y-2">
                <Label>Mode de base fiscal (TVA suivie pour « taxes à payer »)</Label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online_only">
                      Hors espèces uniquement (cartes/online transférées sur les factures)
                    </SelectItem>
                    <SelectItem value="online_plus_cash_declared">
                      Online/card + partie cash déclarée officielle (voir clôture journalière)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat">Taux TVA fraction (19 % = 0,19)</Label>
                <Input id="vat" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.19" />
              </div>
              <Button type="button" onClick={() => void save()}>
                Enregistrer
              </Button>
              {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
            </CardContent>
          </Card>

          <p className="text-xs text-slate-500">
            Pour export consolidé jour/mois utilisez vos outils ERP ou export depuis « Finance » ; ce module fixe les
            agrégats servis aux écrans Caisse.
          </p>
        </main>
        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
