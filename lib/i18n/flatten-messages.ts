/**
 * Aplatit un arbre de messages { a: { b: "x" } } en { "a.b": "x" }.
 * Ignores les tableaux (non gérés dans ce projet) et les clés vides.
 */
export function flattenMessages(
  node: unknown,
  prefix = "",
): Record<string, string> {
  const out: Record<string, string> = {}
  if (node === null || node === undefined) return out
  if (typeof node === "string") {
    if (node.length > 0 && prefix) out[prefix] = node
    return out
  }
  if (Array.isArray(node)) return out
  if (typeof node !== "object") return out
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (typeof v === "string") {
      if (v.length > 0) out[p] = v
    } else {
      Object.assign(out, flattenMessages(v, p))
    }
  }
  return out
}
