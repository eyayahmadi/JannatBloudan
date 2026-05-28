"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { hasBrowserSupabaseEnv } from "@/lib/supabase/config"
import { toast } from "sonner"

/**
 * Apres clic sur le lien de confirmation Supabase, la redirection contient souvent
 * ?code=... (PKCE) ou #access_token=... (implicit). Sans appel explicite a
 * exchangeCodeForSession / getSession, rien ne s'applique et la connexion reste bloquee.
 */
export function SupabaseAuthUrlListener() {
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current || typeof window === "undefined" || !hasBrowserSupabaseEnv()) return

    const url = new URL(window.location.href)
    if (url.pathname === "/auth/confirm") return

    const code = url.searchParams.get("code")
    const hash = window.location.hash ?? ""

    const hashLooksLikeAuth =
      hash.includes("access_token") ||
      hash.includes("type=signup") ||
      hash.includes("type=email") ||
      hash.includes("type=magiclink")

    if (!code && !hashLooksLikeAuth) return

    ran.current = true

    void (async () => {
      try {
        const supabase = createClient()

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          const { error } = await supabase.auth.getSession()
          if (error) throw error
        }

        url.searchParams.delete("code")
        const qs = url.searchParams.toString()
        const base = `${url.pathname}${qs ? `?${qs}` : ""}`
        window.history.replaceState(null, "", base)

        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          toast.success("Compte confirme. Bienvenue !")
          router.replace("/account")
          return
        }

        toast.success("E-mail confirme. Vous pouvez maintenant vous connecter.")
        router.replace("/login?email_verified=1")
      } catch (e) {
        console.error("[SupabaseAuthUrlListener]", e)
        toast.error("Lien invalide ou expire. Renvoyez l'e-mail de confirmation depuis la connexion.")
        router.replace("/login?error=auth_link")
      }
    })()
  }, [router])

  return null
}
