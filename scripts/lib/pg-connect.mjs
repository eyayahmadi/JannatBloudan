/**
 * Resolve Postgres client config for Supabase (pooler + direct fallbacks).
 */
function parseProjectRef(supabaseUrl) {
  const m = String(supabaseUrl ?? "").match(/https:\/\/([^.]+)\.supabase\.co/i)
  return m?.[1] ?? null
}

function parsePoolerHost(databaseUrl) {
  const m = String(databaseUrl ?? "").match(/@([^:/]+)/)
  return m?.[1] ?? null
}

function baseSsl() {
  return { rejectUnauthorized: false }
}

/**
 * @returns {Array<{ label: string, config: import("pg").ClientConfig }>}
 */
export function buildPgConnectionCandidates(env = process.env) {
  const password = env.SUPABASE_DB_PASSWORD?.trim()
  const ref = parseProjectRef(env.NEXT_PUBLIC_SUPABASE_URL)
  const databaseUrl = env.DATABASE_URL?.trim()
  const poolerHost =
    env.SUPABASE_POOLER_HOST?.trim() ||
    parsePoolerHost(databaseUrl) ||
    (ref ? "aws-1-eu-west-1.pooler.supabase.com" : null)

  /** @type {Array<{ label: string, config: import("pg").ClientConfig }>} */
  const candidates = []

  if (databaseUrl) {
    candidates.push({
      label: "DATABASE_URL",
      config: {
        connectionString: databaseUrl,
        ssl: baseSsl(),
        connectionTimeoutMillis: 15000,
      },
    })
  }

  if (password && ref && poolerHost) {
    const scopedUser = `postgres.${ref}`
    candidates.push({
      label: `session-pooler (${poolerHost}:5432)`,
      config: {
        host: poolerHost,
        port: 5432,
        user: scopedUser,
        password,
        database: "postgres",
        ssl: baseSsl(),
        connectionTimeoutMillis: 15000,
      },
    })
    candidates.push({
      label: `transaction-pooler (${poolerHost}:6543)`,
      config: {
        host: poolerHost,
        port: 6543,
        user: scopedUser,
        password,
        database: "postgres",
        ssl: baseSsl(),
        connectionTimeoutMillis: 15000,
        // Required for Supavisor transaction mode (port 6543)
        prepare: false,
      },
    })
  }

  if (password && ref) {
    candidates.push({
      label: `direct (db.${ref}.supabase.co:5432)`,
      config: {
        host: `db.${ref}.supabase.co`,
        port: 5432,
        user: "postgres",
        password,
        database: "postgres",
        ssl: baseSsl(),
        connectionTimeoutMillis: 15000,
      },
    })
  }

  return candidates
}

/**
 * @param {typeof import("pg")} pgModule
 */
export async function connectPgWithFallback(pgModule, env = process.env) {
  const { Client } = pgModule.default ?? pgModule
  const candidates = buildPgConnectionCandidates(env)
  if (candidates.length === 0) {
    throw new Error(
      "Aucune configuration Postgres trouvée. Définissez DATABASE_URL ou NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD.",
    )
  }

  const errors = []
  for (const { label, config } of candidates) {
    const client = new Client(config)
    try {
      await client.connect()
      return { client, label }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${label}: ${message}`)
      try {
        await client.end()
      } catch {
        /* ignore */
      }
    }
  }

  const hint = [
    "",
    "Le mot de passe peut être correct mais le pooler Supabase n'a pas encore synchronisé.",
    "Actions à essayer dans l'ordre :",
    "  1. Supabase Dashboard → Settings → General → Restart project",
    "  2. Attendre 2–3 minutes après le restart",
    "  3. Settings → Database → Connect → copier l'URI Session pooler (5432)",
    "  4. Relancer : npm run db:test-connection",
    "",
    "Si db.<ref>.supabase.co = ENOTFOUND : votre réseau est IPv4-only → utilisez le pooler, pas la connexion directe.",
  ].join("\n")

  throw new Error(`Connexion Postgres impossible :\n${errors.map((e) => `  • ${e}`).join("\n")}${hint}`)
}
