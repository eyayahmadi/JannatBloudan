import type { Locale } from "../../config"
import { adminMessages as frAdmin } from "./fr"
import { adminMessages as enAdmin } from "./en"
import { adminMessages as deAdmin } from "./de"
import { adminMessages as arAdmin } from "./ar"
import type { AdminMessages } from "./fr"

export const adminMessagesByLocale: Record<Locale, AdminMessages> = {
  fr: frAdmin,
  en: enAdmin,
  de: deAdmin,
  ar: arAdmin,
}

export type { AdminMessages } from "./fr"
