import type { Locale } from "../../config"
import { caisseMessages as frCaisse } from "./fr"
import { caisseMessages as enCaisse } from "./en"
import { caisseMessages as deCaisse } from "./de"
import { caisseMessages as arCaisse } from "./ar"
import type { CaisseMessages } from "./fr"

export const caisseMessagesByLocale: Record<Locale, CaisseMessages> = {
  fr: frCaisse,
  en: enCaisse,
  de: deCaisse,
  ar: arCaisse,
}

export type { CaisseMessages } from "./fr"
