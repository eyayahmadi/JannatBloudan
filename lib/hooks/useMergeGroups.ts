"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Groupes de tables fusionnées (côté plan de salle).
 *
 * Permet d'afficher visuellement plusieurs tables comme une seule (même
 * commande, même statut) tant que la session est active. Les groupes sont
 * persistés localement (localStorage) ; ils sont dissous quand la table
 * principale est libérée (« Table libre »).
 */

const STORAGE_KEY = "mealhouse:server:merge-groups:v1"
const EVENT_NAME = "mealhouse:merge-groups:update"

export type MergeGroup = {
  id: string
  mainTable: number
  members: number[]
  createdAt: string
  reason?: string | null
}

function readStorage(): MergeGroup[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((g): g is MergeGroup => {
      return Boolean(
        g &&
          typeof g.id === "string" &&
          typeof g.mainTable === "number" &&
          Array.isArray(g.members),
      )
    })
  } catch {
    return []
  }
}

function writeStorage(groups: MergeGroup[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {}
}

export function useMergeGroups() {
  const [groups, setGroups] = useState<MergeGroup[]>(() => readStorage())

  useEffect(() => {
    const refresh = () => setGroups(readStorage())
    window.addEventListener(EVENT_NAME, refresh)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh()
    }
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(EVENT_NAME, refresh)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const persist = useCallback((next: MergeGroup[]) => {
    setGroups(next)
    writeStorage(next)
  }, [])

  const addGroup = useCallback(
    (mainTable: number, members: number[], reason?: string | null) => {
      if (!Number.isFinite(mainTable)) return
      const memberSet = new Set<number>([
        Number(mainTable),
        ...members.filter((m) => Number.isFinite(m)).map((m) => Number(m)),
      ])
      if (memberSet.size < 2) return
      setGroups((prev) => {
        // Retire tout groupe qui partage une table avec ce nouveau groupe (cohérence).
        const filtered = prev.filter(
          (g) => !g.members.some((m) => memberSet.has(m)),
        )
        const newGroup: MergeGroup = {
          id: `mg-${mainTable}-${Date.now().toString(36)}`,
          mainTable: Number(mainTable),
          members: Array.from(memberSet).sort((a, b) => a - b),
          createdAt: new Date().toISOString(),
          reason: reason?.trim() ? reason.trim() : null,
        }
        const next = [...filtered, newGroup]
        writeStorage(next)
        return next
      })
    },
    [],
  )

  const releaseGroup = useCallback((groupId: string) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== groupId)
      writeStorage(next)
      return next
    })
  }, [])

  /** Dissout le(s) groupe(s) qui contiennent cette table (ex. après paiement). */
  const releaseGroupByTable = useCallback((tableId: number) => {
    if (!Number.isFinite(tableId)) return 0
    let removed = 0
    setGroups((prev) => {
      const next = prev.filter((g) => {
        const hit = g.members.includes(Number(tableId))
        if (hit) removed += 1
        return !hit
      })
      writeStorage(next)
      return next
    })
    return removed
  }, [])

  const groupOf = useCallback(
    (tableId: number): MergeGroup | null => {
      const t = Number(tableId)
      return groups.find((g) => g.members.includes(t)) ?? null
    },
    [groups],
  )

  const mainTableOf = useCallback(
    (tableId: number): number => {
      const g = groupOf(tableId)
      return g ? g.mainTable : Number(tableId)
    },
    [groupOf],
  )

  const isMainOfGroup = useCallback(
    (tableId: number): boolean => {
      const g = groupOf(tableId)
      return Boolean(g && g.mainTable === Number(tableId))
    },
    [groupOf],
  )

  return {
    groups,
    addGroup,
    releaseGroup,
    releaseGroupByTable,
    groupOf,
    mainTableOf,
    isMainOfGroup,
    setGroups: persist,
  }
}
