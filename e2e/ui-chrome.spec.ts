import { test, expect } from "@playwright/test"

test("accueil : layout principal visible", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.locator("header, [role=banner]").first()).toBeVisible({ timeout: 20_000 })
})

test("login : formulaire e-mail / mot de passe", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("textbox", { name: /e-mail|email/i }).or(page.locator('input[type="email"]')).first()).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.locator('input[type="password"]').first()).toBeVisible()
})

test("signup : lien ou formulaire présent", async ({ page }) => {
  await page.goto("/signup", { waitUntil: "domcontentloaded" })
  await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 15_000 })
})

test("menu public : page charge", async ({ page }) => {
  await page.goto("/menu", { waitUntil: "domcontentloaded" })
  await expect(page.locator("body")).toBeVisible()
})
