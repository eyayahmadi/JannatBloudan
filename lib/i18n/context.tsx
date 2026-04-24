"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  STORAGE_KEY,
  COOKIE_KEY,
  isLocale,
  I18N_AUTO_ENABLED,
  type Locale,
} from "./config"
import { I18N_SOURCE_VERSION } from "./source-version"
import { fr, type Messages } from "./messages/fr"
import { en } from "./messages/en"
import { ar } from "./messages/ar"
import { de } from "./messages/de"

const MESSAGES: Record<Locale, Messages> = { fr, en, ar, de }

/** Résout a.b.c dans un objet messages (nesting quelconque, typage souple) */
function resolveMessagePath(msgs: Messages, path: string): string | undefined {
  const segments = path.split(".")
  let node: unknown = msgs
  for (const seg of segments) {
    if (node && typeof node === "object" && seg in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[seg]
    } else {
      return undefined
    }
  }
  return typeof node === "string" && node ? node : undefined
}

type I18nContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string, defaultValue?: string) => string
  dir: "ltr" | "rtl"
  messages: Messages
  autoMap: Record<string, string> | null
  i18nAutoLoading: boolean
}

const I18nContext = createContext<I18nContextType | null>(null)

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  try {
    const fromStorage = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(fromStorage)) return fromStorage
  } catch {
    /* ignore */
  }
  try {
    const match = document.cookie.match(new RegExp(`(^| )${COOKIE_KEY}=([^;]+)`))
    if (match && isLocale(match[2])) return match[2]
  } catch {
    /* ignore */
  }
  const browser = typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : ""
  if (isLocale(browser)) return browser
  return DEFAULT_LOCALE
}

function readAutoCache(target: Locale): Record<string, string> | null {
  if (typeof window === "undefined" || target === "fr" || !I18N_AUTO_ENABLED) return null
  try {
    const raw = window.localStorage.getItem(
      `i18n_auto_v${I18N_SOURCE_VERSION}_${target}`,
    )
    if (!raw) return null
    const parsed = JSON.parse(raw) as { map?: Record<string, string> }
    if (parsed.map && typeof parsed.map === "object" && Object.keys(parsed.map).length)
      return parsed.map
  } catch {
    /* ignore */
  }
  return null
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [mounted, setMounted] = useState(false)
  const [autoMap, setAutoMap] = useState<Record<string, string> | null>(null)
  const [i18nAutoLoading, setI18nAutoLoading] = useState(false)

  useEffect(() => {
    const initial = readStoredLocale()
    setLocaleState(initial)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") return
    const meta = LOCALE_META[locale]
    document.documentElement.lang = locale
    document.documentElement.dir = meta.dir
  }, [locale])

  useEffect(() => {
    if (!I18N_AUTO_ENABLED || typeof window === "undefined") {
      setAutoMap(null)
      setI18nAutoLoading(false)
      return
    }
    if (locale === "fr") {
      setAutoMap(null)
      setI18nAutoLoading(false)
      return
    }

    const cached = readAutoCache(locale)
    if (cached) {
      setAutoMap(cached)
      setI18nAutoLoading(false)
      return
    }

    setI18nAutoLoading(true)
    setAutoMap(null)
    const ac = new AbortController()
    const run = async () => {
      try {
        const res = await fetch("/api/i18n/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: locale }),
          signal: ac.signal,
        })
        if (!res.ok) {
          setAutoMap(null)
          return
        }
        const data = (await res.json()) as { map?: Record<string, string> }
        if (data.map && Object.keys(data.map).length) {
          setAutoMap(data.map)
          try {
            window.localStorage.setItem(
              `i18n_auto_v${I18N_SOURCE_VERSION}_${locale}`,
              JSON.stringify({ version: I18N_SOURCE_VERSION, map: data.map }),
            )
          } catch {
            /* ignore */
          }
        }
      } catch {
        setAutoMap(null)
      } finally {
        setI18nAutoLoading(false)
      }
    }
    void run()
    return () => ac.abort()
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
      document.cookie = `${COOKIE_KEY}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    } catch {
      /* ignore */
    }
  }, [])

  const messages = MESSAGES[locale]
  const dir = LOCALE_META[locale].dir

  const t = useCallback(
    (path: string, defaultValue?: string): string => {
      if (locale !== "fr" && I18N_AUTO_ENABLED && autoMap) {
        const auto = autoMap[path]
        if (auto) return auto
      }
      const chain: Messages[] = [messages, MESSAGES.en, MESSAGES[DEFAULT_LOCALE]]
      for (const pack of chain) {
        const val = resolveMessagePath(pack, path)
        if (val) return val
      }
      return defaultValue !== undefined && defaultValue !== "" ? defaultValue : path
    },
    [locale, messages, autoMap],
  )

  const value = useMemo<I18nContextType>(
    () => ({ locale, setLocale, t, dir, messages, autoMap, i18nAutoLoading }),
    [locale, setLocale, t, dir, messages, autoMap, i18nAutoLoading],
  )

  // On n'attend pas "mounted" : on rend toujours avec le DEFAULT_LOCALE pour eviter
  // un flash de langue. Apres hydratation, React met a jour avec la langue sauvegardee.
  void mounted

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => undefined,
      t: (path, def) => {
        const chain: Messages[] = [fr, MESSAGES.en, MESSAGES[DEFAULT_LOCALE]]
        for (const pack of chain) {
          const v = resolveMessagePath(pack, path)
          if (v) return v
        }
        return def !== undefined && def !== "" ? def : path
      },
      dir: "ltr",
      messages: fr,
      autoMap: null,
      i18nAutoLoading: false,
    }
  }
  return ctx
}

export function useT() {
  return useI18n().t
}
