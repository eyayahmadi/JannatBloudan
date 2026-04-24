import { redirect } from "next/navigation"

// Chemin canonique pour SHISHA — redirige vers l'interface shisha existante.
export default function ShishaOrdersRedirect() {
  redirect("/shisha")
}
