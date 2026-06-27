import { test, expect } from "@playwright/test"

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
})

test("table menu keeps scroll position during silent polling on mobile", async ({ page }) => {
  await page.goto("/table/T01/menu", { waitUntil: "networkidle" })
  await page.waitForSelector("[data-menu-product-id]", { timeout: 60_000 })

  await page.evaluate(() => window.scrollTo({ top: 2800, behavior: "instant" as ScrollBehavior }))
  await page.waitForTimeout(800)

  const before = await page.evaluate(() => window.scrollY)
  expect(before).toBeGreaterThan(1200)

  // Silent menu poll runs every 20s — wait through two cycles while scrolling slowly.
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(5000)
    await page.evaluate((y) => window.scrollBy({ top: 120, behavior: "instant" as ScrollBehavior }), 0)
    await page.waitForTimeout(300)
  }

  const after = await page.evaluate(() => window.scrollY)
  expect(after).toBeGreaterThan(1200)
  expect(Math.abs(after - before)).toBeLessThan(400)
})
