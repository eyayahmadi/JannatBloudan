/**
 * Plan réel des 66 tables — Jannat Bloudan.
 * Source de vérité partagée par la migration SQL, le seed Node et l'admin.
 */

export type JannatZone = "terrasse" | "nofra" | "central"

export type JannatTableDef = {
  id: number
  table_number: number
  table_code: string
  display_name: string
  label: string
  zone: JannatZone
  plan_zone: JannatZone
  capacity: number
  status: "FREE"
  is_active: true
  position_x: number
  position_y: number
}

export const JANNAT_ZONE_LABELS: Record<JannatZone, string> = {
  terrasse: "Terrasse",
  nofra: "Salle fermée / Nofra",
  central: "Salle centrale / espace enfants",
}

export const JANNAT_SITE_URL = "https://jannat-bloudan.vercel.app"

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function gridPosition(index: number, cols: number): { position_x: number; position_y: number } {
  return {
    position_x: index % cols,
    position_y: Math.floor(index / cols),
  }
}

function terrasseTables(): JannatTableDef[] {
  const out: JannatTableDef[] = []
  let seq = 1
  const push = (capacity: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const code = `T${pad2(seq)}`
      const pos = gridPosition(seq - 1, 8)
      out.push({
        id: seq,
        table_number: seq,
        table_code: code,
        display_name: `Terrasse ${code}`,
        label: `Table ${code}`,
        zone: "terrasse",
        plan_zone: "terrasse",
        capacity,
        status: "FREE",
        is_active: true,
        ...pos,
      })
      seq++
    }
  }
  push(2, 14) // T01–T14
  push(4, 20) // T15–T34
  push(6, 6) // T35–T40
  return out
}

function nofraTables(startId: number): JannatTableDef[] {
  const out: JannatTableDef[] = []
  let seq = 1
  const push = (capacity: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const code = `N${pad2(seq)}`
      const id = startId + seq - 1
      const pos = gridPosition(seq - 1, 4)
      out.push({
        id,
        table_number: id,
        table_code: code,
        display_name: `Nofra ${code}`,
        label: `Table ${code}`,
        zone: "nofra",
        plan_zone: "nofra",
        capacity,
        status: "FREE",
        is_active: true,
        ...pos,
      })
      seq++
    }
  }
  push(4, 8) // N01–N08
  push(6, 6) // N09–N14
  return out
}

function centralTables(startId: number): JannatTableDef[] {
  const out: JannatTableDef[] = []
  let seq = 1
  const specs: Array<{ capacity: number; count: number }> = [
    { capacity: 6, count: 2 },
    { capacity: 4, count: 7 },
    { capacity: 10, count: 1 },
  ]
  for (const { capacity, count } of specs) {
    for (let i = 0; i < count; i++) {
      const code = `C${pad2(seq)}`
      const id = startId + seq - 1
      const pos = gridPosition(seq - 1, 4)
      out.push({
        id,
        table_number: id,
        table_code: code,
        display_name: `Salle centrale ${code}`,
        label: `Table ${code}`,
        zone: "central",
        plan_zone: "central",
        capacity,
        status: "FREE",
        is_active: true,
        ...pos,
      })
      seq++
    }
  }
  return out
}

/** Tables ajoutées après le plan initial (ids 65+) — sans décaler les existantes. */
function extraTables(): JannatTableDef[] {
  return [
    {
      id: 65,
      table_number: 65,
      table_code: "T41",
      display_name: "Terrasse T41",
      label: "Table T41",
      zone: "terrasse",
      plan_zone: "terrasse",
      capacity: 6,
      status: "FREE",
      is_active: true,
      position_x: 0,
      position_y: 5,
    },
    {
      id: 66,
      table_number: 66,
      table_code: "N15",
      display_name: "Nofra N15",
      label: "Table N15",
      zone: "nofra",
      plan_zone: "nofra",
      capacity: 6,
      status: "FREE",
      is_active: true,
      position_x: 3,
      position_y: 3,
    },
  ]
}

export function buildJannatTables(): JannatTableDef[] {
  const terrasse = terrasseTables()
  const nofra = nofraTables(terrasse.length + 1)
  const central = centralTables(terrasse.length + nofra.length + 1)
  return [...terrasse, ...nofra, ...central, ...extraTables()]
}

export const JANNAT_TABLES: JannatTableDef[] = buildJannatTables()

export const JANNAT_TABLE_COUNT = JANNAT_TABLES.length

export function menuQrUrl(tableCode: string, siteUrl = JANNAT_SITE_URL): string {
  const base = siteUrl.replace(/\/$/, "")
  return `${base}/table/${encodeURIComponent(tableCode)}/menu`
}
