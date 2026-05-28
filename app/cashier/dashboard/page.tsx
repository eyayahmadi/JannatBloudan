import { redirect } from "next/navigation"

// Chemin canonique pour CASHIER — redirige vers la synthèse caisse,
// alignée avec dashboardPathForRole("CASHIER") et la nav workspace.
export default function CashierDashboardRedirect() {
  redirect("/caisse")
}
