import type { Locale } from "../../config"
import { workspaceMessages as frWorkspace } from "./fr"
import { workspaceMessages as enWorkspace } from "./en"
import { workspaceMessages as deWorkspace } from "./de"
import { workspaceMessages as arWorkspace } from "./ar"
import type { WorkspaceMessages } from "./fr"

export const workspaceMessagesByLocale: Record<Locale, WorkspaceMessages> = {
  fr: frWorkspace,
  en: enWorkspace,
  de: deWorkspace,
  ar: arWorkspace,
}

export type { WorkspaceMessages } from "./fr"
