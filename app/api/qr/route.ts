import { NextResponse } from "next/server"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

const tables = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  number: i + 1,
  zone: i < 5 ? "interieur" : i < 10 ? "terrasse" : i < 15 ? "vip" : "gaming",
}))

export async function GET() {
  const data = tables.map((t) => ({
    ...t,
    url: `${SITE_URL}/table/${t.id}`,
    qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${SITE_URL}/table/${t.id}`)}`,
  }))
  return NextResponse.json({ tables: data })
}
