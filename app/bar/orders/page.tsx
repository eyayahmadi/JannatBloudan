import { redirect } from "next/navigation"

// Chemin canonique pour BAR — redirige vers l'interface bar existante.
export default function BarOrdersRedirect() {
  redirect("/bar")
}
