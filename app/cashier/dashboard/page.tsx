import { redirect } from "next/navigation"

// Chemin canonique pour CASHIER — redirige vers le POS (point de vente).
export default function CashierDashboardRedirect() {
  redirect("/pos")
}
