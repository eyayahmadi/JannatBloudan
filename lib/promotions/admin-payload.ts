/** Parse corps JSON admin → champs `promotional_offers` (partiel pour PATCH). */
export function parsePromotionalOfferBody(body: Record<string, unknown>): {
  ok: true; patch: Record<string, unknown> } | { ok: false; error: string }
{
  const patch: Record<string, unknown> = {}

  if ("name" in body) {
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : ""
    if (!name) return { ok: false, error: "name invalide" }
    patch.name = name
  }
  if ("offer_type" in body) {
    const offer_type = typeof body.offer_type === "string" ? body.offer_type.trim().slice(0, 40) : ""
    if (!offer_type) return { ok: false, error: "offer_type invalide" }
    patch.offer_type = offer_type
  }
  if ("value_num" in body) {
    patch.value_num = body.value_num != null ? Number(body.value_num) : null
  }
  if ("promo_code" in body) {
    const promo_code =
      typeof body.promo_code === "string" && body.promo_code.trim()
        ? body.promo_code.trim().slice(0, 64)
        : null
    patch.promo_code = promo_code
  }
  if ("min_order_amount" in body) {
    patch.min_order_amount = body.min_order_amount != null ? Number(body.min_order_amount) : null
  }
  if ("min_order_amount" in body) {
    patch.min_order_amount = body.min_order_amount != null ? Number(body.min_order_amount) : null
  }
  if ("starts_at" in body) {
    patch.starts_at = typeof body.starts_at === "string" ? body.starts_at : null
  }
  if ("ends_at" in body) {
    patch.ends_at = typeof body.ends_at === "string" ? body.ends_at : null
  }
  if ("active" in body) {
    patch.active = body.active !== false
  }
  if ("product_ids" in body && Array.isArray(body.product_ids)) {
    patch.product_ids = body.product_ids.filter((x: unknown) => typeof x === "string")
  }
  if ("category_keys" in body && Array.isArray(body.category_keys)) {
    patch.category_keys = body.category_keys.filter((x: unknown) => typeof x === "string").map(String)
  }
  if ("meta" in body && typeof body.meta === "object" && body.meta) {
    patch.meta = body.meta as Record<string, unknown>
  }
  if ("description" in body) {
    patch.description =
      typeof body.description === "string" ? body.description.trim().slice(0, 8000) : null
  }
  if ("short_label" in body) {
    patch.short_label =
      typeof body.short_label === "string" && body.short_label.trim()
        ? body.short_label.trim().slice(0, 160)
        : null
  }
  if ("auto_apply" in body) {
    patch.auto_apply = body.auto_apply === true
  }
  if ("stackable" in body) {
    patch.stackable = body.stackable === true
  }
  if ("visibility" in body) {
    patch.visibility =
      typeof body.visibility === "string" && body.visibility.trim()
        ? body.visibility.trim().slice(0, 32)
        : "all"
  }
  if ("image_url" in body) {
    patch.image_url =
      typeof body.image_url === "string" && body.image_url.trim()
        ? body.image_url.trim().slice(0, 2048)
        : null
  }
  if ("conditions_text" in body) {
    patch.conditions_text =
      typeof body.conditions_text === "string" && body.conditions_text.trim()
        ? body.conditions_text.trim().slice(0, 4000)
        : null
  }
  if ("max_redemptions_per_user" in body) {
    const v = body.max_redemptions_per_user != null ? Number(body.max_redemptions_per_user) : null
    if (v != null && Number.isFinite(v) && v >= 0) {
      patch.max_redemptions_per_user = Math.floor(v)
    } else {
      patch.max_redemptions_per_user = null
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Aucun champ à mettre à jour" }
  }
  return { ok: true, patch }
}
