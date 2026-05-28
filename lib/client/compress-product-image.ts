/** Utilitaires navigateur uniquement — compression vignettes menu. */

export const MENU_IMAGE_MAX_ORIGINAL_BYTES = 5 * 1024 * 1024

const MAX_EDGE_PX = 1920

const ACCEPTED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])

export function validateMenuImageForUpload(file: File): string | null {
  const t = String(file.type || "").toLowerCase()
  if (!file.size || file.size <= 0) return "Fichier vide."
  if (!ACCEPTED_MIME.has(t)) {
    return "Formats acceptés : JPG, PNG, WebP."
  }
  if (file.size > MENU_IMAGE_MAX_ORIGINAL_BYTES) {
    return "Image trop volumineuse (maximum 5 Mo)."
  }
  return null
}

async function blobToCompressed(file: Blob, mimeOut: string, quality: number): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  try {
    const maxEdge = Math.max(bmp.width, bmp.height)
    const ratio = maxEdge <= MAX_EDGE_PX ? 1 : MAX_EDGE_PX / maxEdge
    const w = Math.max(1, Math.round(bmp.width * ratio))
    const h = Math.max(1, Math.round(bmp.height * ratio))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas indisponible")
    ctx.drawImage(bmp, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mimeOut, quality)
    })
    if (!blob || blob.size === 0) throw new Error("Compression échouée")
    return blob
  } finally {
    bmp.close?.()
  }
}

/**
 * Redimensionnement + compression (WebP puis repli JPEG si navigateur ou taille).
 * À appeler uniquement après validateMenuImageForUpload OK.
 */
export async function compressMenuImageBlob(file: File): Promise<{ blob: Blob; contentType: string; filenameExt: string }> {
  let tryWebp: Blob | null = null
  try {
    tryWebp = await blobToCompressed(file, "image/webp", 0.82)
  } catch {
    tryWebp = null
  }
  if (tryWebp && tryWebp.size > 0 && tryWebp.size <= MENU_IMAGE_MAX_ORIGINAL_BYTES) {
    return { blob: tryWebp, contentType: "image/webp", filenameExt: ".webp" }
  }

  const jpeg = await blobToCompressed(file, "image/jpeg", 0.82)
  if (jpeg.size > MENU_IMAGE_MAX_ORIGINAL_BYTES) {
    throw new Error("Après compression, le fichier dépasse encore 5 Mo. Choisissez une image plus petite.")
  }
  return { blob: jpeg, contentType: "image/jpeg", filenameExt: ".jpg" }
}
