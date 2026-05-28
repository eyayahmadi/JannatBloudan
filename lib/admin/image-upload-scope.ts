/** Dossiers autorisés pour `/api/admin/upload-image` — gardé hors `lib/server` pour import client (types). */

export const ADMIN_IMAGE_SCOPES = ["products", "promotions", "events", "marketing"] as const
export type AdminImageScope = (typeof ADMIN_IMAGE_SCOPES)[number]
