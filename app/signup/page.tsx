"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Phone, Eye, EyeOff, AlertCircle, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth, AuthEmailConfirmationRequired } from "@/lib/context/AuthContext"
import { PageShell } from "@/components/site/PageShell"
import { SITE } from "@/lib/site-config"
import { dashboardPathForRole, normalizeRole } from "@/lib/auth/roles"
import { getSupabaseBrowserSetupMessage, hasBrowserSupabaseEnv } from "@/lib/supabase/config"
import {
  AuthFloatingField,
  AUTH_CARD_CLS,
  GOLD_SUBMIT_CLASSES,
} from "@/components/auth/auth-form-primitives"
import { cn } from "@/lib/utils"

export default function SignupPage() {
  const router = useRouter()
  const formId = useId()
  const { register } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [envReady] = useState(() => hasBrowserSupabaseEnv())
  const [showPassword, setShowPassword] = useState(false)

  const id = (s: string) => `${formId.replace(/:/g, "")}-${s}`

  const passwordStrength = (() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return score
  })()

  const strengthLabel = ["Trop court", "Faible", "Moyen", "Bon", "Excellent"][passwordStrength] || ""
  const strengthColor = ["bg-red-300", "bg-orange-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"][
    passwordStrength
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        phone,
        role: "CLIENT",
      })
      let loggedRole: string | undefined
      try {
        const { createClient } = await import("@/lib/supabase/client")
        if (hasBrowserSupabaseEnv()) {
          const supabase = createClient()
          const { data } = await supabase.auth.getSession()
          loggedRole = (data.session?.user?.user_metadata as { role?: string })?.role
        }
      } catch {
        /* ignore */
      }
      const redirect = dashboardPathForRole(normalizeRole(loggedRole))
      router.replace(redirect)
    } catch (err: unknown) {
      if (err instanceof AuthEmailConfirmationRequired) {
        setEmailSent(true)
        return
      }
      setError(err instanceof Error ? err.message : "Erreur inattendue")
    } finally {
      setLoading(false)
    }
  }

  const envBlock = !envReady ? (
    <p className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-center text-xs text-amber-900/80">
      {getSupabaseBrowserSetupMessage()}
    </p>
  ) : null

  const eyeBtn = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      tabIndex={-1}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-amber-800/45 transition hover:bg-amber-100/50 hover:text-amber-950"
    >
      {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
    </button>
  )

  return (
    <PageShell>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px]">
          <Card className={AUTH_CARD_CLS}>
            <div className="mb-10 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-800/60">Nouveau compte</p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-amber-950">{SITE.name}</h1>
              <p className="mt-2.5 text-sm leading-relaxed text-amber-900/68">Creez votre compte client</p>
            </div>

            {envBlock}

            {emailSent ? (
              <div
                role="status"
                className="rounded-2xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-5 text-center text-sm leading-relaxed text-emerald-950"
              >
                <p className="font-semibold">Un e-mail de confirmation vous a ete envoye.</p>
                <p className="mt-2">Ouvrez le message et suivez le lien pour activer votre compte.</p>
                <p className="mt-3 text-left text-xs leading-relaxed text-emerald-900/80">
                  Le delai peut etre de quelques minutes. Pensez aux courriers indesirables et a l&apos;onglet
                  Promotions (Gmail). Si vous ne recevez rien, allez sur la page{" "}
                  <Link href="/login" className="font-semibold text-emerald-950 underline underline-offset-2">
                    Connexion
                  </Link>{" "}
                  et utilisez « Renvoyer l&apos;e-mail de confirmation ». Pour une aide personnalisee, ecrivez-nous a{" "}
                  <a
                    href={`mailto:${SITE.contact.email}`}
                    className="font-semibold text-emerald-950 underline underline-offset-2 break-all"
                  >
                    {SITE.contact.email}
                  </a>
                  .
                </p>
                {process.env.NODE_ENV === "development" ? (
                  <p className="mt-2 text-left text-[10px] leading-relaxed text-emerald-900/55">
                    Mode developpement : si aucun mail ne part, verifiez SMTP et les Redirect URLs dans Supabase
                    (Authentication), ainsi que les logs d&apos;envoi.
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-emerald-900/80">{email}</p>
                <Button type="button" variant="outline" size="sm" className="mt-5 rounded-full" asChild>
                  <Link href="/login">Aller a la connexion</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={cn("space-y-6", envReady ? "" : "mt-6")}>
                <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
                  <AuthFloatingField
                    id={id("fn")}
                    label="Prenom"
                    value={firstName}
                    onChange={setFirstName}
                    required
                    autoComplete="given-name"
                    disabled={!envReady}
                  />
                  <AuthFloatingField
                    id={id("ln")}
                    label="Nom"
                    value={lastName}
                    onChange={setLastName}
                    required
                    autoComplete="family-name"
                    disabled={!envReady}
                  />
                </div>

                <AuthFloatingField
                  id={id("email")}
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  required
                  autoComplete="email"
                  Icon={Mail}
                  disabled={!envReady}
                />

                <AuthFloatingField
                  id={id("phone")}
                  label="Telephone"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  autoComplete="tel"
                  Icon={Phone}
                  disabled={!envReady}
                />

                <AuthFloatingField
                  id={id("password")}
                  label="Mot de passe"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  Icon={Lock}
                  disabled={!envReady}
                  endAdornment={eyeBtn}
                />

                {password ? (
                  <div className="px-0.5">
                    <div className="flex gap-1.5" aria-hidden>
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-0.5 flex-1 rounded-full transition-all duration-300",
                            i < passwordStrength ? strengthColor : "bg-amber-100/90",
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-900/45">
                      Robustesse — {strengthLabel}
                    </p>
                  </div>
                ) : null}

                <p className="flex items-start gap-2.5 px-0.5 text-center text-[11px] leading-relaxed text-amber-900/48 sm:text-left">
                  <ShieldCheck className="mx-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700/45 sm:mx-0" aria-hidden />
                  <span className="flex-1">
                    Vos donnees sont protegees et ne seront jamais partagees sans votre accord.
                  </span>
                </p>

                {error ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-2xl border border-red-200/80 bg-red-50/85 px-4 py-3 text-sm text-red-900"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <p>{error}</p>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  variant="gold"
                  size="xl"
                  disabled={loading || !envReady}
                  className={GOLD_SUBMIT_CLASSES}
                >
                  {loading ? (
                    <span className="relative z-[1] flex items-center justify-center gap-2.5">
                      <span
                        aria-hidden
                        className="h-4 w-4 animate-spin rounded-full border-2 border-amber-950/30 border-r-amber-950"
                      />
                      Patientez…
                    </span>
                  ) : (
                    <span className="relative z-[1] flex items-center justify-center gap-2">
                      <Sparkles className="h-[1.05rem] w-[1.05rem] opacity-90" strokeWidth={1.85} aria-hidden />
                      Creer un compte
                    </span>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-8 space-y-3 text-center text-[13px]">
              <p className="text-amber-900/70">
                Deja un compte ?{" "}
                <Link href="/login" className="font-semibold text-amber-900 underline-offset-4 hover:underline">
                  Se connecter
                </Link>
              </p>
              <p className="text-[11px] text-amber-900/42">
                <Link href="/" className="transition hover:text-amber-950">
                  ← Retour a l&apos;accueil
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
