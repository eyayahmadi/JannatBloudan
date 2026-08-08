import { test, expect } from "@playwright/test"
import {
  assertBodyScrollable,
  assertNoHorizontalOverflow,
  assertScrollRestored,
  MOBILE_VIEWPORTS,
} from "./mobile-helpers"

for (const vp of MOBILE_VIEWPORTS) {
  test.describe(`Mobile ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
    })

    test("homepage — no horizontal overflow, vertical scroll works", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" })
      await assertNoHorizontalOverflow(page)
      await assertBodyScrollable(page)
    })

    test("public menu — no overflow, scroll preserved during poll window", async ({ page }) => {
      await page.goto("/menu", { waitUntil: "domcontentloaded" })
      await page.waitForSelector("[data-menu-product-id]", { timeout: 60_000 })
      await assertNoHorizontalOverflow(page)

      await page.evaluate(() => {
        window.scrollTo({ top: Math.min(2000, document.body.scrollHeight - 300), behavior: "instant" as ScrollBehavior })
      })
      await page.waitForTimeout(400)
      const before = await page.evaluate(() => window.scrollY)
      expect(before).toBeGreaterThan(200)

      await page.waitForTimeout(800)
      await assertNoHorizontalOverflow(page)
      const after = await page.evaluate(() => window.scrollY)
      expect(Math.abs(after - before)).toBeLessThan(120)
    })

    test("QR table menu — no overflow, category drawer restores scroll", async ({ page }) => {
      await page.goto("/table/T01/menu", { waitUntil: "domcontentloaded" })
      await page.waitForSelector("[data-menu-product-id]", { timeout: 60_000 })
      await assertNoHorizontalOverflow(page)

      await page.evaluate(() => {
        document.documentElement.classList.add("menu-stable-scroll")
        window.scrollTo({ top: Math.min(1800, document.body.scrollHeight - 320), behavior: "instant" as ScrollBehavior })
      })
      await page.waitForTimeout(300)
      const scrollBefore = await page.evaluate(() => window.scrollY)
      expect(scrollBefore).toBeGreaterThan(200)

      const drawerTrigger = page.locator(".qr-categories-mobile-trigger button").first()
      if (await drawerTrigger.isVisible()) {
        await drawerTrigger.tap()
        await page.waitForTimeout(350)
        await assertNoHorizontalOverflow(page)

        const closeBtn = page.getByRole("button", { name: /back|zurück|menu/i }).first()
        if (await closeBtn.count()) {
          await closeBtn.tap()
        } else {
          await page.locator(".z-drawer-backdrop, [class*='bg-black/45']").first().tap({ force: true })
        }
        await page.waitForTimeout(350)
        await assertScrollRestored(page, scrollBefore)
        await assertBodyScrollable(page)
      }
    })

    test("QR table menu — product cards not clipped in grid", async ({ page }) => {
      await page.goto("/table/T01/menu", { waitUntil: "domcontentloaded" })
      await page.waitForSelector(".menu-product-grid [data-menu-product-id]", { timeout: 60_000 })

      const clipped = await page.evaluate(() => {
        const cards = document.querySelectorAll(".menu-product-grid [data-menu-product-id]")
        let bad = 0
        cards.forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.width <= 0 || r.right > window.innerWidth + 2) bad += 1
        })
        return bad
      })
      expect(clipped).toBe(0)
    })

    test("reservation page — no horizontal overflow", async ({ page }) => {
      await page.goto("/reservation", { waitUntil: "domcontentloaded" })
      await assertNoHorizontalOverflow(page)
    })

    test("delivery page — no horizontal overflow", async ({ page }) => {
      await page.goto("/delivery", { waitUntil: "domcontentloaded" })
      await assertNoHorizontalOverflow(page)
    })
  })
}

test.describe("Mobile scroll lock unit (in-page)", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test("body scroll lock releases after navigation", async ({ page }) => {
    await page.goto("/menu", { waitUntil: "domcontentloaded" })
    await page.waitForSelector("[data-menu-product-id]", { timeout: 60_000 })
    await page.evaluate(() => window.scrollTo(0, 500))
    const before = await page.evaluate(() => window.scrollY)

    await page.goto("/", { waitUntil: "domcontentloaded" })
    await assertBodyScrollable(page)
    const fixed = await page.evaluate(() => document.body.style.position === "fixed")
    expect(fixed).toBe(false)
    expect(before).toBeGreaterThan(0)
  })
})
