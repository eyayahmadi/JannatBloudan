import { test, expect } from "@playwright/test"

/** Pages publiques : doivent répondre sans erreur serveur. */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/menu",
  "/events",
  "/reservation",
  "/403",
  "/table/1/menu",
]

for (const path of PUBLIC_PATHS) {
  test(`public: ${path} charge`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: "domcontentloaded" })
    expect(res, `HTTP ${path}`).not.toBeNull()
    expect(res!.status(), path).toBeLessThan(500)
    await expect(page.locator("body")).toBeVisible()
  })
}

test("sans session : /admin redirige vers login", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" })
  await expect(page).toHaveURL(/\/login/, { timeout: 45_000 })
})

const PROTECTED_STAFF = [
  "/caisse",
  "/kitchen/orders",
  "/bar/orders",
  "/shisha/orders",
  "/server/tables",
  "/delivery/dashboard",
  "/pos",
]

/** /driver est public (pas de RequireAuth) — smoke séparé. */
test("public: /driver charge", async ({ page }) => {
  const res = await page.goto("/driver", { waitUntil: "domcontentloaded" })
  expect(res!.status()).toBeLessThan(500)
  await expect(page.locator("body")).toBeVisible()
})

for (const path of PROTECTED_STAFF) {
  test(`sans session : ${path} → login`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/\/login/, { timeout: 45_000 })
  })
}
