"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageShell } from "@/components/site/PageShell"
import { SITE } from "@/lib/site-config"
import { createClient } from "@/lib/supabase/client"
import { getSupabaseBrowserSetupMessage, hasBrowserSupabaseEnv } from "@/lib/supabase/config"
import { AUTH_CARD_CLS } from "@/components/auth/auth-form-primitives"
import { cn } from "@/lib/utils"

type ConfirmState = "loading" | "pending_confirmation" | "confirming" | "confirmed" | "expired" | "error"

type PendingPayload =
  | { kind: "token_hash"; tokenHash: string; otpType: "signup" | "email" }
  | { kind: "code"; code: string }
  | { kind: "implicit_hash" }

function parseOtpType(raw: string | null): "signup" | "email" {
  const t = (raw ?? "signup").toLowerCase()
  if (t === "email" || t === "signup") return t === "email" ? "email" : "signup"
  return "signup"
}

/** Fragment #access_token=... ou #token_hash=... */
function hashToSearchParams(hash: string): URLSearchParams {
  const raw = (hash ?? "").replace(/^#/, "")
  if (!raw || !raw.includes("=")) return new URLSearchParams()
  try {
    return new URLSearchParams(raw)
  } catch {
    return new URLSearchParams()
  }
}

function hashLooksImplicit(hash: string): boolean {
  if (!hash) return false
  return (
    hash.includes("access_token") ||
    hash.includes("refresh_token") ||
    /type=(signup|email|magiclink|recovery)/i.test(hash)
  )
}

function mapErrorToState(err: { message?: string } | null): "expired" | "error" {
  const m = (err?.message ?? "").toLowerCase()
  if (
    m.includes("expired") ||
    m.includes("invalid") ||
    m.includes("already been used") ||
    m.includes("otp") ||
    m.includes("token")
  ) {
    return "expired"
  }
  return "error"
}

async function sessionAlreadyConfirmed(): Promise<boolean> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return Boolean(session?.user?.email_confirmed_at)
}

