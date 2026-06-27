"use client"

import { Fragment } from "react"
import { cn } from "@/lib/utils"

type HighlightTextProps = {
  text: string
  query?: string
  className?: string
}

/**
 * Met en évidence (visuellement) la portion de `text` qui correspond à `query`.
 * Insensible à la casse. Best-effort, longueur préservée (pas de normalisation
 * des accents) afin de garder l'alignement des indices avec le texte d'origine.
 * Purement présentationnel : ne filtre rien, n'altère pas le texte affiché.
 */
export function HighlightText({ text, query, className }: HighlightTextProps) {
  const q = (query ?? "").trim()
  if (!q || !text) return <>{text}</>

  const lowerText = text.toLowerCase()
  const lowerQ = q.toLowerCase()

  const parts: { str: string; match: boolean }[] = []
  let i = 0
  while (i < text.length) {
    const idx = lowerText.indexOf(lowerQ, i)
    if (idx === -1) {
      parts.push({ str: text.slice(i), match: false })
      break
    }
    if (idx > i) parts.push({ str: text.slice(i, idx), match: false })
    parts.push({ str: text.slice(idx, idx + q.length), match: true })
    i = idx + q.length
  }

  return (
    <>
      {parts.map((p, k) =>
        p.match ? (
          <mark
            key={k}
            className={cn(
              "rounded bg-amber-200/70 px-0.5 text-inherit dark:bg-amber-500/30",
              className,
            )}
          >
            {p.str}
          </mark>
        ) : (
          <Fragment key={k}>{p.str}</Fragment>
        ),
      )}
    </>
  )
}
