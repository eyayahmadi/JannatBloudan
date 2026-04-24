import { redirect } from "next/navigation"

// Chemin canonique pour KITCHEN — redirige vers le KDS cuisine existant.
export default function KitchenOrdersRedirect() {
  redirect("/kitchen")
}