function ConfirmEmailContent() {
  const router = useRouter()
  const [state, setState] = useState<ConfirmState>("loading")
  const payloadRef = useRef<PendingPayload | null>(null)
  const envReady = hasBrowserSupabaseEnv()
  const ranBoot = useRef(false)

  const finalizeSuccess = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      /* ignore */
    }
    setState("confirmed")
    window.setTimeout(() => {
      router.replace("/login?account_confirmed=1")
    }, 900)
  }, [router])

  const runConfirm = useCallback(
    async (p: PendingPayload, cancelled?: () => boolean) => {
      const isCancelled = cancelled ?? (() => false)
      if (!envReady) return
      if (!isCancelled()) setState("confirming")
      const supabase = createClient()

      const tryFinalizeIfConfirmed = async (): Promise<boolean> => {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user?.email_confirmed_at) {
          const u = new URL(window.location.href)
          window.history.replaceState(null, "", `${u.pathname}${u.search}`)
          if (!isCancelled()) await finalizeSuccess()
          return true
        }
        return false
      }

      try {
        if (p.kind === "token_hash") {
          let lastErr: { message?: string } | null = null
          const tryTypes: Array<"signup" | "email"> = [p.otpType, p.otpType === "signup" ? "email" : "signup"]
          const uniqueTypes = [...new Set(tryTypes)]
          for (const t of uniqueTypes) {
            if (isCancelled()) return
            const { error } = await supabase.auth.verifyOtp({
              type: t,
              token_hash: p.tokenHash,
            })
            if (!error) {
              if (!isCancelled()) await finalizeSuccess()
              return
            }
            lastErr = error
          }
          if (await tryFinalizeIfConfirmed()) return
          if (!isCancelled()) setState(mapErrorToState(lastErr))
          return
        }

        if (p.kind === "code") {
          if (isCancelled()) return
          const { error } = await supabase.auth.exchangeCodeForSession(p.code)
          if (!error) {
            if (!isCancelled()) await finalizeSuccess()
            return
          }
          if (await tryFinalizeIfConfirmed()) return
          if (!isCancelled()) setState(mapErrorToState(error))
          return
        }

        if (p.kind === "implicit_hash") {
          await new Promise((r) => window.setTimeout(r, 50))
          if (isCancelled()) return
          const { error } = await supabase.auth.getSession()
          if (error) {
            if (await tryFinalizeIfConfirmed()) return
            if (!isCancelled()) setState(mapErrorToState(error))
            return
          }
          if (await tryFinalizeIfConfirmed()) return
          if (!isCancelled()) setState("error")
          return
        }
      } catch (e) {
        console.error(e)
        if (await tryFinalizeIfConfirmed()) return
        if (!isCancelled()) setState("error")
      }
    },
    [envReady, finalizeSuccess],
  )

  useEffect(() => {
    if (!envReady) {
      setState("error")
      return
    }
    if (ranBoot.current) return
    ranBoot.current = true

    let cancelled = false
    const isCancelled = () => cancelled

    void (async () => {
      const url = new URL(window.location.href)
      const hash = window.location.hash ?? ""
      const hashParams = hashToSearchParams(hash)

      const tokenHash =
        url.searchParams.get("token_hash") ||
        url.searchParams.get("token") ||
        hashParams.get("token_hash") ||
        hashParams.get("token")

      const typeRaw = url.searchParams.get("type") || hashParams.get("type")
      const code = url.searchParams.get("code") || hashParams.get("code")

      const errParam = url.searchParams.get("error") || hashParams.get("error")
      const errDesc = url.searchParams.get("error_description") || hashParams.get("error_description")

      if (errParam === "access_denied" || (errDesc ?? "").toLowerCase().includes("expired")) {
        if (!isCancelled()) setState("expired")
        return
      }

      if (tokenHash) {
        const payload: PendingPayload = { kind: "token_hash", tokenHash, otpType: parseOtpType(typeRaw) }
        payloadRef.current = payload
        await runConfirm(payload, isCancelled)
        return
      }

      if (code) {
        const payload: PendingPayload = { kind: "code", code }
        payloadRef.current = payload
        await runConfirm(payload, isCancelled)
        return
      }

      if (hashLooksImplicit(hash)) {
        const payload: PendingPayload = { kind: "implicit_hash" }
        payloadRef.current = payload
        await runConfirm(payload, isCancelled)
        return
      }

      await new Promise((r) => window.setTimeout(r, 80))
      if (isCancelled()) return

      if (await sessionAlreadyConfirmed()) {
        if (!isCancelled()) await finalizeSuccess()
        return
      }

      if (!isCancelled()) setState("error")
    })()

    return () => {
      cancelled = true
      ranBoot.current = false
    }
  }, [envReady, runConfirm, finalizeSuccess])

  const handleConfirm = async () => {
    if (!envReady || !payloadRef.current) return
    await runConfirm(payloadRef.current)
  }

  const handleCancel = () => {
    router.replace("/login")
  }

  const envBlock = !envReady ? (
    <p className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-center text-xs text-amber-900/80">
      {getSupabaseBrowserSetupMessage()}
    </p>
  ) : null

  return (
    <Card className={AUTH_CARD_CLS}>
      <div className="mb-8 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-800/60">Confirmation</p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-amber-950 sm:text-3xl">{SITE.name}</h1>
      </div>

      {envBlock}

      {state === "loading" && envReady ? (
        <div className="flex flex-col items-center gap-3 py-10 text-amber-900/70">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700" aria-hidden />
          <p className="text-sm">Chargement…</p>
        </div>
      ) : null}

      {state === "pending_confirmation" ? (
        <div className="space-y-6 text-center">
          <p className="text-base font-medium leading-relaxed text-amber-950">
            Voulez-vous confirmer votre compte ?
          </p>
          <p className="text-sm text-amber-900/65">
            En confirmant, votre adresse e-mail sera validee et votre espace client pourra etre active.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="gold"
              size="lg"
              className="min-h-12 rounded-full px-8 font-semibold"
              onClick={() => void handleConfirm()}
            >
              Oui, confirmer
            </Button>
            <Button type="button" variant="outline" size="lg" className="min-h-12 rounded-full" onClick={handleCancel}>
              Annuler
            </Button>
          </div>
        </div>
      ) : null}

      {state === "confirming" ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700" aria-hidden />
          <p className="text-sm text-amber-900/75">Verification en cours…</p>
        </div>
      ) : null}

      {state === "confirmed" ? (
        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-8 text-center"
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
          <p className="text-base font-semibold text-emerald-950">Votre compte a ete confirme avec succes.</p>
          <p className="text-sm text-emerald-900/80">Redirection vers la connexion…</p>
        </div>
      ) : null}

      {state === "expired" ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50/85 px-4 py-4 text-sm text-red-900"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p className="leading-relaxed">
              Lien expire, veuillez demander un nouvel e-mail de confirmation depuis la page de connexion.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-full" asChild>
            <Link href="/login">Aller a la connexion</Link>
          </Button>
        </div>
      ) : null}

      {state === "error" ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50/85 px-4 py-4 text-sm text-red-900"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="space-y-2 leading-relaxed">
              <p>
                Impossible de lire le lien de confirmation (parametres manquants ou session deja consommee). Si vous
                venez de cliquer dans l&apos;e-mail, votre compte est peut-etre deja actif : essayez de vous connecter.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-full" asChild>
            <Link href="/login?account_confirmed=1">Connexion</Link>
          </Button>
        </div>
      ) : null}

      <p className={cn("mt-8 text-center text-[11px] text-amber-900/42", state === "loading" ? "hidden" : "")}>
        <Link href="/" className="transition hover:text-amber-950">
          ← Retour a l&apos;accueil
        </Link>
      </p>
    </Card>
  )
}

export default function AuthConfirmPage() {
  return (
    <PageShell>
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <ConfirmEmailContent />
        </div>
      </div>
    </PageShell>
  )
}
