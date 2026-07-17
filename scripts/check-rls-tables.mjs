#!/usr/bin/env node
import pg from "pg"

const { Client } = pg.default ?? pg
const client = new Client({ connectionString: process.env.DATABASE_URL })

await client.connect()
const { rows } = await client.query(`
  SELECT c.relname AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT c.relrowsecurity
  ORDER BY 1
`)
console.log(`Tables sans RLS (${rows.length}):`)
for (const row of rows) console.log(` - ${row.table_name}`)
await client.end()
