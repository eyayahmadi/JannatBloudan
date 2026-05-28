'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  getAuthRedirectOrigin,
  getSupabaseBrowserSetupMessage,
  hasBrowserSupabaseEnv,
} from '@/lib/supabase/config'
import { normalizeRole } from '@/lib/auth/roles'

type Role =
  | 'CLIENT'
  | 'ADMIN'
  | 'SERVER'
  | 'KITCHEN'
  | 'BAR'
  | 'SHISHA'
  | 'CASHIER'
  | 'DELIVERY'
  // Compat rétro
  | 'CUSTOMER'
  | 'STAFF'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  role: Role
  restaurantId?: string | null
  addresses?: Array<{ id: string; label: string; address: string; isDefault?: boolean }>
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  /** Renvoie l'e-mail de confirmation d'inscription (Supabase Auth). */
  resendSignupConfirmation: (email: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  hasRole: (role: Role) => boolean
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: Role
}

/** Jeté quand l'inscription a réussi mais qu'aucune session n'est retournée (confirmation e-mail obligatoire). */
export class AuthEmailConfirmationRequired extends Error {
  readonly email: string
  constructor(email: string) {
    super("EMAIL_CONFIRMATION_REQUIRED")
    this.name = "AuthEmailConfirmationRequired"
    this.email = email
  }
}

type CredentialErrOpts = { code?: string; status?: number }

function mapCredentialError(
  message: string | undefined,
  phase: "login" | "register",
  opts?: CredentialErrOpts,
): string {
  const m = (message ?? "").toLowerCase()
  const code = (opts?.code ?? "").toLowerCase().replace(/-/g, "_")
  if (
    m.includes("email not confirmed") ||
    m.includes("confirm your email") ||
    m.includes("email address not confirmed") ||
    code === "email_not_confirmed"
  ) {
    return phase === "login"
      ? "Votre compte n'est pas encore actif : ouvrez le lien de confirmation dans l'e-mail envoye a votre adresse (verifiez aussi les courriers indesirables), puis reconnectez-vous."
      : "L'e-mail doit etre confirme avant la connexion. Verifiez votre boite mail."
  }
  if (
    m.includes("invalid login credentials") ||
    m.includes("invalid email or password") ||
    m.includes("invalid credentials")
  ) {
    if (phase === "login") {
      return (
        "Impossible de vous connecter avec ces identifiants. " +
        "Si vous venez de vous inscrire, confirmez d'abord votre e-mail via le lien recu (spam inclus). " +
        "Sinon verifiez le mot de passe ou utilisez « Mot de passe oublie »."
      )
    }
    return (
      "Ce compte existe peut-etre deja : essayez de vous connecter apres confirmation e-mail, " +
      "ou reinitialisez le mot de passe si vous l'avez oublie."
    )
  }
  return (message ?? "").trim() || (phase === "login" ? "Impossible de se connecter." : "Inscription impossible.")
}

function mapSignUpSendError(message: string | undefined, fallback = "Inscription impossible."): string {
  const m = (message ?? "").toLowerCase()
  if (
    m.includes("sending confirmation") ||
    m.includes("send confirmation") ||
    m.includes("error sending") ||
    (m.includes("mail") && m.includes("fail"))
  ) {
    return (
      "L'e-mail de confirmation n'a pas pu etre envoye par Supabase. " +
      "Verifiez le dashboard : Authentication > Emails (SMTP personnalise, quotas) et les logs Auth. " +
      "En gratuit, l'envoi peut etre limite : configurez un SMTP (Resend, SendGrid, etc.)."
    )
  }
  if (
    m.includes("redirect") &&
    (m.includes("url") || m.includes("not allowed") || m.includes("invalid"))
  ) {
    const origin = getAuthRedirectOrigin().trim()
    const example = origin ? `${origin}/auth/confirm` : "https://votre-domaine/auth/confirm"
    return (
      "URL de redirection refusee : dans Supabase > Authentication > URL configuration, " +
      `ajoutez cette URL aux redirect URLs autorisees : ${example}. ` +
      "En dev sur localhost, ajoutez aussi http://localhost:3000/auth/confirm si besoin ; " +
      "NEXT_PUBLIC_SITE_URL dans .env.local doit correspondre a une URL autorisee."
    )
  }
  return (message ?? "").trim() || fallback
}

