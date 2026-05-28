import type { SupabaseClient } from "@supabase/supabase-js"

/** Résout `restaurant_tables.id` + `table_number` depuis l’URL client (/table/{ref}). */
export async function resolveRestaurantTableFromRef(
  supabase: SupabaseClient,
  rawRef: string,
): Promise<{ id: number; table_number: number } | null> {
  const ref = rawRef.trim()
  if (!ref) return null

  if (/^\d+$/.test(ref)) {
    const n = Number(ref)
    const { data: byId } = await supabase
      .from("restaurant_tables")
      .select("id,table_number")
      .eq("id", n)
      .maybeSingle()
    if (byId) return { id: Number(byId.id), table_number: Number(byId.table_number) }
    const { data: byNum } = await supabase
      .from("restaurant_tables")
      .select("id,table_number")
      .eq("table_number", n)
      .maybeSingle()
    if (byNum) return { id: Number(byNum.id), table_number: Number(byNum.table_number) }
    return { id: n, table_number: n }
  }

  const { data: byCode } = await supabase
    .from("restaurant_tables")
    .select("id,table_number")
    .eq("table_code", ref)
    .maybeSingle()
  if (byCode) return { id: Number(byCode.id), table_number: Number(byCode.table_number) }

  return null
}
