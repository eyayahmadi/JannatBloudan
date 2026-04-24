import { NextResponse } from "next/server"

import { getClientMemory, recordOrderSummary } from "@/lib/agent-memory/store"
import { vectorBackendLabel } from "@/lib/agent-memory/pinecone"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientKey = searchParams.get("clientKey")?.trim()
  if (!clientKey) {
    return NextResponse.json({ error: "clientKey requis" }, { status: 400 })
  }
  const mem = await getClientMemory(clientKey)
  return NextResponse.json({
    memory: mem,
    ragBackend: vectorBackendLabel(),
    generatedAt: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { clientKey?: string; orderSummary?: string }
    const clientKey = body.clientKey?.trim()
    if (!clientKey) {
      return NextResponse.json({ error: "clientKey requis" }, { status: 400 })
    }
    if (body.orderSummary?.trim()) {
      const mem = await recordOrderSummary(clientKey, body.orderSummary.trim())
      return NextResponse.json({ ok: true, memory: mem })
    }
    const mem = await getClientMemory(clientKey)
    return NextResponse.json({ ok: true, memory: mem })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
