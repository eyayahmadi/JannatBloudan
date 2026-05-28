"use client"

import { Suspense, useEffect, useId, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth, AuthEmailConfirmationRequired } from "@/lib/context/AuthContext"
import { PageShell } from "@/components/site/PageShell"
import { SITE } from "@/lib/site-config"
import { dashboardPathForRole, normalizeRole } from "@/lib/auth/roles"
import { getSupabaseBrowserSetupMessage, hasBrowserSupabaseEnv } from "@/lib/supabase/config"
import { useI18n } from "@/lib/i18n/context"
import {
  AuthFloatingField,
  AUTH_CARD_CLS,
  GOLD_SUBMIT_CLASSES,
} from "@/components/auth/auth-form-primitives"
import { cn } from "@/lib/utils"

function LoginForm() {
  const { t } = useI18n()
  const formId = useId()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get("next")
  const emailJustVerified = searchParams.get("email_verified") === "1"
  const accountJustConfirmed = searchParams.get("account_confirmed") === "1"
  const recoveryFlow = searchParams.get("recovery") === "1"
  const resetRequestFlow = searchParams.get("reset") === "true" && !recoveryFlow
  const mode = searchParams.get("mode")
  const { login, register, resendSignupConfirmation } = useAuth()
  const [isLogin, setIsLogin] = useState(mode !== "signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [envReady] = useState(() => hasBrowserSupabaseEnv())
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [recoveryHasSession, setRecoveryHasSession] = useState(false)
  const [pendingEmailConfirmFor, setPendingEmailConfirmFor] = useState<string | null>(null)
  const [resendConfirmState, setResendConfirmState] = useState<"idle" | "sending" | "ok" | "err">("idle")
  const [resendConfirmMessage, setResendConfirmMessage] = useState<string | null>(null)

  const id = (suffix: string) => `${formId.replace(/:/g, "")}-${suffix}`

  const buildLoginPath = (extra: Record<string, string>) => {
    const q = new URLSearchParams()
    if (nextParam) q.set("next", nextParam)
    for (const [k, v] of Object.entries(extra)) q.set(k, v)
    const s = q.toString()
    return s ? `/login?${s}` : "/login"
  }

  useEffect(() => {
    if (!recoveryFlow || !envReady) return
    let alive = true
    let unsub: { unsubscribe: () => void } | undefined
    ;(async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const sync = async () => {
          if (!alive) return
          const { data } = await supabase.auth.getSession()
          if (alive) setRecoveryHasSession(!!data.session)
        }
        await sync()
        const { data: sub } = supabase.auth.onAuthStateChange(() => void sync())
        unsub = sub.subscription
        window.setTimeout(sync, 800)
      } catch {
        if (alive) setRecoveryHasSession(false)
      }
    })()
    return () => {
      alive = false
      unsub?.unsubscribe()
    }
  }, [recoveryFlow, envReady])

  useEffect(() => {
    if (searchParams.get("mode") === "signup" && !recoveryFlow && !resetRequestFlow) {
      router.replace("/signup")
    }
  }, [searchParams, recoveryFlow, resetRequestFlow, router])

  useEffect(() => {
    if (searchParams.get("error") !== "auth_link") return
    setError((prev) => prev ?? t("auth.authLinkExpired", "Ce lien est expire ou invalide. Renvoyez l'e-mail de confirmation."))
  }, [searchParams, t])

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
  const strengthColor = [
    "bg-red-300",
    "bg-orange-400",
    "bg-amber-400",
    "bg-emerald-400",
    "bg-emerald-500",
  ][passwordStrength]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPendingEmailConfirmFor(null)
    setResendConfirmState("idle")
    setResendConfirmMessage(null)
    setLoading(true)
    try {
      let loggedRole: string | undefined
      if (isLogin) {
        await login(email, password)
      } else {
        await register({ email, password, firstName, lastName, phone, role: "CLIENT" })
      }
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const { hasBrowserSupabaseEnv } = await import("@/lib/supabase/config")
        if (hasBrowserSupabaseEnv()) {
          const supabase = createClient()
          const { data } = await supabase.auth.getSession()
          loggedRole = (data.session?.user?.user_metadata as { role?: string })?.role
        }
      } catch {
        /* ignore */
      }

      const redirect =
        nextParam && nextParam.startsWith("/")
          ? nextParam
          : dashboardPathForRole(normalizeRole(loggedRole))
      router.replace(redirect)
    } catch (err: unknown) {
      if (err instanceof AuthEmailConfirmationRequired) {
        setPendingEmailConfirmFor(err.email)
        setError(null)
        return
      }
      const message = err instanceof Error ? err.message : t("auth.error")
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGuestMode = () => {
    router.push("/")
  }

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError(t("auth.error"))
      return
    }
    setLoading(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const { getSupabaseBrowserSetupMessage, hasBrowserSupabaseEnv } = await import("@/lib/supabase/config")
      if (!hasBrowserSupabaseEnv()) throw new Error(getSupabaseBrowserSetupMessage())
      const supabase = createClient()
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/login?recovery=1`,
      })
      if (err) throw err
      setResetEmailSent(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("auth.error")
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordsMismatch"))
      return
    }
    if (newPassword.length < 8) {
      setError(t("auth.error"))
      return
    }
    setLoading(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password: newPassword })
      if (err) throw err
      await supabase.auth.signOut()
      router.replace("/login")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("auth.error")
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const envBlock = !envReady ? (
    <p className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-center text-xs text-amber-900/80">
      {getSupabaseBrowserSetupMessage()}
    </p>
  ) : null

  const eyeBtn = (open: boolean, set: (v: boolean | ((b: boolean) => boolean)) => void, labelShow: string, labelHide: string) => (
    <button
      type="button"
      onClick={() => set((v) => !v)}
      aria-label={open ? labelHide : labelShow}
      tabIndex={-1}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-amber-800/45 transition hover:bg-amber-100/50 hover:text-amber-950"
    >
      {open ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
    </button>
  )

  if (recoveryFlow) {
    return (
      <Card className={AUTH_CARD_CLS}>
        <div className="mb-10 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-800/60">{t("auth.area")}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-amber-950">{SITE.name}</h1>
          <p className="mt-3 font-medium text-amber-950">{t("auth.recoveryTitle")}</p>
          <p className="mt-2.5 text-sm leading-relaxed text-amber-900/68">{t("auth.recoveryLead")}</p>
        </div>
        {envBlock}
        {envReady && !recoveryHasSession ? (
          <div
            role="status"
            className="mb-5 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-center text-xs text-amber-900/85"
          >
            {t("auth.recoveryInvalid")}
          </div>
        ) : null}
        <form onSubmit={handleRecoverySubmit} className={cn("space-y-6", envReady ? "" : "mt-6")}>
          <AuthFloatingField
            id={id("npw")}
            label={t("auth.newPasswordLabel")}
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={setNewPassword}
            required
            minLength={8}
            autoComplete="new-password"
            Icon={Lock}
            disabled={!envReady}
            endAdornment={eyeBtn(showNewPassword, setShowNewPassword, t("auth.showPassword"), t("auth.hidePassword"))}
          />
          <AuthFloatingField
            id={id("cpw")}
            label={t("auth.confirmPasswordLabel")}
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            minLength={8}
            autoComplete="new-password"
            Icon={Lock}
            disabled={!envReady}
            endAdornment={eyeBtn(
              showConfirmPassword,
              setShowConfirmPassword,
              t("auth.showPassword"),
              t("auth.hidePassword"),
            )}
          />
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
            disabled={loading || !envReady || !recoveryHasSession}
            className={GOLD_SUBMIT_CLASSES}
          >
            {loading ? (
              <span className="relative z-[1] flex items-center justify-center gap-2.5">
                <span
                  aria-hidden
                  className="h-4 w-4 animate-spin rounded-full border-2 border-amber-950/30 border-r-amber-950"
                />
                {t("auth.loading")}
              </span>
            ) : (
              <span className="relative z-[1]">{t("auth.submitNewPassword")}</span>
            )}
          </Button>
        </form>
        <div className="mt-8 text-center">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-[13px] font-medium text-amber-800/90 hover:text-amber-950"
            onClick={() => router.push(buildLoginPath({}))}
          >
            {t("auth.resetBack")}
          </Button>
        </div>
      </Card>
    )
  }

  if (resetRequestFlow) {
    return (
      <Card className={AUTH_CARD_CLS}>
        <div className="mb-10 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-800/60">{t("auth.area")}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-amber-950">{SITE.name}</h1>
          <p className="mt-3 font-medium text-amber-950">{t("auth.resetTitle")}</p>
          <p className="mt-2.5 text-sm leading-relaxed text-amber-900/68">{t("auth.resetLead")}</p>
        </div>
        {envBlock}
        {resetEmailSent ? (
          <div
            role="status"
            className="rounded-2xl border border-emerald-200/90 bg-emerald-50/80 px-4 py-4 text-center text-sm leading-relaxed text-emerald-950"
          >
            {t("auth.resetSent")}
          </div>
        ) : (
          <form onSubmit={handleSendResetEmail} className={cn("space-y-6", envReady ? "" : "mt-6")}>
            <AuthFloatingField
              id={id("resemail")}
              label={t("auth.email")}
              type="email"
              value={email}
              onChange={setEmail}
              required
              autoComplete="email"
              Icon={Mail}
              disabled={!envReady}
            />
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-red-200/80 bg-red-50/85 px-4 py-3 text-sm text-red-900"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>{error}</p>
              </div>
            ) : null}
            <Button type="submit" variant="gold" size="xl" disabled={loading || !envReady} className={GOLD_SUBMIT_CLASSES}>
              {loading ? (
                <span className="relative z-[1] flex items-center justify-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-4 w-4 animate-spin rounded-full border-2 border-amber-950/30 border-r-amber-950"
                  />
                  {t("auth.loading")}
                </span>
              ) : (
                <span className="relative z-[1]">{t("auth.resetSend")}</span>
              )}
            </Button>
          </form>
        )}
        <div className="mt-8 text-center space-y-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-[13px] font-medium text-amber-800/90 hover:text-amber-950"
            onClick={() => router.push(buildLoginPath({}))}
          >
            {t("auth.resetBack")}
          </Button>
          <p className="text-[11px] text-amber-900/42">
            <Link href="/" className="transition hover:text-amber-950">
              ← {t("auth.backHome")}
            </Link>
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={AUTH_CARD_CLS}>
      <div className="mb-10 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-800/60">{t("auth.area")}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-amber-950">{SITE.name}</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-amber-900/68">{isLogin ? t("auth.blurbIn") : t("auth.blurbUp")}</p>
      </div>

      {envBlock}

      {isLogin && emailJustVerified ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-3 text-center text-sm leading-relaxed text-emerald-950"
        >
          {t(
            "auth.emailVerifiedOk",
            "Votre e-mail est confirme. Connectez-vous avec le mot de passe choisi a l'inscription.",
          )}
        </div>
      ) : null}

      {isLogin && accountJustConfirmed ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-3 text-center text-sm leading-relaxed text-emerald-950"
        >
          {t(
            "auth.accountConfirmedOk",
            "Votre compte est confirme. Connectez-vous pour acceder a votre espace.",
          )}
        </div>
      ) : null}

      {!isLogin && pendingEmailConfirmFor ? (
        <div
          role="status"
          className="mt-6 mb-6 rounded-2xl border border-emerald-200/90 bg-emerald-50/85 px-4 py-4 text-center text-sm leading-relaxed text-emerald-950"
        >
          <p className="font-semibold">{t("auth.signupConfirmTitle", "Presque termine")}</p>
          <p className="mt-2">
            {t(
              "auth.signupConfirmBody",
              "Un lien de confirmation vous a ete envoye. Ouvrez votre boite mail et cliquez dessus pour activer le compte, puis utilisez « Se connecter ».",
            )}
          </p>
          <p className="mt-2 text-xs font-medium text-emerald-900/80">{pendingEmailConfirmFor}</p>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="gold"
              size="sm"
              className="rounded-full px-5"
              onClick={() => {
                setPendingEmailConfirmFor(null)
                setIsLogin(true)
              }}
            >
              {t("auth.goToSignIn", "Aller a la connexion")}
            </Button>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-[12px] text-emerald-900/70 hover:text-emerald-950"
              onClick={() => setPendingEmailConfirmFor(null)}
            >
              {t("auth.signupTryAgain", "Modifier et reessayer")}
            </Button>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className={cn("mb-2", envReady ? "mt-0" : "mt-6", "space-y-6")}>
        {!isLogin ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
            <AuthFloatingField
              id={id("fn")}
              label={t("auth.firstName")}
              value={firstName}
              onChange={setFirstName}
              required
              autoComplete="given-name"
              disabled={!envReady}
            />
            <AuthFloatingField
              id={id("ln")}
              label={t("auth.lastName")}
              value={lastName}
              onChange={setLastName}
              required
              autoComplete="family-name"
              disabled={!envReady}
            />
          </div>
        ) : null}

        <AuthFloatingField
          id={id("email")}
          label={t("auth.email")}
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
          Icon={Mail}
          disabled={!envReady}
        />

        {!isLogin ? (
          <AuthFloatingField
            id={id("phone")}
            label={t("auth.phone")}
            type="tel"
            value={phone}
            onChange={setPhone}
            autoComplete="tel"
            Icon={Phone}
            disabled={!envReady}
          />
        ) : null}

        <div className="space-y-2.5">
          {isLogin ? (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-[11px] font-medium text-amber-800/90 underline-offset-4 transition hover:text-[color:var(--lux-bordeaux)] hover:underline"
                onClick={() => {
                  setError(null)
                  router.push(buildLoginPath({ reset: "true" }))
                }}
              >
                {t("auth.forgotPassword")}
              </button>
            </div>
          ) : null}
          <AuthFloatingField
            id={id("password")}
            label={t("auth.password")}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={setPassword}
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={isLogin ? undefined : 8}
            Icon={Lock}
            disabled={!envReady}
            endAdornment={eyeBtn(showPassword, setShowPassword, t("auth.showPassword"), t("auth.hidePassword"))}
          />

          {!isLogin && password ? (
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
              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-900/45" aria-live="polite">
                {t("auth.strength")} — {strengthLabel}
              </p>
            </div>
          ) : null}
        </div>

        {isLogin ? (
          <label className="flex cursor-pointer select-none items-center gap-2.5 px-0.5 text-[13px] text-amber-900/75">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-amber-900/25 text-[color:var(--lux-bordeaux)] focus:ring-[color:var(--lux-gold)]/35"
            />
            {t("auth.rememberMe", "Rester connecté")}
          </label>
        ) : (
          <p className="flex items-start gap-2.5 px-0.5 text-center text-[11px] leading-relaxed text-amber-900/48 sm:text-left">
            <ShieldCheck className="mx-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700/45 sm:mx-0" aria-hidden />
            <span className="flex-1">
              {t(
                "auth.privacyHint",
                "Vos données sont protégées et ne seront jamais partagées sans votre accord.",
              )}
            </span>
          </p>
        )}

        {error ? (
          <div
            role="alert"
            aria-live="assertive"
            className="animate-fade-up space-y-3 rounded-2xl border border-red-200/80 bg-red-50/85 px-4 py-3 text-sm text-red-900"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="leading-relaxed">{error}</p>
            </div>
            {isLogin && email.trim() ? (
              <div className="border-t border-red-200/60 pt-3 pl-6">
                <p className="mb-2 text-xs font-medium text-red-900/85">
                  {t(
                    "auth.resendConfirmHint",
                    "Pas recu l'e-mail ou compte tout juste cree ? Renvoyez le lien de confirmation.",
                  )}
                </p>
                {resendConfirmState === "ok" && resendConfirmMessage ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-emerald-900">{resendConfirmMessage}</p>
                    <p className="text-[11px] leading-relaxed text-emerald-900/80">
                      {t(
                        "auth.resendConfirmOkFoot",
                        "Si aucun message n'arrive : courrier indesirable, dossier « Promotions », et surtout le tableau Supabase (Authentication → Logs) pour voir une erreur SMTP ou de quota. Sans SMTP personnalise, l'envoi integre peut echouer ou etre retarde.",
                      )}
                    </p>
                  </div>
                ) : null}
                {resendConfirmState === "err" && resendConfirmMessage ? (
                  <p className="text-xs text-red-800">{resendConfirmMessage}</p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || resendConfirmState === "sending"}
                  className="mt-1 h-9 rounded-full border-red-300/80 bg-white/90 text-xs font-semibold text-red-950 hover:bg-red-50"
                  onClick={async () => {
                    setResendConfirmMessage(null)
                    setResendConfirmState("sending")
                    try {
                      await resendSignupConfirmation(email)
                      setResendConfirmState("ok")
                      setResendConfirmMessage(
                        t(
                          "auth.resendConfirmOk",
                          "Demande enregistree cote Supabase : l'e-mail part si la configuration (SMTP / quotas) le permet. Verifiez boite, spams, puis les logs Auth.",
                        ),
                      )
                    } catch (e) {
                      setResendConfirmState("err")
                      setResendConfirmMessage(e instanceof Error ? e.message : t("auth.error"))
                    }
                  }}
                >
                  {resendConfirmState === "sending"
                    ? t("auth.loading")
                    : t("auth.resendConfirmCta", "Renvoyer l'e-mail de confirmation")}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" variant="gold" size="xl" disabled={loading || !envReady} className={GOLD_SUBMIT_CLASSES}>
          {loading ? (
            <span className="relative z-[1] flex items-center justify-center gap-2.5">
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-amber-950/30 border-r-amber-950"
              />
              {t("auth.loading")}
            </span>
          ) : isLogin ? (
            <span className="relative z-[1]">{t("auth.submitIn")}</span>
          ) : (
            <span className="relative z-[1] flex items-center justify-center gap-2">
              <Sparkles className="h-[1.05rem] w-[1.05rem] opacity-90" strokeWidth={1.85} aria-hidden />
              {t("auth.submitUp")}
            </span>
          )}
        </Button>
      </form>

      <div className="mt-8 space-y-4 text-center">
        <div className="relative flex items-center">
          <span className="hairline-gold flex-1" aria-hidden />
          <span className="px-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-900/40">{t("auth.or", "ou")}</span>
          <span className="hairline-gold flex-1" aria-hidden />
        </div>

        {isLogin ? (
          <Link
            href="/signup"
            className="inline-block text-[13px] font-medium text-amber-800/90 underline-offset-4 transition hover:text-amber-950 hover:underline"
          >
            {t("auth.switchUp")}
          </Link>
        ) : (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => {
              setIsLogin(true)
              setError(null)
              setPendingEmailConfirmFor(null)
              setResendConfirmState("idle")
              setResendConfirmMessage(null)
            }}
            className="h-auto p-0 text-[13px] font-medium text-amber-800/90 hover:text-amber-950"
          >
            {t("auth.switchIn")}
          </Button>
        )}
        <div>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleGuestMode}
            className="h-auto p-0 text-[13px] !no-underline text-amber-900/50 hover:!no-underline hover:text-amber-900"
          >
            {t("auth.guest")}
          </Button>
        </div>
        <p className="text-[11px] text-amber-900/42">
          <Link href="/" className="transition hover:text-amber-950">
            ← {t("auth.backHome")}
          </Link>
        </p>
      </div>
    </Card>
  )
}

function LoginSideText() {
  const { t } = useI18n()
  return (
    <div className="absolute bottom-0 left-0 p-10 text-white">
      <p className="animate-fade-up font-display text-3xl font-medium leading-tight">{t("auth.sideTitle")}</p>
      <p className="mt-2 max-w-sm text-sm text-amber-100/90">{t("auth.sideLead")}</p>
    </div>
  )
}

function LoginFallback() {
  return (
    <Card className="border-white/40 bg-white/85 p-12 backdrop-blur-xl">
      <div className="animate-pulse space-y-4">
        <div className="mx-auto h-8 w-48 rounded bg-amber-200/50" />
        <div className="h-10 rounded bg-amber-100/60" />
        <div className="h-10 rounded bg-amber-100/60" />
        <div className="h-11 rounded-full bg-amber-200/40" />
      </div>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <PageShell>
      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className="relative hidden min-h-[420px] lg:block">
          <img src={SITE.images.auth} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="absolute inset-0 bg-gradient-to-t from-amber-950/85 via-amber-900/35 to-transparent"
            aria-hidden
          />
          <LoginSideText />
        </div>
        <div className="flex items-center justify-center px-4 py-12 sm:px-8 sm:py-14">
          <div className="w-full max-w-[400px]">
            <Suspense fallback={<LoginFallback />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
