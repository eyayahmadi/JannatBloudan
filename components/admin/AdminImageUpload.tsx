"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  compressMenuImageBlob,
  MENU_IMAGE_MAX_ORIGINAL_BYTES,
  validateMenuImageForUpload,
} from "@/lib/client/compress-product-image"
import type { AdminImageScope } from "@/lib/admin/image-upload-scope"

async function uploadToPublicBucket(
  blob: Blob,
  contentType: string,
  filenameExt: string,
  scope: AdminImageScope,
): Promise<string> {
  const name = `upload${filenameExt}`
  const file = new File([blob], name, { type: contentType })
  const fd = new FormData()
  fd.append("file", file)
  fd.append("scope", scope)
  const res = await fetch("/api/admin/upload-image", {
    method: "POST",
    body: fd,
  })
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string; detail?: string }
  if (!res.ok || !j?.url) {
    throw new Error(j?.error || j?.detail || "Échec de l’envoi.")
  }
  return j.url
}

export type AdminImageUploadProps = {
  scope: AdminImageScope
  value: string
  onChange: (nextUrl: string) => void
  disabled?: boolean
  label: string
  /** Texte sous le titre (formats, taille, etc.). */
  hint?: string
  /** Zone plus compacte (modales admin). */
  compact?: boolean
}

/** Zone glisser-déposer / fichier — envoi Supabase Storage, pas de champ URL manuel. */
export function AdminImageUpload({
  scope,
  value,
  onChange,
  disabled,
  label,
  hint,
  compact = false,
}: AdminImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const revokePreview = useCallback(() => {
    const u = previewUrlRef.current
    if (u?.startsWith("blob:")) {
      URL.revokeObjectURL(u)
    }
    previewUrlRef.current = null
    setPreviewUrl(null)
  }, [])

  useEffect(() => () => revokePreview(), [revokePreview])

  const handleFile = useCallback(
    async (raw: File) => {
      setError(null)
      const vErr = validateMenuImageForUpload(raw)
      if (vErr) {
        setError(vErr)
        return
      }

      revokePreview()
      setUploading(true)
      try {
        const compressed = await compressMenuImageBlob(raw)

        const objectUrl = URL.createObjectURL(compressed.blob)
        previewUrlRef.current = objectUrl
        setPreviewUrl(objectUrl)

        const url = await uploadToPublicBucket(compressed.blob, compressed.contentType, compressed.filenameExt, scope)
        onChange(url)
        revokePreview()
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : raw.size > MENU_IMAGE_MAX_ORIGINAL_BYTES
              ? "Image trop volumineuse (maximum 5 Mo)."
              : "Une erreur est survenue pendant le traitement."
        setError(msg)
        revokePreview()
      } finally {
        setUploading(false)
      }
    },
    [onChange, revokePreview, scope],
  )

  const openPicker = () => {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  const clearImage = () => {
    revokePreview()
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

  const displaySrc = previewUrl || (value.trim() ? value.trim() : null)

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <p className="text-xs text-muted-foreground">
        {hint ??
          `Envoi fichier uniquement — JPG, PNG ou WebP, max ${MENU_IMAGE_MAX_ORIGINAL_BYTES / (1024 * 1024)} Mo. Glisser-déposer ou parcourir.`}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
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
          "relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center transition",
          compact ? "py-4" : "gap-3 py-8",
          dragOver ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/25" : "border-slate-300 bg-slate-50/70 dark:border-slate-600 dark:bg-slate-900/45",
          (disabled || uploading) && "pointer-events-none opacity-70",
        )}
      >
        {uploading ? (
          <>
            <Loader2 className={cn("animate-spin text-amber-600", compact ? "h-8 w-8" : "h-10 w-10")} aria-hidden />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Envoi en cours…</span>
          </>
        ) : displaySrc ? (
          <div
            className={cn(
              "relative w-full max-w-md overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800",
              compact ? "h-28" : "h-40",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- aperçu admin */}
            <img src={displaySrc} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <>
            <ImageIcon className={cn("text-slate-400", compact ? "h-8 w-8" : "h-10 w-10")} aria-hidden />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Déposez une image ici ou cliquez pour parcourir
            </span>
          </>
        )}
      </button>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={disabled || uploading} onClick={openPicker}>
          <Upload className="h-4 w-4" />
          Choisir une image
        </Button>
        {(value.trim() || previewUrl) && !uploading ? (
          <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-red-600 hover:text-red-700" onClick={clearImage}>
            <Trash2 className="h-4 w-4" />
            Retirer l&apos;image
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  )
}
