import type { IngredientRow } from "./types"

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

/**
 * Fuzzy match: retourne le meilleur ingrédient connu + score 0-1, ou null.
 */
export function matchIngredient(ingredients: IngredientRow[], rawName: string) {
  const n = norm(rawName)
  if (!n) return { ingredient: null as IngredientRow | null, score: 0 }

  let best: IngredientRow | null = null
  let bestScore = 0

  for (const ing of ingredients) {
    const inNorm = norm(ing.name)
    if (!inNorm) continue
    if (n === inNorm) {
      return { ingredient: ing, score: 1 }
    }
    if (n.includes(inNorm) || inNorm.includes(n)) {
      const s = Math.min(n.length, inNorm.length) / Math.max(n.length, inNorm.length)
      if (s > bestScore) {
        bestScore = Math.max(0.65, s)
        best = ing
      }
      continue
    }
    const tokensA = n.split(" ").filter(Boolean)
    const tokensB = inNorm.split(" ").filter(Boolean)
    const inter = tokensA.filter((t) => tokensB.includes(t))
    if (inter.length) {
      const s = (2 * inter.length) / (tokensA.length + tokensB.length)
      if (s > bestScore) {
        bestScore = s
        best = ing
      }
    }
  }

  if (best && bestScore >= 0.45) {
    return { ingredient: best, score: bestScore }
  }
  return { ingredient: null, score: 0 }
}
