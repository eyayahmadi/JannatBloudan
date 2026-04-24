const TAG_PATTERNS: Array<{ re: RegExp; tag: string; weight: number }> = [
  { re: /\b(spicy|piquant|épice|harissa|فلفل|حار)\b/i, tag: "spicy", weight: 1.2 },
  { re: /\b(sweet|sucré|dessert|kunafa|baklava|حلو)\b/i, tag: "sweet", weight: 1 },
  { re: /\b(vegan|végétal|plant)\b/i, tag: "vegan", weight: 1 },
  { re: /\b(halal)\b/i, tag: "halal", weight: 0.6 },
  { re: /\b(healthy|léger|salade)\b/i, tag: "light", weight: 1 },
  { re: /\b(meat|viande|lamb|agneau|لحم)\b/i, tag: "meat", weight: 1 },
  { re: /\b(chicken|poulet|دجاج)\b/i, tag: "chicken", weight: 1 },
]

export function extractTagsFromText(text: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const { re, tag, weight } of TAG_PATTERNS) {
    if (re.test(text)) {
      out[tag] = (out[tag] ?? 0) + weight
    }
  }
  return out
}

export function mergeTasteVector(
  base: Record<string, number>,
  delta: Record<string, number>,
  decay = 0.98,
): Record<string, number> {
  const next: Record<string, number> = { ...base }
  for (const k of Object.keys(next)) next[k] *= decay
  for (const [k, v] of Object.entries(delta)) {
    next[k] = (next[k] ?? 0) + v
  }
  return next
}
