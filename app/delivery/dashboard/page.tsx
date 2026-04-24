import { redirect } from "next/navigation"

// Chemin canonique pour DELIVERY (livreur) — redirige vers /driver.
// Le chemin /delivery (sans segment) reste destine aux CLIENTS (menu livraison).
export default function DeliveryDashboardRedirect() {
  redirect("/driver")
}
