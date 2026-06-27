"use client"

import { AdminImageUpload } from "@/components/admin/AdminImageUpload"
import { MENU_IMAGE_MAX_ORIGINAL_BYTES } from "@/lib/client/compress-product-image"

type Props = {
  value: string
  onChange: (nextUrl: string) => void
  disabled?: boolean
  compact?: boolean
}

/** Upload photo produit (bucket public, dossier « products ») — aucune saisie d’URL. */
export function ProductMenuImageUpload({ value, onChange, disabled, compact }: Props) {
  return (
    <AdminImageUpload
      scope="products"
      label="Photo du plat"
      hint={`JPG, PNG ou WebP — max ${MENU_IMAGE_MAX_ORIGINAL_BYTES / (1024 * 1024)} Mo. Glisser-déposer ou cliquer pour choisir une image (compression avant envoi).`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      compact={compact}
    />
  )
}
