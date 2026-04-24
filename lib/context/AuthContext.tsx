'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseBrowserSetupMessage, hasBrowserSupabaseEnv } from '@/lib/supabase/config'

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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const mapSessionUser = useCallback((sessionUser: any): User => {
    const metadata = sessionUser?.user_metadata ?? {}
    return {
      id: sessionUser.id,
      email: sessionUser.email ?? '',
      firstName: metadata.first_name ?? '',
      lastName: metadata.last_name ?? '',
      phone: metadata.phone ?? null,
      role: (metadata.role as Role) ?? 'CLIENT',
      restaurantId: metadata.restaurantId ?? null,
      addresses: metadata.addresses ?? [],
    }
  }, [])

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
        setUser(mapSessionUser(data.session.user))
      } else {
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }, [mapSessionUser])

  useEffect(() => {
    if (!hasBrowserSupabaseEnv()) {
      setUser(null)
      setLoading(false)
      return
    }

    void checkAuthStatus()
    const supabase = createClient()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSessionUser(session.user))
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [checkAuthStatus, mapSessionUser])

  const login = async (email: string, password: string) => {
    if (!hasBrowserSupabaseEnv()) {
      throw new Error(getSupabaseBrowserSetupMessage())
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw new Error(error.message || 'Impossible de se connecter')
    }
    if (data.session?.user) {
      setUser(mapSessionUser(data.session.user))
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
    const { error, data: result } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          role: 'CLIENT',
        },
      },
    })
    if (error) {
      if (error.status === 429) {
        throw new Error('Trop de tentatives. Attendez quelques secondes avant de réessayer.')
      }
      if (error.status === 400 && error.message?.toLowerCase().includes('registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (signInError) {
          throw new Error(signInError.message || "Impossible de se connecter à un compte existant")
        }
        if (signInData.session?.user) {
          setUser(mapSessionUser(signInData.session.user))
        }
        return
      }
      throw new Error(error.message || 'Inscription impossible')
    }
    if (result.session?.user) {
      setUser(mapSessionUser(result.session.user))
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
      throw new Error(signInError.message || 'Impossible de finaliser la connexion')
    }
    if (signInData.session?.user) {
      setUser(mapSessionUser(signInData.session.user))
    }
  }

  const logout = async () => {
    if (!hasBrowserSupabaseEnv()) {
      setUser(null)
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
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
