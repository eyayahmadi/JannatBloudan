"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Copy, ExternalLink, Eye, Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Aperçu en direct de la « vue client » (celle obtenue lorsque le client scanne
 * le QR code de la table). Montre l'URL publique dans une iframe avec :
 *   - sélection de viewport (mobile / tablette / desktop)
 *   - bouton de copie de l'URL
 *   - lien « Ouvrir dans un onglet »
 *   - bouton « Recharger » (force refresh de l'iframe)
 *
 * Pensé pour être réutilisé partout en admin (tables-qr, caisse, dashboard).
 */

type Viewport = "mobile" | "tablet" | "desktop"

const VIEWPORT_PRESETS: Record<Viewport, { w: number; h: number; label: string }> = {
  mobile: { w: 390, h: 760, label: "Mobile" },
  tablet: { w: 820, h: 880, label: "Tablette" },
  desktop: { w: 1100, h: 740, label: "Bureau" },
}

type Props = {
  /** URL publique à prévisualiser (généralement `/table/{code}`). */
  url: string
  /** Libellé court (ex. « Table 12 »). */
  label?: string
  /** Si fourni, le composant rend son propre déclencheur (bouton). */
  triggerLabel?: string
  /** Mode contrôlé : si fourni, le composant ne pilote pas son ouverture. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Surcharge le bouton trigger par défaut. */
  trigger?: React.ReactNode
  /** Variante du bouton par défaut. */
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ClientPreviewDialog({
  url,
  label,
  triggerLabel = "Vue client",
  open,
  onOpenChange,
  trigger,
  variant = "secondary",
  size = "sm",
  className,
}: Props) {
  const isControlled = typeof open === "boolean"
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = isControlled ? open : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const [viewport, setViewport] = useState<Viewport>("mobile")
  const [iframeKey, setIframeKey] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(t)
  }, [copied])

  const preset = VIEWPORT_PRESETS[viewport]

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      /* clipboard non dispo (insecure context) */
    }
  }

  const triggerEl = useMemo(() => {
    if (trigger) return trigger
    return (
      <Button type="button" variant={variant} size={size} className={cn("gap-1.5", className)}>
        <Eye className="h-3.5 w-3.5" />
        {triggerLabel}
      </Button>
    )
  }, [trigger, variant, size, className, triggerLabel])

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isControlled ? <DialogTrigger asChild>{triggerEl}</DialogTrigger> : null}
      <DialogContent className="max-h-[95vh] w-[min(96vw,1200px)] max-w-[1200px] overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border/60 px-4 py-3">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-[color:var(--lux-bordeaux)]" />
            Vue client
            {label ? (
              <Badge variant="outline" className="font-normal">
                {label}
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Aperçu en direct de la page affichée lorsqu&apos;un client scanne le QR code de la table.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/40 px-3 py-2 text-xs">
          <div className="flex items-center gap-1 rounded-md border border-input bg-background p-0.5">
            <ViewportButton
              active={viewport === "mobile"}
              onClick={() => setViewport("mobile")}
              icon={<Smartphone className="h-3.5 w-3.5" />}
              label="Mobile"
            />
            <ViewportButton
              active={viewport === "tablet"}
              onClick={() => setViewport("tablet")}
              icon={<Tablet className="h-3.5 w-3.5" />}
              label="Tablette"
            />
            <ViewportButton
              active={viewport === "desktop"}
              onClick={() => setViewport("desktop")}
              icon={<Monitor className="h-3.5 w-3.5" />}
              label="Bureau"
            />
          </div>

          <span className="ml-1 truncate font-mono text-[11px] text-muted-foreground" title={url}>
            {url}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1"
              onClick={() => setIframeKey((k) => k + 1)}
              title="Recharger"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Recharger
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1"
              onClick={() => void onCopy()}
              title="Copier l'URL"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copié" : "Copier l'URL"}
            </Button>
            <Button asChild type="button" variant="outline" size="sm" className="h-8 gap-1">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Ouvrir dans un onglet
              </a>
            </Button>
          </div>
        </div>

        <div className="flex max-h-[78vh] items-start justify-center overflow-auto bg-neutral-100 p-4 dark:bg-neutral-900">
          <div
            className={cn(
              "relative shrink-0 overflow-hidden rounded-[28px] border border-neutral-300 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-950",
              viewport === "desktop" && "rounded-xl",
            )}
            style={{ width: preset.w, height: preset.h, maxWidth: "100%" }}
          >
            {viewport !== "desktop" ? (
              <span className="absolute left-1/2 top-1.5 h-1 w-12 -translate-x-1/2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            ) : null}
            <iframe
              key={iframeKey}
              src={url}
              title={`Vue client${label ? " — " + label : ""}`}
              className={cn(
                "h-full w-full bg-white",
                viewport !== "desktop" && "pt-3",
              )}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ViewportButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded px-2 py-1 transition",
        active
          ? "bg-[color:var(--lux-bordeaux)]/12 text-[color:var(--lux-bordeaux)] dark:text-[color:var(--lux-gold)]"
          : "text-muted-foreground hover:bg-muted",
      )}
      aria-pressed={active}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
