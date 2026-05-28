"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FileText, ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  compressMenuImageBlob,
  MENU_IMAGE_MAX_ORIGINAL_BYTES,
  validateMenuImageForUpload,
} from "@/lib/client/compress-product-image"

const MIME_PDF = "application/pdf"

type Props = {
  value: string
  onChange: (nextUrl: string) => void
  disabled?: boolean
  /** Zone plus compacte (formulaire caisse). */
  compact?: boolean
  /** Autoriser PDF en plus des images (upload sans compression côté client). */
  allowPdf?: boolean
}

async function uploadAttachment(file: Blob, filename: string, contentType: string): Promise<string> {
  const f = file instanceof File ? file : new File([file], filename, { type: contentType })
  const fd = new FormData()
  fd.append("file", f)
  const res = await fetch("/api/caisse/movement-attachment", {
    method: "POST",
    body: fd,
  })
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string; detail?: string }
  if (!res.ok || !j?.url) {
    throw new Error(j?.error || j?.detail || "Échec de l’envoi.")
  }
  return j.url
}

function isPdfFile(f: File) {
  return f.type === MIME_PDF || f.name.toLowerCase().endsWith(".pdf")
}

export function CaisseMovementAttachmentUploader({ value, onChange, disabled, compact, allowPdf = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [uploadedKind, setUploadedKind] = useState<"none" | "image" | "pdf">("none")
  const [pdfLabel, setPdfLabel] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const revokeBlobPreview = useCallback(() => {
    const u = previewUrlRef.current
    if (u?.startsWith("blob:")) URL.revokeObjectURL(u)
    previewUrlRef.current = null
    setPreviewUrl(null)
  }, [])

  useEffect(() => () => revokeBlobPreview(), [revokeBlobPreview])

  /** Si le parent vide la valeur, réinitialiser l’aperçu local. */
  useEffect(() => {
    if (!value.trim()) {
      setUploadedKind("none")
      setPdfLabel(null)
      revokeBlobPreview()
    }
  }, [value, revokeBlobPreview])

  const handleFile = useCallback(
    async (raw: File) => {
      setError(null)
      revokeBlobPreview()
      setUploadedKind("none")
      setPdfLabel(null)

      if (allowPdf && isPdfFile(raw)) {
        if (!raw.size) {
          setError("Fichier vide.")
          return
        }
        if (raw.size > MENU_IMAGE_MAX_ORIGINAL_BYTES) {
          setError("Fichier trop volumineux (maximum 5 Mo).")
          return
        }
        setUploading(true)
        try {
          const safeBase = String(raw.name || "ticket").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120)
          const fileName = safeBase.toLowerCase().endsWith(".pdf") ? safeBase : `${safeBase}.pdf`
          const url = await uploadAttachment(raw, fileName, MIME_PDF)
          setPdfLabel(fileName)
          setUploadedKind("pdf")
          onChange(url)
        } catch (e) {
          setError(e instanceof Error ? e.message : "Envoi impossible.")
        } finally {
          setUploading(false)
        }
        return
      }

      const vErr = validateMenuImageForUpload(raw)
      if (vErr) {
        setError(vErr)
        return
      }

      setUploading(true)
      try {
        const compressed = await compressMenuImageBlob(raw)
        const objectUrl = URL.createObjectURL(compressed.blob)
        previewUrlRef.current = objectUrl
        setPreviewUrl(objectUrl)

        const url = await uploadAttachment(
          compressed.blob,
          `piece-jointe${compressed.filenameExt}`,
          compressed.contentType,
        )
        setUploadedKind("image")
        setPdfLabel(null)
        onChange(url)
        revokeBlobPreview()
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : raw.size > MENU_IMAGE_MAX_ORIGINAL_BYTES
              ? "Fichier trop volumineux (maximum 5 Mo)."
              : "Une erreur est survenue pendant le traitement."
        setError(msg)
        revokeBlobPreview()
      } finally {
        setUploading(false)
      }
    },
    [allowPdf, onChange, revokeBlobPreview],
  )

  const openPicker = () => {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  const clearAttachment = () => {
    revokeBlobPreview()
    setUploadedKind("none")
    setPdfLabel(null)
    onChange("")
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled || uploading) return
    const f = e.dataTransfer.files?.[0]
    if (f) void handleFile(f)
  }

  const acceptAttr = allowPdf
    ? "image/jpeg,image/jpg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
    : "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"

  const hintPdf = allowPdf ? " JPG, PNG, WebP ou PDF" : " JPG, PNG ou WebP"

  const imageDisplaySrc = previewUrl || (uploadedKind === "image" && value.trim() ? value.trim() : null)
  const showPdf = uploadedKind === "pdf" && Boolean(value.trim())

  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      <Label className={cn(compact ? "text-xs" : "text-sm")}>Pièce jointe (ticket / capture)</Label>
      <p className={cn("text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>
        Glisser-déposer ou parcourir —{hintPdf}, max {MENU_IMAGE_MAX_ORIGINAL_BYTES / (1024 * 1024)} Mo.
        {!allowPdf ? " Compression automatique avant envoi." : " Images redimensionnées avant envoi ; PDF envoyé tel quel."}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
        }}
      />

      <button
        type="button"
        disabled={disabled || uploading}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={openPicker}
        className={cn(
          "relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition",
          compact ? "px-3 py-5" : "px-4 py-8 gap-3",
          dragOver ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/25" : "border-slate-300 bg-slate-50/70 dark:border-slate-600 dark:bg-slate-900/45",
          (disabled || uploading) && "pointer-events-none opacity-70",
        )}
      >
        {uploading ? (
          <>
            <Loader2 className={cn("animate-spin text-amber-600", compact ? "h-8 w-8" : "h-10 w-10")} aria-hidden />
            <span className={cn("font-medium text-slate-700 dark:text-slate-200", compact ? "text-xs" : "text-sm")}>
              Envoi en cours…
            </span>
          </>
        ) : showPdf ? (
          <div className="flex flex-col items-center gap-1 py-1">
            <FileText className="h-8 w-8 text-slate-500" aria-hidden />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">PDF joint</span>
            {pdfLabel ? (
              <span className="max-w-full truncate px-2 text-[10px] text-muted-foreground">{pdfLabel}</span>
            ) : null}
          </div>
        ) : imageDisplaySrc ? (
          <div
            className={cn(
              "relative w-full max-w-md overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800",
              compact ? "h-28" : "h-40",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDisplaySrc} alt="Aperçu" className="h-full w-full object-cover" />
          </div>
        ) : (
          <>
            <ImageIcon className={cn("text-slate-400", compact ? "h-8 w-8" : "h-10 w-10")} aria-hidden />
            <span className={cn("text-slate-600 dark:text-slate-300", compact ? "text-xs" : "text-sm")}>
              Déposez un fichier ou cliquez pour parcourir
            </span>
          </>
        )}
      </button>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" disabled={disabled || uploading} onClick={openPicker}>
          <Upload className="h-3.5 w-3.5" />
          {allowPdf ? "Choisir fichier" : "Choisir une image"}
        </Button>
        {value.trim() && !uploading ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-red-600 hover:text-red-700" onClick={clearAttachment}>
            <Trash2 className="h-3.5 w-3.5" />
            Retirer
          </Button>
        ) : null}
      </div>

      {error ? (
        <p
          className={cn(
            "rounded-lg border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
            compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm",
          )}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
