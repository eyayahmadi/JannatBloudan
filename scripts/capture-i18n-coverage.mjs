import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const outDir = join(process.cwd(), 'qr-i18n')
mkdirSync(outDir, { recursive: true })

const BASE = process.env.CAPTURE_BASE_URL ?? 'http://localhost:3001'
const targets = [
  { url: `${BASE}/table/t1`, name: 'table' },
  { url: `${BASE}/menu`, name: 'menu' },
  { url: `${BASE}/reservation`, name: 'reservation' },
]
const locales = ['fr', 'en', 'de', 'ar']

const browser = await chromium.launch()

for (const target of targets) {
  for (const loc of locales) {
    const ctx = await browser.newContext({
      viewport: { width: 1024, height: 1400 },
      locale: loc === 'ar' ? 'ar-TN' : loc,
    })
    const page = await ctx.newPage()
    await page.addInitScript((target) => {
      try {
        window.localStorage.setItem('app_locale', target)
      } catch {}
    }, loc)

    console.log(`→ ${target.name} (${loc})`)
    await page.goto(target.url, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(loc === 'fr' ? 1500 : 7000)
    await page.screenshot({
      path: join(outDir, `${target.name}-${loc}.png`),
      clip: { x: 0, y: 0, width: 1024, height: 1100 },
    })
    await ctx.close()
  }
}

await browser.close()
console.log('✓ saved screenshots in', outDir)
