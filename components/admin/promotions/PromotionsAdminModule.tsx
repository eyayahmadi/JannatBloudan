"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  Calendar,
  Copy,
  Gift,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/lib/context/AuthContext"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { AdminImageUpload } from "@/components/admin/AdminImageUpload"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useMt } from "@/lib/i18n/machine-translate"
import { offerMatchesHub, PROMOTION_TYPES, VISIBILITY_OPTIONS, type PromotionTypeValue } from "@/lib/promotions/types"
import { formatPromoBadge } from "@/lib/promotions/serialize"
import type { PublicPromotion } from "@/lib/promotions/serialize"

export type PromotionsHub = "promotions" | "offers" | "reductions"

type OfferRow = Record<string, unknown> & {
  id: string
  name: string
  offer_type: string
  value_num?: number | null
  promo_code?: string | null
  active?: boolean
  usage_count?: number
  usage_limit?: number | null
  starts_at?: string | null
  ends_at?: string | null
  description?: string | null
  short_label?: string | null
  auto_apply?: boolean
  stackable?: boolean
  visibility?: string
  image_url?: string | null
  conditions_text?: string | null
  product_ids?: string[]
  category_keys?: string[]
  meta?: Record<string, unknown>
  max_redemptions_per_user?: number | null
  min_order_amount?: number | null
}

type AnalyticsRow = {
  offer_id: string
  name: string
  offer_type: string
  redemptions: number
  savings_attributed_eur: number
  usage_vs_limit_pct: number | null
}

