import { redirect } from "next/navigation"

// Chemin canonique pour ADMIN — redirige vers l'interface admin existante.
export default function AdminDashboardRedirect() {
  redirect("/admin")
}
