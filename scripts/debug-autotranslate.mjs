import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1024, height: 900 },
  locale: 'en-US',
})
const page = await ctx.newPage()

await page.addInitScript(() => {
  try { window.localStorage.setItem('app_locale', 'en') } catch {}
})

const calls = []
page.on('request', (req) => {
  const u = req.url()
  if (u.includes('/api/translate-page') || u.includes('/api/translate')) {
    calls.push({ method: req.method(), url: u })
  }
})

await page.goto('http://localhost:3000/table/t1', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(8000)

const state = await page.evaluate(() => ({
  storedLocale: localStorage.getItem('app_locale'),
  htmlLang: document.documentElement.lang,
  htmlDir: document.documentElement.dir,
  bodyText: document.body.innerText.slice(0, 400),
  hasAutoTranslate: !!document.querySelector('[data-autotranslate-mounted]'),
  i18nCache: localStorage.getItem('i18n_mt_ui_v1_en'),
}))

console.log('--- requests ---')
console.log(JSON.stringify(calls, null, 2))
console.log('--- state ---')
console.log(JSON.stringify(state, null, 2))

await browser.close()
