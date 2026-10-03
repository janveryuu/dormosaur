import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync, rmdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

// Run against the real Alarms page/provider/styles with isolated browser data.
// Set PLAYWRIGHT_MODULE_PATH when using a bundled Playwright installation.
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright')
const fixtureDir = resolve('app/(main)/lead-picker-qa')
const fixturePage = resolve(fixtureDir, 'page.tsx')
assert.ok(!existsSync(fixtureDir), 'QA route must not replace an existing route')
mkdirSync(fixtureDir)
writeFileSync(fixturePage, "export { default } from '../alarms/page'\n")
const port = 4173
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--port', String(port)], { stdio: 'ignore', windowsHide: true })
let browser
const alarms = [
  { id: 'qa-first', subject: 'Physics for Engineers 2 (Wednesday)', time: '10:00' },
  { id: 'qa-middle', subject: 'Industrial Organization and Management with Advanced Engineering Laboratory Applications', time: '13:30' },
  { id: 'qa-last', subject: 'Statistical Analysis for Industrial Engineering 1', time: '17:00' },
].map((alarm, index) => ({ ...alarm, classId: `qa-class-${index}`, code: `QA ${index}`, day: 'Today', color: index + 1, lead: 30, enabled: true }))
try {
  let ready = false
  for (let attempt = 0; attempt < 90; attempt++) {
    if (server.exitCode !== null) throw new Error('QA server exited before startup')
    try { ready = (await fetch(`http://localhost:${port}/lead-picker-qa`)).ok } catch {}
    if (ready) break
    await new Promise((resolveWait) => setTimeout(resolveWait, 500))
  }
  assert.ok(ready, 'QA server did not become ready')
  browser = await chromium.launch({ headless: true, ...(process.env.QA_BROWSER_EXECUTABLE ? { executablePath: process.env.QA_BROWSER_EXECUTABLE } : { channel: 'chrome' }) })
  for (const width of [375, 390, 414, 430, 768, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } })
    await page.route('**/api/alarms/smart-nudge', (route) => route.fulfill({ json: { nudge: 'Test reminder' } }))
    await page.addInitScript((data) => {
      localStorage.setItem('dormosaur_alarms_v1', JSON.stringify(data))
      localStorage.setItem('dormosaur_classes_v1', JSON.stringify(data.map((alarm) => ({ id: alarm.classId, subject: alarm.subject, room: 'QA Room', days: ['Mon'], start: alarm.time, end: '18:00', color: alarm.color }))))
    }, alarms)
    await page.goto(`http://localhost:${port}/lead-picker-qa`, { waitUntil: 'networkidle' })
    const rows = page.locator('.alarm-row')
    await rows.nth(2).waitFor()
    for (const index of [0, 1, 2]) {
      const row = rows.nth(index)
      const trigger = row.getByRole('button', { name: `${alarms[index].subject} lead time`, exact: true })
      const before = await row.boundingBox()
      await trigger.click()
      const menu = row.getByRole('listbox')
      await menu.waitFor()
      await page.waitForTimeout(600)
      const expanded = await row.boundingBox()
      const menuBox = await menu.boundingBox()
      assert.ok(expanded.height > before.height + 80, `${width}px row ${index}: picker must expand the alarm row`)
      assert.ok(menuBox.y >= expanded.y && menuBox.y + menuBox.height <= expanded.y + expanded.height + 1, 'Menu must stay inside its own row')
      if (index < 2) {
        const next = await rows.nth(index + 1).boundingBox()
        assert.ok(menuBox.y + menuBox.height <= next.y, 'Picker must push down the next alarm')
      }
      assert.ok(menuBox.x >= 0 && menuBox.x + menuBox.width <= width, 'Options must fit the viewport')
      const textGeometry = await row.evaluate((element) => {
        const subject = [...element.querySelectorAll('p')].find((p) => p.textContent.includes('Engineering') || p.textContent.includes('Engineers'))
        const title = subject.getBoundingClientRect()
        const menu = element.querySelector('[role=listbox]').getBoundingClientRect()
        return { fits: subject.scrollWidth <= subject.clientWidth + 1, overlap: title.left < menu.right && title.right > menu.left && title.top < menu.bottom && title.bottom > menu.top }
      })
      assert.ok(textGeometry.fits && !textGeometry.overlap, 'Long subject must remain readable')
      for (const lead of [15, 30, 60]) {
        if (await trigger.getAttribute('aria-expanded') !== 'true') await trigger.click()
        await row.getByRole('option', { name: `${lead} min before`, exact: true }).click()
        await page.waitForTimeout(600)
        assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
        assert.ok((await trigger.innerText()).includes(`${lead} min`))
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dormosaur_alarms_v1')))
        assert.equal(saved[index].lead, lead)
        assert.equal(saved[index].time, alarms[index].time)
        assert.equal(saved[index].enabled, true)
        const [hour, minute] = alarms[index].time.split(':').map(Number)
        const format = (total) => `${Math.floor(total / 60) % 12 || 12}:${String(total % 60).padStart(2, '0')} ${total >= 720 ? 'PM' : 'AM'}`
        const times = row.locator('p').filter({ hasText: /^Class / })
        assert.ok(await times.isVisible(), 'Class and ring times must remain visible')
        assert.equal(await times.innerText(), `Class ${format(hour * 60 + minute)} · Rings ${format(hour * 60 + minute - lead)}`)
      }
      await trigger.click()
      await page.keyboard.press('Escape')
      await page.waitForTimeout(600)
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
      await trigger.click()
      await page.getByRole('heading', { level: 1 }).first().click()
      await page.waitForTimeout(600)
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
    }
    await rows.nth(0).getByRole('button', { name: `${alarms[0].subject} lead time`, exact: true }).click()
    await rows.nth(1).getByRole('button', { name: `${alarms[1].subject} lead time`, exact: true }).click()
    await page.waitForTimeout(600)
    assert.equal(await page.getByRole('listbox').count(), 1, 'Only one picker may remain open')
    const firstTrigger = rows.nth(0).getByRole('button', { name: `${alarms[0].subject} lead time`, exact: true })
    await firstTrigger.focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(600)
    assert.equal(await page.getByRole('listbox').count(), 1, 'Keyboard opening must close the other picker')
    assert.equal(await firstTrigger.getAttribute('aria-expanded'), 'true')
    await page.screenshot({ path: `scratch/lead-picker-${width}.png`, fullPage: true })
    console.log(`PASS ${width}px: first/middle/last, all leads, saved values, outside/Escape, one open picker, no overlap`)
    await page.close()
  }
} finally {
  if (browser) await browser.close()
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true })
  else server.kill('SIGTERM')
  unlinkSync(fixturePage)
  rmdirSync(fixtureDir)
  // Remove generated references to the temporary route so later typechecks
  // never import a QA page that has already been cleaned up.
  for (const name of ['validator.ts', 'routes.d.ts']) {
    const generated = resolve('.next/dev/types', name)
    if (existsSync(generated) && readFileSync(generated, 'utf8').includes('/lead-picker-qa')) unlinkSync(generated)
  }
}
