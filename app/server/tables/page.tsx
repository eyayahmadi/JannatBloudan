import { redirect } from "next/navigation"

// Chemin canonique pour SERVER — redirige vers l'interface serveur existante.
export default function ServerTablesRedirect() {
  redirect("/server")
}
