"use client"

import { Suspense, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/context/AuthContext"
import { PageShell } from "@/components/site/PageShell"
import { SITE } from "@/lib/site-config"
import { dashboardPathForRole, normalizeRole } from "@/lib/auth/roles"
import { getSupabaseBrowserSetupMessage, hasBrowserSupabaseEnv } from "@/lib/supabase/config"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

function LoginForm() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get("next")
  const mode = searchParams.get("mode")
  const { login, register } = useAuth()
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
    setLoading(true)
    try {
      let loggedRole: string | undefined
      if (isLogin) {
        await login(email, password)
      } else {
        // Role CLIENT force cote serveur dans AuthContext.register (securite)
        await register({ email, password, firstName, lastName, phone, role: "CLIENT" })
      }
      // Lecture du rôle depuis Supabase (le contexte vient juste d'être mis à jour)
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const { hasBrowserSupabaseEnv } = await import("@/lib/supabase/config")
        if (hasBrowserSupabaseEnv()) {
          const supabase = createClient()
          const { data } = await supabase.auth.getSession()
          loggedRole = (data.session?.user?.user_metadata as any)?.role
        }
      } catch {}

      const redirect =
        nextParam && nextParam.startsWith("/")
          ? nextParam
          : dashboardPathForRole(normalizeRole(loggedRole))
      router.replace(redirect)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("auth.error")
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGuestMode = () => {
    router.push("/")
  }

  return (
    <Card className="border-white/40 bg-white/85 p-8 shadow-[0_24px_70px_-28px_rgba(67,20,7,0.35)] backdrop-blur-xl sm:p-10 animate-fade-up">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-800/70">{t("auth.area")}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-amber-950">{SITE.name}</h1>
        <p className="mt-2 text-sm text-amber-900/75">
          {isLogin ? t("auth.blurbIn") : t("auth.blurbUp")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 space-y-4">
        {!isLogin && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-amber-950">{t("auth.firstName")}</label>
              <Input
                type="text"
                placeholder={t("auth.phFirst")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="border-amber-900/15 bg-white/90"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-amber-950">{t("auth.lastName")}</label>
              <Input
                type="text"
                placeholder={t("auth.phLast")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="border-amber-900/15 bg-white/90"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-amber-950">{t("auth.email")}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-800/40" />
            <Input
              type="email"
              placeholder={t("auth.phEmail")}
              className="border-amber-900/15 bg-white/90 pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {!isLogin && (
          <div>
            <label className="mb-2 block text-sm font-medium text-amber-950">{t("auth.phone")}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-800/40" />
              <Input
                type="tel"
                placeholder={t("auth.phPhone")}
                className="border-amber-900/15 bg-white/90 pl-10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-amber-950">{t("auth.password")}</label>
            {isLogin ? (
              <Link
                href="/login?reset=true"
                className="text-xs font-medium text-amber-800 underline-offset-4 hover:text-[color:var(--lux-bordeaux)] hover:underline"
              >
                {t("auth.forgotPassword", "Mot de passe oublié ?")}
              </Link>
            ) : null}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-800/40" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.phPassword")}
              className="border-amber-900/15 bg-white/90 pl-10 pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={isLogin ? undefined : 8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? t("auth.hidePassword", "Masquer le mot de passe")
                  : t("auth.showPassword", "Afficher le mot de passe")
              }
              tabIndex={-1}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-amber-800/60 transition hover:bg-amber-100/60 hover:text-amber-950"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {!isLogin && password ? (
            <div className="mt-2.5">
              <div className="flex gap-1" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-300",
                      i < passwordStrength ? strengthColor : "bg-amber-100",
                    )}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-amber-900/60" aria-live="polite">
                {t("auth.strength", "Robustesse")} : {strengthLabel}
              </p>
            </div>
          ) : null}
        </div>

        {isLogin ? (
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-amber-900/80">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-amber-900/30 text-[color:var(--lux-bordeaux)] focus:ring-[color:var(--lux-gold)]/40"
            />
            {t("auth.rememberMe", "Rester connecté")}
          </label>
        ) : (
          <p className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-xs text-amber-900/80">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <span>
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
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-800 animate-fade-up"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        <Button
          type="submit"
          variant="gold"
          size="xl"
          className="h-auto min-h-12 w-full rounded-full py-6 text-base font-semibold"
          disabled={loading || !envReady}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              />
              {t("auth.loading")}
            </span>
          ) : isLogin ? (
            t("auth.submitIn")
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t("auth.submitUp")}
            </span>
          )}
        </Button>
      </form>

      <div className="space-y-3 text-center">
        <div className="relative my-4 flex items-center">
          <span className="hairline-gold flex-1" aria-hidden />
          <span className="px-3 text-[11px] font-medium uppercase tracking-[0.22em] text-amber-900/50">
            {t("auth.or", "ou")}
          </span>
          <span className="hairline-gold flex-1" aria-hidden />
        </div>

        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => {
            setIsLogin(!isLogin)
            setError(null)
          }}
          className="h-auto p-0 text-sm font-medium text-amber-800 hover:text-amber-950"
        >
          {isLogin ? t("auth.switchUp") : t("auth.switchIn")}
        </Button>
        <div>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleGuestMode}
            className="h-auto p-0 text-sm !no-underline text-amber-900/60 hover:!no-underline hover:text-amber-950"
          >
            {t("auth.guest")}
          </Button>
        </div>
        <p className="text-xs text-amber-900/50">
          <Link href="/" className="hover:text-amber-950">
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
      <p className="font-display text-3xl font-medium leading-tight animate-fade-up">{t("auth.sideTitle")}</p>
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
          <img
            src={SITE.images.auth}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-amber-950/85 via-amber-900/35 to-transparent"
            aria-hidden
          />
          <LoginSideText />
        </div>
        <div className="flex items-center justify-center px-4 py-14 sm:px-8">
          <div className="w-full max-w-md">
            <Suspense fallback={<LoginFallback />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
