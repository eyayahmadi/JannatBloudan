"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { PageHero } from "@/components/site/PageHero"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { SITE } from "@/lib/site-config"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { InvoiceItemLineStatus, SupplierInvoiceStatus } from "@/lib/supplier-invoices/types"

type InvItem = {
  id: string
  line_no?: number
  raw_name: string
  matched_ingredient_id: string | null
  line_status: string
  quantity: string | number
  unit: string
  unit_price: string | number | null
  line_total: string | number | null
  confidence?: number | null
  new_ingredient?: { name: string; unit: string }
}

type Invoice = {
  id: string
  supplier_name_raw: string | null
  supplier_id: string | null
  invoice_number: string | null
  invoice_date: string | null
  file_url: string | null
  input_mode: string
  status: SupplierInvoiceStatus
  total_ht: number | null
  tva: number | null
  total_ttc: number | null
  extraction_confidence: number | null
  commentaire: string | null
  created_at: string
  items?: InvItem[] | null
  supplier?: { id: string; name: string } | null
}

const STATUS_LABEL: Record<SupplierInvoiceStatus, { label: string; class: string }> = {
  brouillon: { label: "Brouillon", class: "bg-slate-100 text-slate-800" },
  extraction_en_cours: { label: "Extraction", class: "bg-amber-100 text-amber-900" },
  a_verifier: { label: "A vérifier", class: "bg-sky-100 text-sky-900" },
  validee: { label: "Validée", class: "bg-emerald-100 text-emerald-900" },
  rejetee: { label: "Rejetée", class: "bg-rose-100 text-rose-900" },
}

const LINE_STATUS_OPTS: { value: InvoiceItemLineStatus; label: string }[] = [
  { value: "matched", label: "Rattaché stock" },
  { value: "new_ingredient", label: "Nouvel ingrédient" },
  { value: "ignored", label: "Ignorer" },
]

type Ing = { id: string; name: string; unit: string | null }

export default function AdminSupplierInvoicesPage() {
  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell>
        <SiteHeader backHref="/admin" hideMainNav />
        <PageHero
          imageSrc={SITE.images.interior}
          imageAlt=""
          kicker="Administration"
          title="Factures fournisseurs"
          subtitle="OCR, vérification des lignes, validation avant tout impact sur le stock. Configurez OPENAI_API_KEY sur le serveur pour l'extraction."
          height="sm"
        />
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <InvoicesManager />
        </div>
        <AIAgentBadge context="admin" />
      </PageShell>
    </RequireAuth>
  )
}

