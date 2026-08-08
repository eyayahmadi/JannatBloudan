import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"

/** Assert no horizontal overflow — core mobile acceptance check. */
export async function assertNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)
}

/** Body is scrollable (not frozen by a stale scroll lock). */
export async function assertBodyScrollable(page: Page) {
  const state = await page.evaluate(() => ({
    bodyPosition: document.body.style.position,
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: window.innerHeight,
  }))
  expect(state.bodyPosition).not.toBe("fixed")
  if (state.scrollHeight > state.clientHeight + 40) {
    const before = await page.evaluate(() => window.scrollY)
    await page.evaluate(() => window.scrollBy({ top: 120, behavior: "instant" as ScrollBehavior }))
    await page.waitForTimeout(150)
    const after = await page.evaluate(() => window.scrollY)
    expect(after).toBeGreaterThan(before)
  }
}

/** Scroll position restored after closing an overlay. */
export async function assertScrollRestored(page: Page, expectedY: number, tolerance = 80) {
  const y = await page.evaluate(() => window.scrollY)
  expect(Math.abs(y - expectedY)).toBeLessThanOrEqual(tolerance)
}

export const MOBILE_VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 14", width: 390, height: 844 },
  { name: "iPhone 14 Pro Max", width: 430, height: 932 },
  { name: "Galaxy S21", width: 360, height: 800 },
  { name: "Pixel 7", width: 412, height: 915 },
  { name: "small iPhone", width: 320, height: 568 },
  { name: "iPad portrait", width: 768, height: 1024 },
] as const
