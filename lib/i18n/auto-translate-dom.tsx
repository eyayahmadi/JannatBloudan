"use client"

/**
 * AutoTranslateDom
 * ----------------
 * Traducteur DOM runtime : parcourt l'arbre rendu, collecte tous les fragments
 * français (textNode + attributs `placeholder|title|aria-label|alt`), les
 * envoie par lot à `/api/translate-page` (DeepL côté serveur) puis remplace
 * leur valeur en place.
 *
 * - Capture la source FR sur le 1er passage (WeakMap par node / par
 *   couple element+attribut) afin de pouvoir basculer EN → AR → DE → FR
 *   sans perdre l'original.
 * - MutationObserver pour le contenu inséré dynamiquement (dialogs, menus,
 *   listes paginées, toasts…).
 * - Cache localStorage par locale (clé = phrase FR) partagé avec `useMt`.
 * - Skip `<script>`, `<style>`, `<code>`, `<pre>`, `<textarea>`, `<svg>`,
 *   tout élément avec `translate="no"` ou `data-no-translate`, ainsi que les
 *   chaînes sans lettre (nombres, prix isolés, emojis, URLs, e-mails).
 */

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import type { Locale } from "@/lib/i18n/config"
import { translatePage } from "@/lib/client/translate-page"
import { getSeedDictionary } from "@/lib/i18n/seed-dictionary"

const CACHE_PREFIX = "i18n_mt_ui_v2"
const CACHE_MAX = 2500
const BATCH_MAX = 120
const DEBOUNCE_MS = 140

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
  "SVG",
  "PATH",
  "CANVAS",
  "MATH",
  "KBD",
])

const TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label", "alt"] as const

type Cache = Record<string, string>

function loadCache(locale: Locale): Cache {
  if (locale === "fr" || typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(`${CACHE_PREFIX}_${locale}`)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as { map?: Cache }
    return parsed?.map && typeof parsed.map === "object" ? { ...parsed.map } : {}
  } catch {
    return {}
  }
}

function persistCache(locale: Locale, cache: Cache) {
  if (locale === "fr" || typeof window === "undefined") return
  try {
    const entries = Object.entries(cache)
    const capped = entries.slice(Math.max(0, entries.length - CACHE_MAX))
    window.localStorage.setItem(
      `${CACHE_PREFIX}_${locale}`,
      JSON.stringify({ map: Object.fromEntries(capped) }),
    )
  } catch {
    /* quota / privacy mode → ignore */
  }
}

const URL_RE = /^https?:\/\//i
const EMAIL_RE = /^\S+@\S+\.\S+$/
const HAS_LETTER = /\p{L}/u

function isTranslatable(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (t.length < 2) return false
  if (!HAS_LETTER.test(t)) return false
  if (URL_RE.test(t)) return false
  if (EMAIL_RE.test(t)) return false
  return true
}

function shouldSkipElement(el: Element | null): boolean {
  let cur: Element | null = el
  while (cur) {
    if (SKIP_TAGS.has(cur.tagName)) return true
    const tr = cur.getAttribute?.("translate")
    if (tr === "no") return true
    if (cur.hasAttribute?.("data-no-translate")) return true
    cur = cur.parentElement
  }
  return false
}

type TextEntry = { node: Text; original: string }
type AttrEntry = { el: Element; attr: string; original: string }

