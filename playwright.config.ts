import { defineConfig, devices } from "@playwright/test"

const envWorkerCount = process.env.PLAYWRIGHT_WORKERS
  ? Number(process.env.PLAYWRIGHT_WORKERS)
  : NaN
const resolvedWorkers =
  Number.isFinite(envWorkerCount) && envWorkerCount > 0
    ? Math.floor(envWorkerCount)
    : process.env.CI
      ? 1
      : 2

/**
 * Tests E2E — chemins, redirections auth, smoke UI.
 *
 * Lancer :
 *   npm run test:e2e
 *
 * Serveur : démarrage auto (`npm run dev`) sauf si CI ou si vous avez déjà un serveur
 * (PLAYWRIGHT_REUSE_SERVER=1). URL : PLAYWRIGHT_BASE_URL (défaut http://localhost:3000).
 * Parallélisme : PLAYWRIGHT_WORKERS (sinon 2 en local, 1 en CI) — évite de saturer `next dev`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  /** Next dev + high parallelism → navigation timeouts; default 2 locally / 1 in CI. */
  workers: resolvedWorkers,
  reporter: process.env.CI ? "github" : "list",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    navigationTimeout: 75_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_REUSE_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 180_000,
      },
})