type PromotionsAdminModuleProps = {
  hub: PromotionsHub
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(s: string): string | null {
  if (!s.trim()) return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function buildMeta(
  base: Record<string, unknown>,
  fields: {
    hh0: string
    hh1: string
    loyalty: string
    party: string
    bxBuy: string
    bxGet: string
    bxPct: string
    equivPct: string
    maxCart: string
    countdown: string
    aiHint: string
  },
): Record<string, unknown> {
  const m = { ...base }
  const h0 = Number(fields.hh0)
  const h1 = Number(fields.hh1)
  if (Number.isFinite(h0) && Number.isFinite(h1)) {
    m.happy_hour = [Math.floor(h0), Math.floor(h1)] as [number, number]
  } else {
    delete m.happy_hour
  }
  const lo = Number(fields.loyalty)
  if (Number.isFinite(lo) && lo > 0) m.loyalty_min_orders = Math.floor(lo)
  else delete m.loyalty_min_orders
  const ps = Number(fields.party)
  if (Number.isFinite(ps) && ps > 0) m.min_party_size = Math.floor(ps)
  else delete m.min_party_size
  const buy = Number(fields.bxBuy)
  const get = Number(fields.bxGet)
  const dcp = Number(fields.bxPct)
  if ((Number.isFinite(buy) && buy > 0) || (Number.isFinite(get) && get > 0) || (Number.isFinite(dcp) && dcp > 0)) {
    m.bxgy = {
      buy_qty: Number.isFinite(buy) && buy > 0 ? Math.floor(buy) : 1,
      get_qty: Number.isFinite(get) && get > 0 ? Math.floor(get) : 1,
      discount_percent: Number.isFinite(dcp) ? Math.min(100, Math.max(0, dcp)) : 100,
    }
  } else {
    delete m.bxgy
  }
  const eq = Number(fields.equivPct)
  if (Number.isFinite(eq) && eq > 0) m.equivalent_percent = Math.min(100, eq)
  else delete m.equivalent_percent
  const mc = Number(fields.maxCart)
  if (Number.isFinite(mc) && mc > 0) m.max_cart_qty = Math.floor(mc)
  else delete m.max_cart_qty
  if (fields.countdown.trim()) {
    const cd = new Date(fields.countdown)
    if (!Number.isNaN(cd.getTime())) m.countdown_ends_at = cd.toISOString()
  } else delete m.countdown_ends_at
  if (fields.aiHint.trim()) m.ai_hint = fields.aiHint.trim().slice(0, 500)
  else delete m.ai_hint
  return m
}

export function PromotionsAdminModule({ hub }: PromotionsAdminModuleProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  const [offers, setOffers] = useState<OfferRow[]>([])
  const [analytics, setAnalytics] = useState<{
    byOffer: AnalyticsRow[]
    totals: { redemptions: number; savingsEur: number }
    recommendations: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<OfferRow | null>(null)

  const [form, setForm] = useState({
    name: "",
    short_label: "",
    description: "",
    offer_type: "percentage" as PromotionTypeValue,
    value_num: "",
    promo_code: "",
    auto_apply: false,
    stackable: false,
    visibility: "all",
    image_url: "",
    conditions_text: "",
    starts_at: "",
    ends_at: "",
    usage_limit: "",
    min_order_amount: "",
    max_redemptions_per_user: "",
    product_ids: "",
    category_keys: "",
    hh0: "",
    hh1: "",
    loyalty: "",
    party: "",
    bxBuy: "",
    bxGet: "",
    bxPct: "100",
    equivPct: "",
    maxCart: "",
    countdown: "",
    aiHint: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [oRes, aRes] = await Promise.all([
        fetch("/api/admin/promotional-offers"),
        fetch("/api/admin/promotions-analytics"),
      ])
      const oBody = await oRes.json().catch(() => ({}))
      const aBody = await aRes.json().catch(() => ({}))
      setOffers((oBody.offers ?? []) as OfferRow[])
      if (aBody.byOffer) {
        setAnalytics({
          byOffer: aBody.byOffer,
          totals: aBody.totals ?? { redemptions: 0, savingsEur: 0 },
          recommendations: aBody.recommendations ?? [],
        })
      } else {
        setAnalytics(null)
      }
    } catch {
      toast.error("Chargement impossible")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const analyticsMap = useMemo(() => {
    const m = new Map<string, AnalyticsRow>()
    for (const r of analytics?.byOffer ?? []) m.set(r.offer_id, r)
    return m
  }, [analytics])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return offers.filter((o) => {
      if (!offerMatchesHub(o.offer_type, hub)) return false
      if (!q) return true
      return (
        o.name.toLowerCase().includes(q) ||
        String(o.promo_code ?? "").toLowerCase().includes(q) ||
        o.offer_type.toLowerCase().includes(q)
      )
    })
  }, [offers, hub, search])

  const hubTitle =
    hub === "promotions"
      ? "Promotions & campagnes"
      : hub === "offers"
        ? "Offres marketing"
        : "Réductions"
  const hubTitleDisplay = useMt(hubTitle)

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: "",
      short_label: "",
      description: "",
      offer_type: hub === "reductions" ? "percentage" : "happy_hour",
      value_num: hub === "reductions" ? "10" : "15",
      promo_code: "",
      auto_apply: false,
      stackable: false,
      visibility: "all",
      image_url: "",
      conditions_text: "",
      starts_at: "",
      ends_at: "",
      usage_limit: "",
      min_order_amount: "",
      max_redemptions_per_user: "",
      product_ids: "",
      category_keys: "",
      hh0: "18",
      hh1: "20",
      loyalty: "",
      party: "",
      bxBuy: "1",
      bxGet: "1",
      bxPct: "100",
      equivPct: "",
      maxCart: "",
      countdown: "",
      aiHint: "",
    })
    setSheetOpen(true)
  }

  const openEdit = (o: OfferRow) => {
    setEditing(o)
    const meta = (o.meta ?? {}) as Record<string, unknown>
    const hh = meta.happy_hour as [number, number] | undefined
    const bxgy = meta.bxgy as { buy_qty?: number; get_qty?: number; discount_percent?: number } | undefined
    setForm({
      name: o.name,
      short_label: String(o.short_label ?? ""),
      description: String(o.description ?? ""),
      offer_type: (o.offer_type as PromotionTypeValue) || "percentage",
      value_num: o.value_num != null ? String(o.value_num) : "",
      promo_code: String(o.promo_code ?? ""),
      auto_apply: o.auto_apply === true,
      stackable: o.stackable === true,
      visibility: String(o.visibility ?? "all"),
      image_url: String(o.image_url ?? ""),
      conditions_text: String(o.conditions_text ?? ""),
      starts_at: toLocalInput(o.starts_at ?? null),
      ends_at: toLocalInput(o.ends_at ?? null),
      usage_limit: o.usage_limit != null ? String(o.usage_limit) : "",
      min_order_amount: o.min_order_amount != null ? String(o.min_order_amount) : "",
      max_redemptions_per_user:
        o.max_redemptions_per_user != null ? String(o.max_redemptions_per_user as number) : "",
      product_ids: (o.product_ids ?? []).join("\n"),
      category_keys: (o.category_keys ?? []).join(", "),
      hh0: hh ? String(hh[0]) : "",
      hh1: hh ? String(hh[1]) : "",
      loyalty: meta.loyalty_min_orders != null ? String(meta.loyalty_min_orders) : "",
      party: meta.min_party_size != null ? String(meta.min_party_size) : "",
      bxBuy: bxgy?.buy_qty != null ? String(bxgy.buy_qty) : "",
      bxGet: bxgy?.get_qty != null ? String(bxgy.get_qty) : "",
      bxPct: bxgy?.discount_percent != null ? String(bxgy.discount_percent) : "100",
      equivPct: meta.equivalent_percent != null ? String(meta.equivalent_percent) : "",
      maxCart: meta.max_cart_qty != null ? String(meta.max_cart_qty as number) : "",
      countdown: meta.countdown_ends_at ? toLocalInput(String(meta.countdown_ends_at)) : "",
      aiHint: meta.ai_hint != null ? String(meta.ai_hint) : "",
    })
    setSheetOpen(true)
  }

  const submit = async () => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent modifier les offres.")
      return
    }
    if (!form.name.trim()) {
      toast.error("Titre requis")
      return
    }
    setSaving(true)
    try {
      const meta = buildMeta((editing?.meta ?? {}) as Record<string, unknown>, {
        hh0: form.hh0,
        hh1: form.hh1,
        loyalty: form.loyalty,
        party: form.party,
        bxBuy: form.bxBuy,
        bxGet: form.bxGet,
        bxPct: form.bxPct,
        equivPct: form.equivPct,
        maxCart: form.maxCart,
        countdown: form.countdown,
        aiHint: form.aiHint,
      })
      const product_ids = form.product_ids
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      const category_keys = form.category_keys
        .split(/[,]+/)
        .map((s) => s.trim())
        .filter(Boolean)

      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        short_label: form.short_label.trim() || null,
        description: form.description.trim() || null,
        offer_type: form.offer_type,
        value_num: form.value_num.trim() ? Number(form.value_num) : null,
        promo_code: form.promo_code.trim() || null,
        auto_apply: form.auto_apply,
        stackable: form.stackable,
        visibility: form.visibility,
        image_url: form.image_url.trim() || null,
        conditions_text: form.conditions_text.trim() || null,
        starts_at: fromLocalInput(form.starts_at),
        ends_at: fromLocalInput(form.ends_at),
        usage_limit: form.usage_limit.trim() ? Number(form.usage_limit) : null,
        min_order_amount: form.min_order_amount.trim() ? Number(form.min_order_amount) : null,
        max_redemptions_per_user: form.max_redemptions_per_user.trim()
          ? Number(form.max_redemptions_per_user)
          : null,
        product_ids,
        category_keys,
        meta,
      }

      if (editing) {
        const res = await fetch(`/api/admin/promotional-offers/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error ?? "Erreur")
        toast.success("Offre mise à jour")
      } else {
        const res = await fetch("/api/admin/promotional-offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, active: true }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error ?? "Erreur")
        toast.success("Offre créée")
      }
      setSheetOpen(false)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (o: OfferRow) => {
    if (!isAdmin) return toast.error("Réservé aux administrateurs")
    const next = !(o.active === true)
    const res = await fetch(`/api/admin/promotional-offers/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(body.error ?? "Erreur")
    toast.success(next ? "Offre activée" : "Offre mise en pause")
    void load()
  }

  const duplicate = async (o: OfferRow) => {
    if (!isAdmin) return toast.error("Réservé aux administrateurs")
    const res = await fetch(`/api/admin/promotional-offers/${o.id}/duplicate`, { method: "POST" })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(body.error ?? "Erreur")
    toast.success("Copie créée (inactive)")
    void load()
  }

  const remove = async (o: OfferRow) => {
    if (!isAdmin) return toast.error("Réservé aux administrateurs")
    if (!confirm(`Archiver « ${o.name} » ? L’historique des remises est conservé.`)) return
    const res = await fetch(`/api/admin/promotional-offers/${o.id}`, { method: "DELETE" })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(body.error ?? "Erreur")
    toast.success("Offre archivée")
    void load()
  }

  return (
    <PageShell className="min-h-screen bg-gradient-to-b from-stone-100 via-amber-50/30 to-stone-100 dark:from-zinc-950 dark:via-stone-950 dark:to-zinc-950">
      <SiteHeader backHref="/admin" backLabel="Dashboard" hideMainNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-800/80 dark:text-amber-300/90">
              <Gift className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Promotions & réductions</span>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              {hubTitleDisplay}
            </h1>
            <p className="max-w-2xl text-sm text-stone-600 dark:text-stone-400">
              Créez, planifiez et analysez vos campagnes. Les remises s’appliquent à la caisse et se propagent sur le site
              public via l’API promotions.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {(
                [
                  ["/admin/promotions", "Tout", "promotions"],
                  ["/admin/offers", "Offres", "offers"],
                  ["/admin/reductions", "Réductions", "reductions"],
                ] as const
              ).map(([href, label, key]) => (
                <Button
                  key={href}
                  asChild
                  variant={hub === key ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    hub === key &&
                      "bg-gradient-to-r from-amber-600 to-amber-800 text-white shadow-md hover:from-amber-700 hover:to-amber-900 dark:from-amber-500 dark:to-amber-700",
                  )}
                >
                  <Link href={href}>{label}</Link>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-[200px] max-w-xs border-amber-200/60 bg-white/80 dark:border-amber-900/40 dark:bg-zinc-900/80"
            />
            <Button
              onClick={openCreate}
              disabled={!isAdmin}
              className="bg-gradient-to-r from-amber-600 to-yellow-700 text-white shadow-lg hover:from-amber-700 hover:to-yellow-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle offre
            </Button>
          </div>
        </div>

        {!isAdmin ? (
          <p className="mb-6 rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
            Mode consultation : seul un compte administrateur peut créer, dupliquer ou archiver des offres.
          </p>
        ) : null}

        {analytics ? (
          <div className="mb-10 grid gap-4 md:grid-cols-3">
            <Card className="border-amber-200/50 bg-white/70 shadow-md backdrop-blur dark:border-amber-900/30 dark:bg-zinc-900/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-stone-800 dark:text-stone-100">
                  <BarChart3 className="h-4 w-4 text-amber-600" />
                  Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums text-stone-900 dark:text-white">
                  {analytics.totals.redemptions}
                </p>
                <p className="text-xs text-stone-500">Total des remises enregistrées en caisse</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200/50 bg-white/70 shadow-md backdrop-blur dark:border-amber-900/30 dark:bg-zinc-900/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-stone-800 dark:text-stone-100">
                  <Tag className="h-4 w-4 text-amber-600" />
                  Montant remisé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums text-stone-900 dark:text-white">
                  {analytics.totals.savingsEur.toFixed(2)} €
                </p>
                <p className="text-xs text-stone-500">Somme des économies clients (HT)</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50/90 to-white/80 shadow-md backdrop-blur dark:border-amber-900/40 dark:from-amber-950/40 dark:to-zinc-900/80">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-stone-800 dark:text-stone-100">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
                {(analytics.recommendations.length ? analytics.recommendations : ["Aucune suggestion pour le moment."]).map(
                  (t, i) => (
                    <p key={i} className="leading-relaxed">
                      {t}
                    </p>
                  ),
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 text-stone-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-amber-300/60 bg-white/50 dark:border-amber-800/40 dark:bg-zinc-900/50">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <Gift className="h-10 w-10 text-amber-600/70" />
              <p className="text-stone-600 dark:text-stone-400">Aucune offre dans cette vue.</p>
              {isAdmin ? (
                <Button onClick={openCreate} variant="outline" className="border-amber-400/60">
                  Créer la première offre
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((o) => {
              const stat = analyticsMap.get(o.id)
              const pub = {
                id: o.id,
                name: o.name,
                offer_type: o.offer_type,
                value_num: o.value_num ?? null,
                meta: (o.meta ?? {}) as PublicPromotion["meta"],
              }
              const badge = formatPromoBadge(pub)
              const used = Number(o.usage_count ?? 0)
              const lim = o.usage_limit != null ? Number(o.usage_limit) : null
              const conv = lim != null && lim > 0 ? Math.min(100, Math.round((used / lim) * 100)) : null
              return (
                <Card
                  key={o.id}
                  className={cn(
                    "group relative overflow-hidden border border-amber-200/40 bg-white/80 shadow-[0_20px_50px_-28px_rgba(120,80,20,0.35)] transition hover:-translate-y-0.5 hover:shadow-xl dark:border-amber-900/25 dark:bg-zinc-900/75",
                    o.active === false && "opacity-80",
                  )}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{
                      background:
                        "radial-gradient(ellipse 80% 50% at 20% 0%, #b8860b, transparent), radial-gradient(ellipse 60% 40% at 100% 100%, #6e1d2b, transparent)",
                    }}
                  />
                  {o.image_url ? (
                    <div
                      className="relative h-28 w-full bg-stone-200 bg-cover bg-center dark:bg-stone-800"
                      style={{ backgroundImage: `url(${o.image_url})` }}
                    />
                  ) : (
                    <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-amber-100/90 to-stone-100/80 dark:from-amber-950/50 dark:to-zinc-900">
                      <ImageIcon className="h-10 w-10 text-amber-700/40 dark:text-amber-500/30" />
                    </div>
                  )}
                  <CardHeader className="relative space-y-2 pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg font-semibold text-stone-900 dark:text-stone-50">{o.name}</CardTitle>
                        {o.short_label ? (
                          <p className="text-xs font-medium text-amber-800/90 dark:text-amber-300/90">{o.short_label}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          className={cn(
                            "border-0",
                            o.active
                              ? "bg-emerald-600/90 text-white"
                              : "bg-stone-500/80 text-white",
                          )}
                        >
                          {o.active ? "Actif" : "Pause"}
                        </Badge>
                        <Badge variant="outline" className="border-amber-400/50 text-amber-900 dark:text-amber-200">
                          {badge}
                        </Badge>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-xs text-stone-600 dark:text-stone-400">
                      {o.description || o.conditions_text || "—"}
                    </p>
                  </CardHeader>
                  <CardContent className="relative space-y-4 pt-0">
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] uppercase tracking-wide text-stone-500">
                      <div className="rounded-lg bg-stone-100/80 py-2 dark:bg-zinc-800/80">
                        <div className="text-lg font-semibold tabular-nums text-stone-900 dark:text-white">{used}</div>
                        <div>Usages</div>
                      </div>
                      <div className="rounded-lg bg-stone-100/80 py-2 dark:bg-zinc-800/80">
                        <div className="text-lg font-semibold tabular-nums text-stone-900 dark:text-white">
                          {stat ? stat.savings_attributed_eur.toFixed(0) : "—"}€
                        </div>
                        <div>Remisé</div>
                      </div>
                      <div className="rounded-lg bg-stone-100/80 py-2 dark:bg-zinc-800/80">
                        <div className="text-lg font-semibold tabular-nums text-stone-900 dark:text-white">
                          {conv != null ? `${conv}%` : "—"}
                        </div>
                        <div>vs limite</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {o.starts_at ? new Date(o.starts_at).toLocaleString("fr-FR", { dateStyle: "short" }) : "Début libre"}
                      <span>→</span>
                      {o.ends_at ? new Date(o.ends_at).toLocaleString("fr-FR", { dateStyle: "short" }) : "Fin libre"}
                    </div>
                    {o.promo_code ? (
                      <div className="rounded-md border border-dashed border-amber-400/50 bg-amber-50/50 px-2 py-1.5 font-mono text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                        {o.auto_apply ? "Auto + code " : "Code "}
                        <strong>{o.promo_code}</strong>
                      </div>
                    ) : o.auto_apply ? (
                      <div className="text-xs text-stone-500">Application automatique à la caisse (selon règles)</div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(o)} disabled={!isAdmin}>
                        Modifier
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void toggleActive(o)} disabled={!isAdmin}>
                        {o.active ? (
                          <>
                            <Pause className="mr-1 h-3.5 w-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-1 h-3.5 w-3.5" /> Activer
                          </>
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => void duplicate(o)} disabled={!isAdmin}>
                            <Copy className="mr-2 h-4 w-4" /> Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => void remove(o)}
                            disabled={!isAdmin}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Archiver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col overflow-y-auto border-amber-200/40 bg-[color:var(--lux-cream)] dark:border-amber-900/30 dark:bg-zinc-950 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">{editing ? "Modifier l’offre" : "Nouvelle offre"}</SheetTitle>
            <SheetDescription>
              Les champs avancés (happy hour, BXGY, fidélité) sont stockés dans{" "}
              <code className="text-xs">meta</code> et pilotent l’affichage client.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Sous-titre court (badge)</Label>
              <Input
                value={form.short_label}
                onChange={(e) => setForm((f) => ({ ...f, short_label: e.target.value }))}
                placeholder="Ex. Offre spéciale weekend"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.offer_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, offer_type: v as PromotionTypeValue }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {PROMOTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valeur (% ou € selon type)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.value_num}
                  onChange={(e) => setForm((f) => ({ ...f, value_num: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conditions (affichées caisse & client)</Label>
              <Textarea
                rows={2}
                value={form.conditions_text}
                onChange={(e) => setForm((f) => ({ ...f, conditions_text: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Début</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Limite d’usage globale</Label>
                <Input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Montant min. commande (€ HT)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.min_order_amount}
                  onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max / client</Label>
                <Input
                  type="number"
                  value={form.max_redemptions_per_user}
                  onChange={(e) => setForm((f) => ({ ...f, max_redemptions_per_user: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Visibilité canal</Label>
              <Select value={form.visibility} onValueChange={(v) => setForm((f) => ({ ...f, visibility: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AdminImageUpload
              scope="promotions"
              label="Image / bannière promo"
              hint="Envoi fichier uniquement — stockage Supabase (dossier promotions). Pas de collage d’URL."
              value={form.image_url}
              onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
              disabled={!isAdmin}
            />
            <div className="space-y-2">
              <Label>Code promo</Label>
              <Input
                value={form.promo_code}
                onChange={(e) => setForm((f) => ({ ...f, promo_code: e.target.value }))}
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="auto"
                  checked={form.auto_apply}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, auto_apply: c === true }))}
                />
                <Label htmlFor="auto" className="font-normal">
                  Application auto (sinon saisie code à la caisse)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="stack"
                  checked={form.stackable}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, stackable: c === true }))}
                />
                <Label htmlFor="stack" className="font-normal">
                  Cumulable (info — la caisse applique une offre à la fois)
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>IDs produits (un par ligne, UUID)</Label>
              <Textarea
                rows={2}
                className="font-mono text-xs"
                value={form.product_ids}
                onChange={(e) => setForm((f) => ({ ...f, product_ids: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Clés catégories (séparées par virgule)</Label>
              <Input value={form.category_keys} onChange={(e) => setForm((f) => ({ ...f, category_keys: e.target.value }))} />
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80 dark:text-amber-300/80">
              Conditions avancées (meta)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Happy hour — début (h)</Label>
                <Input value={form.hh0} onChange={(e) => setForm((f) => ({ ...f, hh0: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Happy hour — fin (h)</Label>
                <Input value={form.hh1} onChange={(e) => setForm((f) => ({ ...f, hh1: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fidélité — min. commandes</Label>
                <Input value={form.loyalty} onChange={(e) => setForm((f) => ({ ...f, loyalty: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Table — min. convives</Label>
                <Input value={form.party} onChange={(e) => setForm((f) => ({ ...f, party: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>BXGY achetés</Label>
                <Input value={form.bxBuy} onChange={(e) => setForm((f) => ({ ...f, bxBuy: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>BXGY offerts</Label>
                <Input value={form.bxGet} onChange={(e) => setForm((f) => ({ ...f, bxGet: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>% sur ligne offerte</Label>
                <Input value={form.bxPct} onChange={(e) => setForm((f) => ({ ...f, bxPct: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>% équivalent caisse</Label>
                <Input
                  value={form.equivPct}
                  onChange={(e) => setForm((f) => ({ ...f, equivPct: e.target.value }))}
                  placeholder="Combo, VIP…"
                />
              </div>
              <div className="space-y-2">
                <Label>Max quantité panier</Label>
                <Input value={form.maxCart} onChange={(e) => setForm((f) => ({ ...f, maxCart: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fin compte à rebours (affiche)</Label>
              <Input
                type="datetime-local"
                value={form.countdown}
                onChange={(e) => setForm((f) => ({ ...f, countdown: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Note IA / interne</Label>
              <Input value={form.aiHint} onChange={(e) => setForm((f) => ({ ...f, aiHint: e.target.value }))} />
            </div>
          </div>

          <SheetFooter className="border-t border-amber-200/30 pt-4 dark:border-amber-900/30">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => void submit()}
              disabled={saving || !isAdmin}
              className="bg-gradient-to-r from-amber-600 to-amber-800 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Enregistrer" : "Créer"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <SiteFooter />
    </PageShell>
  )
}
