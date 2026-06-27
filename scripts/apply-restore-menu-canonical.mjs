#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __dirname = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(__dirname, "56-restore-menu-canonical.sql"), "utf8")
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await db.connect()
console.log("Applying 56-restore-menu-canonical.sql …")
await db.query(sql)
console.log("Done.")
await db.end()
