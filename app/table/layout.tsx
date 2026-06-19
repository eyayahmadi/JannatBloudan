import type { ReactNode } from "react"
import { FloatingLanguagePill } from "@/components/i18n/FloatingLanguagePill"

/**
 * Layout du parcours QR table.
 *
 * Les pages /table/* sont consommées par les clients qui scannent un QR au
 * restaurant et n'embarquent volontairement pas le site-header (UX épurée).
 * Ce layout ajoute la pastille de changement de langue flottante en haut à
 * droite afin qu'un visiteur FR/EN/DE/AR puisse choisir/corriger sa langue
 * sans quitter la page.
 */
export default function TableLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FloatingLanguagePill />
      {children}
    </>
  )
}
