import { redirect } from "next/navigation"

/**
 * L'ancienne page d'achats (mock) est remplacée par les factures fournisseurs.
 */
export default function AdminPurchasesRedirect() {
  redirect("/admin/supplier-invoices")
}
