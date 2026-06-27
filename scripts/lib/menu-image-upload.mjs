/**
 * Shared menu product image upload — WebP, cache headers, duplicate skip.
 */
export const MENU_IMAGE_BUCKET = "menu-product-images"
/** 1 year — immutable slug-based paths */
export const MENU_IMAGE_CACHE_CONTROL = "31536000"
export const MENU_IMAGE_WEBP_QUALITY = 88
export const MENU_IMAGE_SIZE = 1200

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ slug: string; folder: string; buffer: Buffer; skipIfCurrent?: boolean }} opts
 */
export async function uploadMenuProductImage(supabase, { slug, folder, buffer, skipIfCurrent = true }) {
  const objectPath = `products/${folder}/${slug}.webp`
  const { data: pub } = supabase.storage.from(MENU_IMAGE_BUCKET).getPublicUrl(objectPath)
  const publicUrl = pub.publicUrl

  if (skipIfCurrent) {
    const { data: row, error: selErr } = await supabase
      .from("products")
      .select("image_url")
      .eq("slug", slug)
      .maybeSingle()
    if (selErr) throw new Error(`DB read ${slug}: ${selErr.message}`)
    if (row?.image_url === publicUrl) {
      try {
        const head = await fetch(publicUrl, { method: "HEAD", redirect: "follow" })
        if (head.ok) return { url: publicUrl, skipped: true, bytes: buffer.length }
      } catch {
        /* re-upload below */
      }
    }
  }

  const { error: upErr } = await supabase.storage.from(MENU_IMAGE_BUCKET).upload(objectPath, buffer, {
    contentType: "image/webp",
    cacheControl: MENU_IMAGE_CACHE_CONTROL,
    upsert: true,
  })
  if (upErr) throw new Error(`Upload ${slug}: ${upErr.message}`)

  const { error: dbErr } = await supabase.from("products").update({ image_url: publicUrl }).eq("slug", slug)
  if (dbErr) throw new Error(`DB ${slug}: ${dbErr.message}`)

  return { url: publicUrl, skipped: false, bytes: buffer.length }
}
