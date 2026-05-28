"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Locale } from "@/lib/i18n/config"
import { translatePage } from "@/lib/client/translate-page"
import { useI18n } from "@/lib/i18n/context"

const CACHE_PREFIX = "i18n_mt_ui_v1"
const DEBOUNCE_MS = 90

type MachineTranslateCtx = {
  locale: Locale
  map: Record<string, string>
  enqueue: (frText: string) => void
  resolve: (frText: string) => string
  busy: boolean
}

const MachineTranslateContext = createContext<MachineTranslateCtx | null>(null)

function loadCache(locale: Locale): Record<string, string> {
  if (locale === "fr" || typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(`${CACHE_PREFIX}_${locale}`)
    if (!raw) return {}
    const j = JSON.parse(raw) as { map?: Record<string, string> }
    return j?.map && typeof j.map === "object" ? { ...j.map } : {}
  } catch {
    return {}
  }
}

function persistCache(locale: Locale, entryMap: Record<string, string>) {
  if (locale === "fr" || typeof window === "undefined") return
  try {
    const pairs = Object.entries(entryMap)
    const capped = pairs.slice(Math.max(0, pairs.length - 900))
    window.localStorage.setItem(`${CACHE_PREFIX}_${locale}`, JSON.stringify({ map: Object.fromEntries(capped) }))
  } catch {
    /* ignore quota */
  }
}

/**
 * Traduction runtime des fragments FR encore non couverts par `t("clés")` :
 * appels batch vers `/api/translate-page`, cache navigateur par langue.
 */
export function MachineTranslateProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n()
  const [map, setMap] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setMap(locale === "fr" ? {} : loadCache(locale))
  }, [locale])

  const pendingRef = useRef(new Set<string>())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapRef = useRef(map)

  mapRef.current = map

  const flush = useCallback(async () => {
    if (locale === "fr") {
      pendingRef.current.clear()
      return
    }
    const uniq = [...new Set(pendingRef.current)].map((x) => x.trim()).filter(Boolean)
    pendingRef.current.clear()

    const current = mapRef.current
    const need = uniq.filter((t) => !current[t])
    if (need.length === 0) return

    setBusy(true)
    try {
      const max = 200
      const mergedUpdates: Record<string, string> = {}

      for (let offset = 0; offset < need.length; offset += max) {
        const batch = need.slice(offset, offset + max)
        const { translations } = await translatePage(batch, locale)
        batch.forEach((src, idx) => {
          mergedUpdates[src] = translations[idx] ?? src
        })
      }

      setMap((prev) => {
        const next = { ...prev, ...mergedUpdates }
        persistCache(locale, next)
        return next
      })
    } finally {
      setBusy(false)
    }
  }, [locale])

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      void flush()
    }, DEBOUNCE_MS)
  }, [flush])

  const enqueue = useCallback(
    (frText: string) => {
      const t = frText.trim()
      if (!t || locale === "fr") return
      if (mapRef.current[t]) return
      pendingRef.current.add(t)
      scheduleFlush()
    },
    [locale, scheduleFlush],
  )

  const resolve = useCallback(
    (frText: string) => {
      if (locale === "fr") return frText
      const k = frText.trim()
      if (!k) return frText
      return map[k] ?? frText
    },
    [locale, map],
  )

  const value = useMemo(
    (): MachineTranslateCtx => ({
      locale,
      map,
      enqueue,
      resolve,
      busy,
    }),
    [locale, map, enqueue, resolve, busy],
  )

  return (
    <MachineTranslateContext.Provider value={value}>{children}</MachineTranslateContext.Provider>
  )
}

export function useMachineTranslateConsumer(): MachineTranslateCtx | null {
  return useContext(MachineTranslateContext)
}

/** Traduction API pour chaîne française en dur dans le JSX. */
export function useMt(frSource: string): string {
  const ctx = useContext(MachineTranslateContext)
  const trimmed = typeof frSource === "string" ? frSource.trim() : ""

  useLayoutEffect(() => {
    if (!ctx || trimmed.length === 0) return
    ctx.enqueue(trimmed)
  }, [ctx, trimmed])

  if (!ctx || ctx.locale === "fr") return frSource

  return ctx.resolve(frSource)
}

/** Enfant unique : chaîne source FR uniquement (pas de JSX imbriqué). */
export function Mt({ children }: { children: string }) {
  const s = useMt(children)
  return <>{s}</>
}
