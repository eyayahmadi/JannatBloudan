#!/usr/bin/env node
/**
 * RAG Ingestion — embed client data into `client_memory_embeddings`
 * -----------------------------------------------------------------
 * Parcourt les tables pertinentes (orders, reviews, client_memory, event_requests)
 * et cree des embeddings OpenAI qui sont stockes dans `client_memory_embeddings`
 * pour la recherche vectorielle (RAG) via la fonction `match_client_memory(...)`.
 *
 * Prerequis:
 *   - Migration 08 appliquee (pgvector + client_memory_embeddings + match_client_memory)
 *   - Variables d'environnement :
 *       SUPABASE_URL
 *       SUPABASE_SERVICE_ROLE_KEY  (ou SUPABASE_ANON_KEY pour test - mais service role recommande)
 *       OPENAI_API_KEY             (cle d'embeddings, modele text-embedding-3-small)
 *       OPENAI_EMBEDDING_MODEL     (optionnel, defaut text-embedding-3-small, dim 1536)
 *
 * Usage:
 *   node scripts/ingest-embeddings.mjs                 # ingest toutes les sources
 *   node scripts/ingest-embeddings.mjs --source orders # uniquement commandes
 *   node scripts/ingest-embeddings.mjs --limit 50      # limite a 50 documents par source
 *   node scripts/ingest-embeddings.mjs --dry-run       # montre sans ecrire
 *
 * Idempotent : chaque document a un source_type + source_id unique (UPSERT).
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_API_KEY
const OPENAI_BASE = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")
const EMBED_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"
// text-embedding-3-small -> 1536 dims (match notre schema)

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
if (!OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY")
  process.exit(1)
}

const args = process.argv.slice(2)
const sourceArg = args.includes("--source") ? args[args.indexOf("--source") + 1] : null
const limitArg = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : 100
const dryRun = args.includes("--dry-run")

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/**
 * Appelle l'API OpenAI embeddings. Retourne l'embedding (array 1536 floats).
 */
