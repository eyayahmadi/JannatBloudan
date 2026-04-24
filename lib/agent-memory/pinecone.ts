/**
 * Point d'extension Vector DB (Pinecone / Weaviate / pgvector).
 * Sans cle API : le RAG utilise le retrieval lexical dans `store.ts`.
 */
export function isVectorDbConfigured(): boolean {
  return Boolean(process.env.PINECONE_API_KEY?.trim() || process.env.WEAVIATE_URL?.trim())
}

export function vectorBackendLabel(): "lexical" | "pinecone" | "weaviate" {
  if (process.env.PINECONE_API_KEY?.trim()) return "pinecone"
  if (process.env.WEAVIATE_URL?.trim()) return "weaviate"
  return "lexical"
}
