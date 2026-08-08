import { test, expect } from "@playwright/test"
import { assertNoHorizontalOverflow, MOBILE_VIEWPORTS } from "./mobile-helpers"

const PHONE_VIEWPORTS = MOBILE_VIEWPORTS.filter((v) => v.width <= 430)

for (const vp of PHONE_VIEWPORTS) {
  test.describe(`${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    })

    test("table menu keeps scroll during polling", async ({ page }) => {
      await page.goto("/table/T01/menu", { waitUntil: "domcontentloaded" })
      await page.waitForSelector("[data-menu-product-id]", { timeout: 60_000 })
      await assertNoHorizontalOverflow(page)

      await page.evaluate(() => {
        document.documentElement.classList.add("menu-stable-scroll")
        window.scrollTo({ top: Math.min(2800, document.body.scrollHeight - 400), behavior: "instant" as ScrollBehavior })
      })
      await page.waitForTimeout(600)

      const before = await page.evaluate(() => window.scrollY)
      expect(before).toBeGreaterThan(400)

      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(500)
        await page.evaluate(() => window.scrollBy({ top: 80, behavior: "instant" as ScrollBehavior }))
        await page.waitForTimeout(200)
      }

      const after = await page.evaluate(() => window.scrollY)
      expect(after).toBeGreaterThan(400)
      expect(Math.abs(after - before)).toBeLessThan(500)
    })

    test("public menu keeps scroll during polling", async ({ page }) => {
      await page.goto("/menu", { waitUntil: "domcontentloaded" })
      await page.waitForSelector("[data-menu-product-id]", { timeout: 60_000 })
      await assertNoHorizontalOverflow(page)

      await page.evaluate(() => {
        window.scrollTo({ top: Math.min(2400, document.body.scrollHeight - 400), behavior: "instant" as ScrollBehavior })
      })
      await page.waitForTimeout(600)

      const before = await page.evaluate(() => window.scrollY)
      expect(before).toBeGreaterThan(300)

      for (let i = 0; i < 3; i++) {
        await page.waitForTimeout(600)
        await page.evaluate(() => window.scrollBy({ top: 60, behavior: "instant" as ScrollBehavior }))
      }

      const after = await page.evaluate(() => window.scrollY)
      expect(after).toBeGreaterThan(300)
      expect(Math.abs(after - before)).toBeLessThan(500)
    })
  })
}