async function embed(text) {
  const res = await fetch(`${OPENAI_BASE}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: text,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI embed failed ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.data[0].embedding
}

/**
 * Upsert un document dans client_memory_embeddings.
 * L'embedding est stocke sous forme de string vector '[0.1,0.2,...]'
 */
async function upsertMemory({ userId, sourceType, sourceId, content, embedding, metadata }) {
  if (dryRun) {
    console.log(`  [dry-run] ${sourceType}:${sourceId} -> ${content.slice(0, 60)}...`)
    return
  }

  const vectorString = `[${embedding.join(",")}]`

  // Supabase Postgres ne supporte pas nativement le type 'vector' depuis le SDK,
  // mais il accepte la string format '[...]' quand le typecast est explicite cote SQL.
  // Ici on utilise l'insert direct — le driver va caster en texte et pg va le convertir.
  const { error } = await supabase
    .from("client_memory_embeddings")
    .upsert(
      {
        user_id: userId,
        source_type: sourceType,
        source_id: sourceId,
        content: content.slice(0, 5000),
        embedding: vectorString,
        metadata: metadata || {},
        embedded_at: new Date().toISOString(),
      },
      { onConflict: "source_type,source_id" },
    )

  if (error) {
    console.warn(`  ⚠️ upsert ${sourceType}:${sourceId} ->`, error.message)
  }
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

async function ingestOrders(limit) {
  console.log(`\n📦 Ingesting orders (limit=${limit})...`)
  const { data, error } = await supabase
    .from("orders")
    .select("id, user_id, total, created_at, status, order_items(quantity,product_name,products(name,description))")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.warn("  skipped (error):", error.message)
    return 0
  }

  let n = 0
  for (const order of data || []) {
    const items = (order.order_items || [])
      .map((it) => {
        const name = it.product_name || it.products?.name || "produit"
        return `${it.quantity}x ${name}`
      })
      .join(", ")

    const content = `Commande du ${new Date(order.created_at).toLocaleDateString("fr-FR")}: ${items}. Total: ${order.total}€. Statut: ${order.status}.`

    try {
      const vec = await embed(content)
      await upsertMemory({
        userId: order.user_id,
        sourceType: "order",
        sourceId: order.id,
        content,
        embedding: vec,
        metadata: { total: order.total, status: order.status },
      })
      n++
      if (n % 10 === 0) process.stdout.write(`  ${n}/${data.length}\r`)
    } catch (err) {
      console.warn(`  ⚠️ ${order.id}:`, err.message)
    }
  }
  console.log(`  ✅ ${n} commandes embedded`)
  return n
}

async function ingestReviews(limit) {
  console.log(`\n⭐ Ingesting reviews (limit=${limit})...`)
  const { data, error } = await supabase
    .from("reviews")
    .select("id, user_id, rating, comment, product_id, created_at, products(name)")
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.warn("  skipped (table missing?):", error.message)
    return 0
  }

  let n = 0
  for (const r of data || []) {
    if (!r.comment || r.comment.length < 10) continue
    const content = `Avis ${r.rating}★ sur ${r.products?.name || "produit"}: "${r.comment}"`
    try {
      const vec = await embed(content)
      await upsertMemory({
        userId: r.user_id,
        sourceType: "review",
        sourceId: r.id,
        content,
        embedding: vec,
        metadata: { rating: r.rating, product_id: r.product_id },
      })
      n++
    } catch (err) {
      console.warn(`  ⚠️`, err.message)
    }
  }
  console.log(`  ✅ ${n} avis embedded`)
  return n
}

async function ingestClientMemory(limit) {
  console.log(`\n🧠 Ingesting client_memory notes (limit=${limit})...`)
  const { data, error } = await supabase
    .from("client_memory")
    .select("id, user_id, type, content, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.warn("  skipped:", error.message)
    return 0
  }

  let n = 0
  for (const m of data || []) {
    const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content)
    if (!text || text.length < 5) continue
    try {
      const vec = await embed(text)
      await upsertMemory({
        userId: m.user_id,
        sourceType: `memory_${m.type || "note"}`,
        sourceId: m.id,
        content: text,
        embedding: vec,
        metadata: { type: m.type },
      })
      n++
    } catch (err) {
      console.warn(`  ⚠️`, err.message)
    }
  }
  console.log(`  ✅ ${n} memory notes embedded`)
  return n
}

async function ingestEventRequests(limit) {
  console.log(`\n🎉 Ingesting event_requests (limit=${limit})...`)
  const { data, error } = await supabase
    .from("event_requests")
    .select("id, user_id, guest_name, event_type, event_date, guests_count, special_requests, estimated_budget")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.warn("  skipped:", error.message)
    return 0
  }

  let n = 0
  for (const e of data || []) {
    const content = `Demande d'evenement prive (${e.event_type}) pour ${e.guests_count} invites le ${e.event_date}. Client: ${e.guest_name}. Budget: ${e.estimated_budget ?? "?"}€. Demandes: ${e.special_requests || "aucune"}.`
    try {
      const vec = await embed(content)
      await upsertMemory({
        userId: e.user_id,
        sourceType: "event_request",
        sourceId: e.id,
        content,
        embedding: vec,
        metadata: {
          event_type: e.event_type,
          guests_count: e.guests_count,
          budget: e.estimated_budget,
        },
      })
      n++
    } catch (err) {
      console.warn(`  ⚠️`, err.message)
    }
  }
  console.log(`  ✅ ${n} event requests embedded`)
  return n
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("═══════════════════════════════════════════════════════")
  console.log("🧠 RAG Ingestion — client_memory_embeddings")
  console.log("═══════════════════════════════════════════════════════")
  console.log(`Supabase: ${SUPABASE_URL}`)
  console.log(`Model:    ${EMBED_MODEL} (1536 dims)`)
  console.log(`Source:   ${sourceArg || "all"}`)
  console.log(`Limit:    ${limitArg} per source`)
  console.log(`Mode:     ${dryRun ? "dry-run (no writes)" : "live"}`)
  console.log("───────────────────────────────────────────────────────")

  const sources = sourceArg ? [sourceArg] : ["orders", "reviews", "memory", "events"]
  let total = 0

  for (const src of sources) {
    try {
      if (src === "orders") total += await ingestOrders(limitArg)
      else if (src === "reviews") total += await ingestReviews(limitArg)
      else if (src === "memory") total += await ingestClientMemory(limitArg)
      else if (src === "events") total += await ingestEventRequests(limitArg)
      else console.warn(`  ⚠️ unknown source: ${src}`)
    } catch (err) {
      console.error(`❌ source ${src} failed:`, err.message)
    }
  }

  console.log("\n═══════════════════════════════════════════════════════")
  console.log(`✅ ${total} documents embedded total`)
  console.log("───────────────────────────────────────────────────────")
  console.log("💡 Test the RAG from SQL:")
  console.log("   SELECT * FROM match_client_memory(")
  console.log("     (SELECT embedding FROM client_memory_embeddings LIMIT 1),")
  console.log("     0.7,  -- similarity threshold")
  console.log("     5     -- top-k")
  console.log("   );")
  console.log("═══════════════════════════════════════════════════════")
}

main().catch((err) => {
  console.error("💥 Fatal:", err)
  process.exit(1)
})