function signupLooksLikeDuplicate(_email: unknown, _password: unknown, error: {
  status?: number
  message?: string
}): boolean {
  const m = (error.message ?? "").toLowerCase()
  const st = error.status ?? 0
  if (st !== 400 && st !== 422) return false
  if (m.includes("registered")) return true
  if (m.includes("already") && (m.includes("user") || m.includes("registered") || m.includes("exist"))) return true
  return false
}

/** Evite d'afficher un e-mail sous l'icone telephone (metadata.phone parfois rempli par erreur). */
function looksLikeEmailAddress(value: string): boolean {
  const t = value.trim()
  if (!t.includes("@")) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

function normalizeMetadataPhone(raw: unknown, accountEmail: string): string | null {
  if (raw == null) return null
  const s = typeof raw === "string" ? raw.trim() : String(raw).trim()
  if (!s) return null
  if (looksLikeEmailAddress(s)) return null
  const em = accountEmail.trim().toLowerCase()
  if (em && s.toLowerCase() === em) return null
  return s
}

/** Téléphone dans le JWT / métadonnées (plusieurs clés possibles selon les intégrations). */
function getRawPhoneFromSessionUser(sessionUser: any): unknown {
  if (!sessionUser) return null
  const metadata = sessionUser.user_metadata ?? {}
  return (
    metadata.phone ??
    metadata.phone_number ??
    metadata.tel ??
    metadata.mobile ??
    sessionUser.phone ??
    null
  )
}

/**
 * Après confirmation e-mail, le numéro est souvent dans public.profiles même si user_metadata
 * du jeton ne le renvoie pas tout de suite — on complète pour l'affichage « Mon compte ».
 */
async function mergePhoneFromProfile(base: User): Promise<User> {
  if (base.phone) return base
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("profiles").select("phone").eq("id", base.id).maybeSingle()
    if (error || !data?.phone) return base
    const p = normalizeMetadataPhone(data.phone, base.email)
    return p ? { ...base, phone: p } : base
  } catch {
    return base
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const mapSessionUser = useCallback((sessionUser: any): User => {
    const metadata = sessionUser?.user_metadata ?? {}
    const email = sessionUser.email ?? ""
    return {
      id: sessionUser.id,
      email,
      firstName: metadata.first_name ?? '',
      lastName: metadata.last_name ?? '',
      phone: normalizeMetadataPhone(getRawPhoneFromSessionUser(sessionUser), email),
      role: normalizeRole(metadata.role) as Role,
      restaurantId: metadata.restaurantId ?? null,
      addresses: metadata.addresses ?? [],
    }
  }, [])

  const finalizeUser = useCallback(
    async (sessionUser: any): Promise<User | null> => {
      if (!sessionUser) return null
      const base = mapSessionUser(sessionUser)
      return mergePhoneFromProfile(base)
    },
    [mapSessionUser],
  )

  const checkAuthStatus = useCallback(async () => {
    if (!hasBrowserSupabaseEnv()) {
      setUser(null)
      setLoading(false)
      return
    }

    const supabase = createClient()
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        const u = await finalizeUser(data.session.user)
        setUser(u)
      } else {
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }, [finalizeUser])

  useEffect(() => {
    if (!hasBrowserSupabaseEnv()) {
      setUser(null)
      setLoading(false)
      return
    }

    void checkAuthStatus()
    const supabase = createClient()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (session?.user) {
          const u = await finalizeUser(session.user)
          setUser(u)
        } else {
          setUser(null)
        }
        setLoading(false)
      })()
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [checkAuthStatus, finalizeUser])

  const login = async (email: string, password: string) => {
    if (!hasBrowserSupabaseEnv()) {
      throw new Error(getSupabaseBrowserSetupMessage())
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const code = typeof (error as { code?: string }).code === "string" ? (error as { code?: string }).code : undefined
      throw new Error(mapCredentialError(error.message, "login", { code, status: error.status }))
    }
    if (data.session?.user) {
      const u = await finalizeUser(data.session.user)
      setUser(u)
    }
  }

  const register = async (data: RegisterData) => {
    if (!hasBrowserSupabaseEnv()) {
      throw new Error(getSupabaseBrowserSetupMessage())
    }

    const supabase = createClient()
    if (!data.password || data.password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères')
    }
    // SECURITE : le signup public force TOUJOURS role=CLIENT.
    // Tout autre role (ADMIN, SERVER, KITCHEN, BAR, SHISHA, CASHIER, DELIVERY)
    // ne peut etre cree que via l'API admin (/api/admin/users) par un ADMIN connecte.
    const origin = getAuthRedirectOrigin()
    const emailRedirectTo = origin ? `${origin}/auth/confirm` : undefined

    const phoneMeta = normalizeMetadataPhone(data.phone, data.email)
    const { error, data: result } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo,
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          ...(phoneMeta ? { phone: phoneMeta } : {}),
          role: 'CLIENT',
        },
      },
    })
    if (error) {
      if (error.status === 429) {
        throw new Error('Trop de tentatives. Attendez quelques secondes avant de réessayer.')
      }
      if (signupLooksLikeDuplicate(data.email, data.password, error)) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (signInError) {
          const code =
            typeof (signInError as { code?: string }).code === "string"
              ? (signInError as { code?: string }).code
              : undefined
          throw new Error(mapCredentialError(signInError.message, "register", { code, status: signInError.status }))
        }
        if (signInData.session?.user) {
          const u = await finalizeUser(signInData.session.user)
          setUser(u)
        }
        return
      }
      if (/database error updating user/i.test(error.message ?? "")) {
        throw new Error(
          "Erreur lors de la creation du profil (base de donnees). Administration : executer scripts/fix-signup-database-error-updating-user.sql dans Supabase (SQL Editor).",
        )
      }
      throw new Error(mapSignUpSendError(error.message))
    }
    if (result.user && !result.session) {
      throw new AuthEmailConfirmationRequired(data.email.trim())
    }
    if (result.session?.user) {
      const u = await finalizeUser(result.session.user)
      setUser(u)
      return
    }
    const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (signInError) {
      if (signInError.status === 429) {
        throw new Error('Trop de tentatives. Attendez quelques secondes avant de réessayer.')
      }
      if (/database error updating user/i.test(signInError.message ?? "")) {
        throw new Error(
          "Erreur lors de la creation du profil (base de donnees). Administration : executer scripts/fix-signup-database-error-updating-user.sql dans Supabase (SQL Editor).",
        )
      }
      const code =
        typeof (signInError as { code?: string }).code === "string"
          ? (signInError as { code?: string }).code
          : undefined
      throw new Error(mapCredentialError(signInError.message, "register", { code, status: signInError.status }))
    }
    if (signInData.session?.user) {
      const u = await finalizeUser(signInData.session.user)
      setUser(u)
    }
  }

  const resendSignupConfirmation = async (email: string) => {
    if (!hasBrowserSupabaseEnv()) {
      throw new Error(getSupabaseBrowserSetupMessage())
    }
    const trimmed = email.trim()
    if (!trimmed) {
      throw new Error("Indiquez votre adresse e-mail.")
    }
    const supabase = createClient()
    const origin = getAuthRedirectOrigin()
    const emailRedirectTo = origin ? `${origin}/auth/confirm` : undefined
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: trimmed,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    })
    if (error) {
      if (error.status === 429) {
        throw new Error("Trop de demandes. Patientez une minute avant de renvoyer l'e-mail.")
      }
      throw new Error(mapSignUpSendError(error.message, "Impossible de renvoyer l'e-mail de confirmation."))
    }
  }

  const logout = async () => {
    if (!hasBrowserSupabaseEnv()) {
      setUser(null)
      router.replace('/')
      return
    }

    const supabase = createClient()
    try {
      await supabase.auth.signOut()
    } finally {
      setUser(null)
      router.replace('/')
    }
  }

  const hasRole = (role: Role) => {
    return user?.role === role
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        resendSignupConfirmation,
        logout,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