function InvoicesManager() {
  const [list, setList] = useState<Invoice[]>([])
  const [ingredients, setIngredients] = useState<Ing[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [review, setReview] = useState<Invoice | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [iRes, gRes] = await Promise.all([
        fetch("/api/admin/supplier-invoices", { cache: "no-store" }),
        fetch("/api/admin/ingredients", { cache: "no-store" }),
      ])
      const ij = await iRes.json()
      const gj = await gRes.json()
      if (iRes.ok) setList(ij.invoices ?? [])
      if (gRes.ok) setIngredients(gj.ingredients ?? [])
    } catch {
      toast.error("Impossible de charger les factures")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createAndUpload = async (file: File, kind: "image" | "pdf") => {
    setSaving(true)
    try {
      const c = await fetch("/api/admin/supplier-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputMode: kind === "image" ? "upload_image" : "upload_pdf",
        }),
      })
      const cj = await c.json()
      if (!c.ok) {
        toast.error(cj.error ?? "Création impossible")
        return
      }
      const id = cj.invoice.id as string
      setPendingId(id)
      const fd = new FormData()
      fd.set("file", file)
      const u = await fetch(`/api/admin/supplier-invoices/${id}/upload`, { method: "POST", body: fd })
      const uj = await u.json()
      if (!u.ok) {
        toast.error(uj.error ?? uj.detail ?? "Upload / extraction échouée")
        return
      }
      toast.success("Extraction terminee — a verifier")
      setAddOpen(false)
      setReview(uj.invoice)
      void load()
    } finally {
      setSaving(false)
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Achats & factures</h2>
          <p className="text-sm text-muted-foreground">
            Le stock n'est mis a jour qu'apres validation explicite.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button type="button" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter facture
          </Button>
        </div>
      </div>

      <AddInvoiceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        saving={saving}
        ingredients={ingredients}
        onCreatedManual={() => {
          setAddOpen(false)
          void load()
        }}
        onUpload={createAndUpload}
        pendingId={pendingId}
      />

      {review && (
        <ReviewDialog
          invoice={review}
          ingredients={ingredients}
          onClose={() => setReview(null)}
          onSaved={() => {
            void load()
            setReview(null)
          }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement...
        </div>
      ) : list.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Aucune facture. Executez d'abord le script SQL 12 (tables fournisseurs) si besoin, puis
          ajoutez une facture.
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Fournisseur</th>
                <th className="p-3 font-medium">N° / Date</th>
                <th className="p-3 font-medium">Mode</th>
                <th className="p-3 font-medium">Total TTC</th>
                <th className="p-3 font-medium">Statut</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    {inv.supplier?.name || inv.supplier_name_raw || "—"}
                  </td>
                  <td className="p-3">
                    {inv.invoice_number || "—"}
                    <br />
                    <span className="text-xs text-muted-foreground">{inv.invoice_date || "—"}</span>
                  </td>
                  <td className="p-3">{inv.input_mode?.replace(/_/g, " ")}</td>
                  <td className="p-3">
                    {inv.total_ttc != null ? Number(inv.total_ttc).toFixed(2) + " EUR" : "—"}
                  </td>
                  <td className="p-3">
                    <Badge
                      className={cn("font-normal", STATUS_LABEL[inv.status]?.class)}
                      variant="secondary"
                    >
                      {STATUS_LABEL[inv.status]?.label ?? inv.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReview(inv)}
                      disabled={inv.status === "extraction_en_cours"}
                    >
                      Ouvrir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AddInvoiceDialog({
  open,
  onOpenChange,
  saving,
  ingredients,
  onCreatedManual,
  onUpload,
  pendingId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  saving: boolean
  ingredients: Ing[]
  onCreatedManual: () => void
  onUpload: (file: File, k: "image" | "pdf") => void | Promise<void>
  pendingId: string | null
}) {
  const [mSupplier, setMSupplier] = useState("")
  const [mNo, setMNo] = useState("")
  const [mDate, setMDate] = useState(new Date().toISOString().slice(0, 10))
  const [mTtc, setMTtc] = useState("")
  const [mLines, setMLines] = useState<InvItem[]>([
    {
      id: "n1",
      raw_name: "",
      matched_ingredient_id: null,
      line_status: "new_ingredient",
      quantity: 1,
      unit: "kg",
      unit_price: "",
      line_total: "",
    },
  ])
  const [mComment, setMComment] = useState("")

  const addLine = () =>
    setMLines((p) => [
      ...p,
      {
        id: "n" + Date.now(),
        raw_name: "",
        matched_ingredient_id: null,
        line_status: "new_ingredient",
        quantity: 1,
        unit: "kg",
        unit_price: "",
        line_total: "",
      },
    ])

  const saveManual = async () => {
    const lines = mLines
      .filter((l) => l.raw_name.trim())
      .map((l) => {
        const resolvedStatus: InvoiceItemLineStatus = l.matched_ingredient_id
          ? "matched"
          : (l.line_status as InvoiceItemLineStatus)
        return {
          raw_name: l.raw_name,
          line_status: resolvedStatus,
          matched_ingredient_id: l.matched_ingredient_id,
          quantity: Number(l.quantity) || 0,
          unit: l.unit,
          unit_price: l.unit_price === "" ? null : Number(l.unit_price),
          line_total: l.line_total === "" ? null : Number(l.line_total),
          new_ingredient:
            resolvedStatus === "new_ingredient"
              ? l.new_ingredient ?? { name: l.raw_name, unit: l.unit }
              : undefined,
        }
      })
    if (!lines.length) {
      toast.error("Au moins une ligne produit")
      return
    }
    const c = await fetch("/api/admin/supplier-invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputMode: "manuel",
        supplierName: mSupplier || null,
        invoiceNumber: mNo,
        invoiceDate: mDate,
        total_ttc: mTtc ? Number(mTtc) : null,
        commentaire: mComment || null,
        items: lines,
      }),
    })
    const j = await c.json()
    if (!c.ok) {
      toast.error(j.error ?? "Erreur")
      return
    }
    toast.success("Brouillon / a verifier cree")
    onCreatedManual()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter une facture</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="image">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="image">
              <ImageIcon className="mr-1 h-4 w-4" />
              Image
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <FileText className="mr-1 h-4 w-4" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="manual">Manuel</TabsTrigger>
          </TabsList>
          <TabsContent value="image" className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Fichier PNG, JPEG ou WebP. Extraction par vision (OpenAI).
            </p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={saving}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onUpload(f, "image")
              }}
            />
            {saving && pendingId && (
              <p className="text-xs text-amber-700">Extraction en cours...</p>
            )}
          </TabsContent>
          <TabsContent value="pdf" className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">PDF: texte extrait puis JSON structure.</p>
            <input
              type="file"
              accept="application/pdf"
              disabled={saving}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onUpload(f, "pdf")
              }}
            />
          </TabsContent>
          <TabsContent value="manual" className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label>Fournisseur (optionnel)</Label>
              <Input value={mSupplier} onChange={(e) => setMSupplier(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>N° facture</Label>
                <Input value={mNo} onChange={(e) => setMNo(e.target.value)} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Total TTC (EUR)</Label>
              <Input value={mTtc} onChange={(e) => setMTtc(e.target.value)} placeholder="ex: 55" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lignes</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLine}>
                  + Ligne
                </Button>
              </div>
              {mLines.map((line, i) => (
                <Card key={line.id} className="space-y-2 p-3">
                  <div className="grid gap-2">
                    <Input
                      placeholder="Produit"
                      value={line.raw_name}
                      onChange={(e) => {
                        const v = e.target.value
                        setMLines((p) =>
                          p.map((x, j) => (j === i ? { ...x, raw_name: v } : x)),
                        )
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Qte"
                        value={String(line.quantity)}
                        onChange={(e) => {
                          const v = e.target.value
                          setMLines((p) =>
                            p.map((x, j) => (j === i ? { ...x, quantity: v } : x)),
                          )
                        }}
                      />
                      <Input
                        placeholder="unite (kg, L...)"
                        value={line.unit}
                        onChange={(e) => {
                          const v = e.target.value
                          setMLines((p) =>
                            p.map((x, j) => (j === i ? { ...x, unit: v } : x)),
                          )
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Prix unitaire"
                        value={String(line.unit_price ?? "")}
                        onChange={(e) => {
                          const v = e.target.value
                          setMLines((p) =>
                            p.map((x, j) => (j === i ? { ...x, unit_price: v } : x)),
                          )
                        }}
                      />
                      <Input
                        type="number"
                        step="any"
                        placeholder="Total ligne"
                        value={String(line.line_total ?? "")}
                        onChange={(e) => {
                          const v = e.target.value
                          setMLines((p) =>
                            p.map((x, j) => (j === i ? { ...x, line_total: v } : x)),
                          )
                        }}
                      />
                    </div>
                    <Select
                      value={line.line_status}
                      onValueChange={(v) =>
                        setMLines((p) =>
                          p.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  line_status: v,
                                  new_ingredient:
                                    v === "new_ingredient"
                                      ? { name: x.raw_name, unit: x.unit }
                                      : undefined,
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LINE_STATUS_OPTS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {line.line_status === "matched" && (
                      <Select
                        value={line.matched_ingredient_id ?? "none"}
                        onValueChange={(v) =>
                          setMLines((p) =>
                            p.map((x, j) =>
                              j === i
                                ? { ...x, matched_ingredient_id: v === "none" ? null : v }
                                : x,
                            ),
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ingrédient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">(choisir)</SelectItem>
                          {ingredients.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name} ({g.unit || "u"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {line.line_status === "new_ingredient" && (
                      <p className="text-xs text-muted-foreground">
                        A la validation, un ingrédient {line.raw_name || "…"} sera créé si besoin.
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setMLines((p) => p.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
            <div>
              <Label>Commentaire</Label>
              <Textarea
                value={mComment}
                onChange={(e) => setMComment(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            <Button type="button" disabled={saving} onClick={() => void saveManual()}>
              Enregistrer saisie
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function ReviewDialog({
  invoice: inv,
  ingredients,
  onClose,
  onSaved,
}: {
  invoice: Invoice
  ingredients: Ing[]
  onClose: () => void
  onSaved: () => void
}) {
  const [lines, setLines] = useState<InvItem[]>(() => prepareLines(inv))
  const [head, setHead] = useState({
    supplier: inv.supplier_name_raw || "",
    no: inv.invoice_number || "",
    date: inv.invoice_date || "",
    ttc: inv.total_ttc != null ? String(inv.total_ttc) : "",
  })
  const [saving, setSaving] = useState(false)
  const [valLoading, setValLoading] = useState(false)

  const persistPatch = async () => {
    setSaving(true)
    try {
      const items = lines.map((l) => ({
        raw_name: l.raw_name,
        line_status: l.line_status as InvoiceItemLineStatus,
        matched_ingredient_id: l.matched_ingredient_id,
        quantity: Number(l.quantity) || 0,
        unit: l.unit,
        unit_price: l.unit_price === "" || l.unit_price == null ? null : Number(l.unit_price),
        line_total: l.line_total === "" || l.line_total == null ? null : Number(l.line_total),
        vat_rate: null,
        confidence: l.confidence ?? 1,
        new_ingredient: l.new_ingredient,
      }))
      const res = await fetch(`/api/admin/supplier-invoices/${inv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName: head.supplier,
          invoiceNumber: head.no,
          invoiceDate: head.date,
          total_ttc: head.ttc ? Number(head.ttc) : null,
          items,
        }),
      })
      const j = await res.json()
      if (!res.ok) {
        toast.error(j.error ?? "Sauvegarde impossible")
        return
      }
      toast.success("Brouillon enregistre")
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const reject = async () => {
    const res = await fetch(`/api/admin/supplier-invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejetee" }),
    })
    if (!res.ok) {
      const j = await res.json()
      toast.error(j.error)
      return
    }
    toast.info("Facture rejetee")
    onClose()
    onSaved()
  }

  const validate = async () => {
    setValLoading(true)
    try {
      const items = lines
        .filter((l) => l.raw_name.trim())
        .map((l) => {
          const st = l.line_status as InvoiceItemLineStatus
          return {
            id: l.id,
            raw_name: l.raw_name,
            line_status: st,
            matched_ingredient_id: l.matched_ingredient_id,
            new_ingredient:
              st === "new_ingredient" ? l.new_ingredient ?? { name: l.raw_name, unit: l.unit } : undefined,
            quantity: Number(l.quantity) || 0,
            unit: l.unit,
            unit_price: l.unit_price === "" || l.unit_price == null ? null : Number(l.unit_price),
            line_total: l.line_total === "" || l.line_total == null ? null : Number(l.line_total),
            vat_rate: null,
            confidence: l.confidence ?? 1,
          }
        })
      const res = await fetch(`/api/admin/supplier-invoices/${inv.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      const j = await res.json()
      if (!res.ok) {
        toast.error(j.error ?? "Validation impossible")
        return
      }
      toast.success("Facture validee — stock et depense enregistres")
      onClose()
      onSaved()
    } finally {
      setValLoading(false)
    }
  }

  const addLine = () =>
    setLines((p) => [
      ...p,
      {
        id: "tmp-" + Date.now(),
        raw_name: "",
        matched_ingredient_id: null,
        line_status: "new_ingredient",
        quantity: 1,
        unit: "kg",
        unit_price: "",
        line_total: "",
        new_ingredient: { name: "", unit: "kg" },
      },
    ])

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verifier la facture</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {inv.status === "validee" && (
            <p className="text-emerald-700">Cette facture est deja validee.</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>Fournisseur (texte facture)</Label>
              <Input value={head.supplier} onChange={(e) => setHead((h) => ({ ...h, supplier: e.target.value }))} />
            </div>
            <div>
              <Label>N°</Label>
              <Input value={head.no} onChange={(e) => setHead((h) => ({ ...h, no: e.target.value }))} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={head.date || ""} onChange={(e) => setHead((h) => ({ ...h, date: e.target.value }))} />
            </div>
            <div>
              <Label>Total TTC</Label>
              <Input value={head.ttc} onChange={(e) => setHead((h) => ({ ...h, ttc: e.target.value }))} />
            </div>
          </div>
          {inv.file_url && (
            <a
              className="inline-flex text-sm text-primary underline"
              href={inv.file_url}
              target="_blank"
              rel="noreferrer"
            >
              Voir le fichier
            </a>
          )}

          <div className="flex items-center justify-between">
            <p className="font-medium">Lignes</p>
            <Button type="button" size="sm" variant="outline" onClick={addLine} disabled={inv.status === "validee"}>
              + Ligne
            </Button>
          </div>

          <div className="max-h-[45vh] overflow-auto rounded border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 bg-muted/80">
                <tr>
                  <th className="p-2">Produit (extrait)</th>
                  <th className="p-2">Lien stock</th>
                  <th className="p-2">Qte</th>
                  <th className="p-2">Unite</th>
                  <th className="p-2">P.U.</th>
                  <th className="p-2">Total</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={line.id} className="border-t">
                    <td className="p-1 align-top">
                      <Input
                        value={line.raw_name}
                        onChange={(e) => {
                          const v = e.target.value
                          setLines((p) => p.map((x, j) => (j === i ? { ...x, raw_name: v } : x)))
                        }}
                        disabled={inv.status === "validee"}
                      />
                    </td>
                    <td className="p-1 align-top">
                      <div className="space-y-1">
                        <Select
                          value={line.line_status}
                          onValueChange={(v) =>
                            setLines((p) =>
                              p.map((x, j) =>
                                j === i
                                  ? {
                                      ...x,
                                      line_status: v,
                                      new_ingredient:
                                        v === "new_ingredient"
                                          ? { name: x.raw_name, unit: x.unit }
                                          : x.new_ingredient,
                                    }
                                  : x,
                              ),
                            )
                          }
                          disabled={inv.status === "validee"}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LINE_STATUS_OPTS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {line.line_status === "matched" && (
                          <Select
                            value={line.matched_ingredient_id ?? "none"}
                            onValueChange={(v) =>
                              setLines((p) =>
                                p.map((x, j) =>
                                  j === i
                                    ? { ...x, matched_ingredient_id: v === "none" ? null : v }
                                    : x,
                                ),
                              )
                            }
                            disabled={inv.status === "validee"}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="ingredient" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {ingredients.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {line.line_status === "new_ingredient" && (
                          <p className="text-[10px] text-amber-800">Nouvel ingredient</p>
                        )}
                      </div>
                    </td>
                    <td className="p-1 align-top">
                      <Input
                        type="number"
                        className="h-8"
                        value={String(line.quantity)}
                        onChange={(e) => {
                          const v = e.target.value
                          setLines((p) => p.map((x, j) => (j === i ? { ...x, quantity: v } : x)))
                        }}
                        disabled={inv.status === "validee" || line.line_status === "ignored"}
                      />
                    </td>
                    <td className="p-1 align-top">
                      <Input
                        className="h-8 w-20"
                        value={line.unit}
                        onChange={(e) => {
                          const v = e.target.value
                          setLines((p) => p.map((x, j) => (j === i ? { ...x, unit: v } : x)))
                        }}
                        disabled={inv.status === "validee" || line.line_status === "ignored"}
                      />
                    </td>
                    <td className="p-1 align-top">
                      <Input
                        type="number"
                        className="h-8 w-24"
                        value={String(line.unit_price ?? "")}
                        onChange={(e) => {
                          const v = e.target.value
                          setLines((p) => p.map((x, j) => (j === i ? { ...x, unit_price: v } : x)))
                        }}
                        disabled={inv.status === "validee" || line.line_status === "ignored"}
                      />
                    </td>
                    <td className="p-1 align-top">
                      <Input
                        type="number"
                        className="h-8 w-24"
                        value={String(line.line_total ?? "")}
                        onChange={(e) => {
                          const v = e.target.value
                          setLines((p) => p.map((x, j) => (j === i ? { ...x, line_total: v } : x)))
                        }}
                        disabled={inv.status === "validee" || line.line_status === "ignored"}
                      />
                    </td>
                    <td className="p-1">
                      {inv.status !== "validee" && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => setLines((p) => p.filter((_, j) => j !== i))}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inv.extraction_confidence != null && (
            <p className="text-xs text-muted-foreground">
              Confiance extraction: {Number(inv.extraction_confidence).toFixed(2)}
            </p>
          )}

          {inv.status !== "validee" && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                Fermer
              </Button>
              <Button type="button" variant="secondary" onClick={reject} disabled={saving || valLoading}>
                Rejeter
              </Button>
              <Button type="button" variant="outline" onClick={() => void persistPatch()} disabled={saving || valLoading}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </Button>
              <Button
                type="button"
                onClick={() => void validate()}
                disabled={saving || valLoading || !["a_verifier", "brouillon"].includes(inv.status)}
              >
                {valLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Valider (stock + depense)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function prepareLines(inv: Invoice): InvItem[] {
  const it = inv.items
  if (!it?.length) {
    return [
      {
        id: "e1",
        raw_name: "",
        matched_ingredient_id: null,
        line_status: "new_ingredient",
        quantity: 1,
        unit: "kg",
        unit_price: "",
        line_total: "",
      },
    ]
  }
  return it.map((l) => ({
    id: l.id,
    raw_name: l.raw_name,
    matched_ingredient_id: l.matched_ingredient_id,
    line_status: l.line_status,
    quantity: l.quantity,
    unit: l.unit,
    unit_price: l.unit_price,
    line_total: l.line_total,
    confidence: l.confidence,
    new_ingredient:
      l.line_status === "new_ingredient" ? { name: l.raw_name, unit: l.unit } : undefined,
  }))
}