export function AutoTranslateDom() {
  const { locale } = useI18n()
  const pathname = usePathname()

  const originalsTextRef = useRef<WeakMap<Text, string>>(new WeakMap())
  const originalsAttrRef = useRef<WeakMap<Element, Map<string, string>>>(new WeakMap())
  const cacheRef = useRef<Cache>({})
  const pendingTextRef = useRef<TextEntry[]>([])
  const pendingAttrRef = useRef<AttrEntry[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const localeRef = useRef<Locale>(locale)
  const observerRef = useRef<MutationObserver | null>(null)

  localeRef.current = locale

  useEffect(() => {
    // Menu product copy comes from DB (DE/AR) — never machine-translate on menu routes.
    const path = pathname ?? ""
    if (path === "/menu" || path.startsWith("/table/")) {
      return
    }

    // L'ordre importe : le SEED écrase la version persistée pour les chaînes
    // connues (source de vérité figée dans le bundle) ; les autres entrées
    // restent disponibles via le cache local pour éviter de re-frapper l'API.
    cacheRef.current = { ...loadCache(locale), ...getSeedDictionary(locale) }

    const collectInto = (
      root: Node,
      textBuf: TextEntry[],
      attrBuf: AttrEntry[],
    ) => {
      if (root.nodeType === Node.TEXT_NODE) {
        const tNode = root as Text
        const parent = tNode.parentElement
        if (parent && !shouldSkipElement(parent)) {
          const stored = originalsTextRef.current.get(tNode)
          const original = stored ?? tNode.data
          if (isTranslatable(original)) {
            if (!stored) originalsTextRef.current.set(tNode, original)
            textBuf.push({ node: tNode, original })
          }
        }
        return
      }

      if (root.nodeType !== Node.ELEMENT_NODE) return
      const el = root as Element
      if (shouldSkipElement(el)) return

      for (const attr of TRANSLATABLE_ATTRS) {
        const stored = originalsAttrRef.current.get(el)?.get(attr)
        const current = el.getAttribute(attr)
        const original = stored ?? current ?? null
        if (original && isTranslatable(original)) {
          if (!stored) {
            let m = originalsAttrRef.current.get(el)
            if (!m) {
              m = new Map()
              originalsAttrRef.current.set(el, m)
            }
            m.set(attr, original)
          }
          attrBuf.push({ el, attr, original })
        }
      }

      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          const tNode = n as Text
          const parent = tNode.parentElement
          if (!parent) return NodeFilter.FILTER_REJECT
          if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT
          const stored = originalsTextRef.current.get(tNode)
          const candidate = stored ?? tNode.data
          return isTranslatable(candidate) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        },
      })
      let n: Node | null
      while ((n = walker.nextNode())) {
        const tNode = n as Text
        const stored = originalsTextRef.current.get(tNode)
        const original = stored ?? tNode.data
        if (!stored) originalsTextRef.current.set(tNode, original)
        textBuf.push({ node: tNode, original })
      }

      for (const child of Array.from(el.children)) {
        for (const attr of TRANSLATABLE_ATTRS) {
          const storedMap = originalsAttrRef.current.get(child)
          const stored = storedMap?.get(attr)
          const current = child.getAttribute(attr)
          const original = stored ?? current ?? null
          if (!original || !isTranslatable(original)) continue
          if (shouldSkipElement(child)) continue
          if (!stored) {
            let m = originalsAttrRef.current.get(child)
            if (!m) {
              m = new Map()
              originalsAttrRef.current.set(child, m)
            }
            m.set(attr, original)
          }
          attrBuf.push({ el: child, attr, original })
        }
      }
    }

    // Recherche tolérante à l'espace de bord : essaie la forme brute puis trimée,
    // tout en réappliquant le préfixe / suffixe d'origine pour préserver la mise
    // en page (ex. "Table " utilisé devant un span avec un identifiant).
    const lookup = (original: string, translations: Record<string, string>): string => {
      const exact = translations[original]
      if (typeof exact === "string") return exact
      const leadMatch = original.match(/^\s+/)?.[0] ?? ""
      const trailMatch = original.match(/\s+$/)?.[0] ?? ""
      const core = original.slice(leadMatch.length, original.length - trailMatch.length)
      const hit = translations[core]
      if (typeof hit === "string") return `${leadMatch}${hit}${trailMatch}`
      return original
    }

    const applyTranslations = (
      textEntries: TextEntry[],
      attrEntries: AttrEntry[],
      translations: Record<string, string>,
    ) => {
      const currentLocale = localeRef.current
      for (const { node, original } of textEntries) {
        const out = currentLocale === "fr" ? original : lookup(original, translations)
        if (node.data !== out) node.data = out
      }
      for (const { el, attr, original } of attrEntries) {
        const out = currentLocale === "fr" ? original : lookup(original, translations)
        if (el.getAttribute(attr) !== out) el.setAttribute(attr, out)
      }
    }

    const flush = async () => {
      const textBuf = pendingTextRef.current
      const attrBuf = pendingAttrRef.current
      pendingTextRef.current = []
      pendingAttrRef.current = []
      if (!textBuf.length && !attrBuf.length) return

      const currentLocale = localeRef.current

      if (currentLocale === "fr") {
        applyTranslations(textBuf, attrBuf, {})
        return
      }

      const cache = cacheRef.current
      const missingSet = new Set<string>()
      const isCached = (s: string): boolean => {
        if (typeof cache[s] === "string") return true
        const trimmed = s.trim()
        return trimmed !== s && typeof cache[trimmed] === "string"
      }
      for (const { original } of textBuf) if (!isCached(original)) missingSet.add(original)
      for (const { original } of attrBuf) if (!isCached(original)) missingSet.add(original)

      if (missingSet.size === 0) {
        applyTranslations(textBuf, attrBuf, cache)
        return
      }

      const missing = [...missingSet]
      try {
        for (let offset = 0; offset < missing.length; offset += BATCH_MAX) {
          const batch = missing.slice(offset, offset + BATCH_MAX)
          if (localeRef.current === "fr") break
          const res = await translatePage(batch, currentLocale)
          if (localeRef.current !== currentLocale) return
          batch.forEach((src, idx) => {
            const out = res.translations[idx]
            if (typeof out === "string" && out.length > 0) cache[src] = out
          })
        }
        persistCache(currentLocale, cache)
      } catch {
        /* offline / server down — keep originals */
      }
      applyTranslations(textBuf, attrBuf, cache)
    }

    const scheduleFlush = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        void flush()
      }, DEBOUNCE_MS)
    }

    const enqueueSubtree = (root: Node) => {
      const textBuf: TextEntry[] = []
      const attrBuf: AttrEntry[] = []
      collectInto(root, textBuf, attrBuf)
      if (textBuf.length || attrBuf.length) {
        pendingTextRef.current.push(...textBuf)
        pendingAttrRef.current.push(...attrBuf)
        scheduleFlush()
      }
    }

    enqueueSubtree(document.body)

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          m.addedNodes.forEach((n) => enqueueSubtree(n))
        } else if (m.type === "characterData") {
          const tNode = m.target as Text
          const parent = tNode.parentElement
          if (!parent || shouldSkipElement(parent)) continue
          const currentLocale = localeRef.current
          const stored = originalsTextRef.current.get(tNode)
          if (currentLocale === "fr") {
            if (isTranslatable(tNode.data)) {
              originalsTextRef.current.set(tNode, tNode.data)
            }
            continue
          }
          if (!stored) {
            if (isTranslatable(tNode.data)) {
              originalsTextRef.current.set(tNode, tNode.data)
              pendingTextRef.current.push({ node: tNode, original: tNode.data })
              scheduleFlush()
            }
            continue
          }
          const translated = cacheRef.current[stored]
          if (translated && tNode.data !== translated) {
            if (isTranslatable(tNode.data) && tNode.data !== stored) {
              originalsTextRef.current.set(tNode, tNode.data)
              pendingTextRef.current.push({ node: tNode, original: tNode.data })
              scheduleFlush()
            } else {
              tNode.data = translated
            }
          }
        } else if (m.type === "attributes") {
          const el = m.target as Element
          const attr = m.attributeName
          if (!attr || !TRANSLATABLE_ATTRS.includes(attr as (typeof TRANSLATABLE_ATTRS)[number])) continue
          if (shouldSkipElement(el)) continue
          const current = el.getAttribute(attr)
          if (!current || !isTranslatable(current)) continue
          const currentLocale = localeRef.current
          const map = originalsAttrRef.current.get(el)
          const stored = map?.get(attr)
          if (currentLocale === "fr") {
            if (!map) {
              const fresh = new Map<string, string>()
              fresh.set(attr, current)
              originalsAttrRef.current.set(el, fresh)
            } else {
              map.set(attr, current)
            }
            continue
          }
          if (!stored) {
            if (!map) {
              const fresh = new Map<string, string>()
              fresh.set(attr, current)
              originalsAttrRef.current.set(el, fresh)
            } else {
              map.set(attr, current)
            }
            pendingAttrRef.current.push({ el, attr, original: current })
            scheduleFlush()
            continue
          }
          const translated = cacheRef.current[stored]
          if (translated && current !== translated && current !== stored) {
            if (!map) {
              const fresh = new Map<string, string>()
              fresh.set(attr, current)
              originalsAttrRef.current.set(el, fresh)
            } else {
              map.set(attr, current)
            }
            pendingAttrRef.current.push({ el, attr, original: current })
            scheduleFlush()
          } else if (translated && current === stored) {
            el.setAttribute(attr, translated)
          }
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRS],
    })
    observerRef.current = observer

    return () => {
      observer.disconnect()
      observerRef.current = null
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      pendingTextRef.current = []
      pendingAttrRef.current = []
    }
  }, [locale, pathname])

  return null
}
