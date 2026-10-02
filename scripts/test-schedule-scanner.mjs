import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import vm from 'node:vm'
import ts from 'typescript'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
if (process.argv.includes('--trace')) {
  const files = JSON.parse(readFileSync('.next/server/app/api/schedule/parse/route.js.nft.json', 'utf8')).files
  for (const dependency of ['bmp-js', 'wasm-feature-detect', 'regenerator-runtime', 'is-url', 'tesseract.js-core', '@tesseract.js-data/eng']) {
    assert.ok(files.some((file) => file.includes(`/node_modules/${dependency}/`)), `Production tracing must include OCR worker dependency ${dependency}`)
  }
  assert.ok(files.some((file) => file.includes('worker-script/node/index.js')))
  assert.ok(files.some((file) => file.endsWith('eng.traineddata.gz')))
  assert.ok(files.some((file) => file.endsWith('/pdfjs-dist/package.json')), 'PDF runtime resolves its package root dynamically')
  console.log('PASS: production bundle includes worker-only dependencies, WASM and English OCR data')
  // Run a real worker from ONLY traced files. A normal local Next server can
  // accidentally resolve missing deployment dependencies from node_modules.
  const temporaryRoot = path.resolve(tmpdir())
  const isolatedRoot = mkdtempSync(path.join(temporaryRoot, 'dormosaur-ocr-bundle-'))
  let worker
  try {
    for (const file of files) {
      const source = path.resolve('.next/server/app/api/schedule/parse', file)
      if (!statSync(source).isFile()) continue
      const relative = path.relative(process.cwd(), source)
      if (relative.startsWith('..') || path.isAbsolute(relative)) continue
      const destination = path.join(isolatedRoot, relative)
      mkdirSync(path.dirname(destination), { recursive: true })
      copyFileSync(source, destination)
    }
    const isolatedRequire = createRequire(path.join(isolatedRoot, 'package.json'))
    const { createWorker, OEM } = isolatedRequire('tesseract.js')
    worker = await createWorker('eng', OEM.LSTM_ONLY, {
      workerPath: path.join(isolatedRoot, 'node_modules/tesseract.js/src/worker-script/node/index.js'),
      langPath: path.join(isolatedRoot, 'node_modules/@tesseract.js-data/eng/4.0.0'),
      cacheMethod: 'none', logger() {}, errorHandler() {},
    })
    const image = await require('sharp')(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="120"><rect width="900" height="120" fill="white"/><text x="25" y="75" font-family="Arial" font-size="40">CpE 408 Mon 08:00-09:00</text></svg>')).png().toBuffer()
    const { data } = await worker.recognize(image)
    assert.match(data.text, /408/)
    assert.match(data.text, /Mon/)
    console.log('PASS: real OCR worker runs successfully from the isolated deployment bundle')
    const pdfModule = loadTs('lib/schedule-pdf.ts', {}, { process: { cwd: () => isolatedRoot } })
    const { jsPDF } = require('jspdf')
    const fixturePdf = new jsPDF({ compress: true })
    fixturePdf.text('CpE 408 Mon 08:00-09:00', 25, 50)
    const pages = await pdfModule.renderSchedulePdf(Buffer.from(fixturePdf.output('arraybuffer')))
    const pdfOcr = await worker.recognize(pages[0])
    assert.match(pdfOcr.data.text, /408/)
    console.log('PASS: PDF rendering resolves worker and package assets from the isolated deployment bundle')
  } finally {
    await worker?.terminate()
    if (path.dirname(path.resolve(isolatedRoot)) !== temporaryRoot) throw new Error('Unexpected isolated bundle path')
    rmSync(isolatedRoot, { recursive: true, force: true })
  }
}
function loadTs(path, overrides = {}, globals = {}) {
  const exports = {}
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  vm.runInNewContext(code, {
    exports, require: (name) => overrides[name] ?? require(name),
    process, console, Buffer, URL, Uint8Array, setTimeout, clearTimeout, ...globals,
  }, { filename: path })
  return exports
}

let canvasCalls = 0
const imageUtils = loadTs('lib/image-utils.ts', {}, {
  window: {},
  FileReader: class { readAsDataURL(file) { this.onload({ target: { result: file.dataUrl } }) } },
  Image: class {
    width = 3000
    height = 1600
    set src(value) { this.onload() }
  },
  document: { createElement: () => {
    canvasCalls++
    return {
      getContext: () => ({ fillRect() {}, drawImage() {} }),
      toDataURL: () => 'data:image/jpeg;base64,changed',
    }
  } },
})
const original = 'data:image/png;base64,aGVsbG8='
assert.equal(await imageUtils.compressImageForOcr(original), original,
  'A reasonable 3000px PNG must reach Gemini unchanged')
assert.equal(canvasCalls, 0, 'Screenshots must not be unnecessarily re-encoded')
assert.equal(await imageUtils.compressImageForOcr({ dataUrl: original }), original)
console.log('PASS: original high-resolution PNG preserved')

const tinyPng = 'data:image/png;base64,' + Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64')
const tinyJpg = 'data:image/jpeg;base64,' + Buffer.from([255, 216, 255, 224]).toString('base64')
const tinyPdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n').toString('base64')
assert.equal(await imageUtils.compressImageForOcr(tinyJpg), tinyJpg)
assert.equal(await imageUtils.compressImageForOcr(tinyPdf), tinyPdf)
console.log('PASS: JPG and PDF preserved')

let encodedFormat
let encodedQuality
let resizedCanvas
const oversizedUtils = loadTs('lib/image-utils.ts', {}, {
  window: {},
  Image: class { width = 6000; height = 4000; set src(value) { this.onload() } },
  document: { createElement: () => resizedCanvas = {
    getContext: () => ({ fillRect() {}, drawImage() {} }),
    toDataURL: (format, quality) => {
      encodedFormat = format
      encodedQuality = quality
      return `data:${format};base64,c21hbGw=`
    },
  } },
})
assert.equal(await oversizedUtils.compressImageForOcr(tinyPng), tinyPng,
  'Even a 6000px screenshot stays original if its file fits the upload budget')
const largePixels = 'A'.repeat(4 * 1024 * 1024 + 100)
await oversizedUtils.compressImageForOcr(tinyPng + largePixels)
assert.equal(resizedCanvas.width, 3200)
assert.equal(resizedCanvas.height, 2133)
assert.equal(encodedFormat, 'image/png')
await oversizedUtils.compressImageForOcr(tinyJpg + largePixels)
assert.equal(encodedFormat, 'image/jpeg')
assert.equal(encodedQuality, 0.95)
console.log('PASS: oversized screenshots stay PNG; camera/JPG use 3200px and 0.95')

const calls = []
const logs = []
let replies = []
const fakeConsole = { warn: (...args) => logs.push(args) }
const gemini = loadTs('lib/gemini.ts', {
  '@google/generative-ai': { GoogleGenerativeAI: class {
    getGenerativeModel() { return { generateContent: async (parts) => {
      calls.push(parts)
      const reply = replies.shift()
      if (reply instanceof Error) throw reply
      return { response: { text: () => typeof reply === 'string' ? reply : JSON.stringify(reply) } }
    } } }
  } },
}, { process: { env: { GEMINI_API_KEY: 'test-credential' } } })
const parser = loadTs('lib/parser.ts')
let ocrText = ''
let ocrCalls = 0
let ocrUnavailable = false
const ocrStub = { recognizeScheduleWithTesseract: async () => {
  ocrCalls++
  if (ocrUnavailable) throw new Error('Synthetic OCR failure')
  return { text: ocrText, words: [] }
} }
const route = loadTs('app/api/schedule/parse/route.ts', {
  '@/lib/gemini': gemini,
  '@/lib/parser': parser,
  '@/lib/schedule-ocr': ocrStub,
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
}, { console: fakeConsole })
const entry = { code: 'CpE 408', subject: null, instructor: null, room: null, days: ['Wednesday'], start: '07:30', end: '10:30' }
async function scan(image, responses) {
  calls.length = 0
  ocrCalls = 0
  replies = [...responses]
  const response = await route.POST(new Request('http://localhost/api/schedule/parse', {
    method: 'POST', body: JSON.stringify({ image }), headers: { 'Content-Type': 'application/json' },
  }))
  return { status: response.status, data: await response.json() }
}
let result = await scan(tinyPng, [{ classes: [entry] }])
assert.equal(result.status, 200)
assert.equal(calls.length, 1)
assert.equal(result.data.classes[0].code, 'CPE 408')
assert.equal(result.data.classes[0].subject, 'CpE 408')
assert.deepEqual(result.data.classes[0].days, ['Wed'])
assert.equal(result.data.classes[0].start, '07:30')
assert.equal(result.data.classes[0].end, '10:30')
assert.equal(result.data.classes[0].confidence, 'low')
for (const field of ['subject', 'instructor', 'room']) assert.ok(result.data.classes[0].lowFields.includes(field))
console.log('PASS: course code + day + time creates a reviewable draft with missing-field flags')

const repeatedAndOverlapping = [entry,
  { ...entry, days: ['Mon'] },
  { ...entry, code: 'ECE 421', days: ['Fri'], start: '16:00', end: '18:30' },
  { ...entry, code: 'ECE 422', days: ['Fri'], start: '16:30', end: '17:30' },
]
result = await scan(tinyPng, [{ classes: repeatedAndOverlapping }])
assert.equal(result.data.classes.length, 4)
assert.equal(result.data.classes[2].end, '18:30')
assert.equal(result.data.classes[3].start, '16:30')
console.log('PASS: repeated subjects, long blocks and overlapping meetings preserved in drafts')

result = await scan(tinyPng, [{ classes: [] }, { classes: [entry] }])
assert.equal(result.status, 200)
assert.equal(calls.length, 2)
assert.match(calls[1][0], /DENSE TIMETABLE SECOND PASS/)
assert.equal(calls[1][1].inlineData.data, calls[0][1].inlineData.data)
console.log('PASS: zero classes triggers one dense-grid retry using unchanged highest-quality data')

result = await scan(tinyPng, [{ classes: [] }, { classes: [] }])
assert.equal(result.status, 422)
assert.equal(result.data.errorCode, 'zero_entries')
assert.equal(calls.length, 2)
result = await scan(tinyPng, [{ scheduleDetected: false, classes: [] }, { scheduleDetected: false, classes: [] }])
assert.equal(result.data.errorCode, 'zero_entries')
assert.equal(calls.length, 2)
result = await scan('data:image/png;base64,aGVsbG8=', [])
assert.equal(result.status, 400)
assert.equal(result.data.errorCode, 'invalid_image')
assert.equal(calls.length, 0)
result = await scan({ malformed: true }, [])
assert.equal(result.data.errorCode, 'invalid_image')
const providerError = Object.assign(new Error('https://provider/?key=SECRET_INPUT'), { status: 429 })
ocrText = 'CpE 408 Mon 07:30-10:30'
result = await scan(tinyJpg, [providerError])
assert.equal(result.status, 200, 'A provider outage must still produce a draft from Tesseract and the local parser')
assert.equal(result.data.provider, 'tesseract-local')
assert.equal(result.data.classes[0].code, 'CPE 408')
assert.equal(ocrCalls, 1)
ocrText = ''
assert.equal(calls.length, 1)
assert.doesNotMatch(JSON.stringify(logs), /SECRET_INPUT|test-credential|base64/)
assert.ok(logs.some((log) => log[1]?.status === 429 && log[1]?.category === 'quota_rate_limit'))
result = await scan(tinyPng, ['broken json'])
assert.equal(result.status, 422)
assert.equal(result.data.errorCode, 'zero_entries')
assert.equal(calls.length, 1)
console.log('PASS: bounded retry and distinct safe diagnostics for empty, non-schedule, invalid and provider responses')

for (const image of [tinyJpg, tinyPdf]) {
  result = await scan(image, [{ classes: [entry] }])
  assert.equal(result.status, 200)
}
replies = [providerError]
const textResponse = await route.POST(new Request('http://localhost/api/schedule/parse', {
  method: 'POST', body: JSON.stringify({ text: 'MATH101 Calculus Mon 08:00-09:00 Room 204' }),
}))
assert.equal((await textResponse.json()).provider, 'parser-local')
console.log('PASS: JPG/PDF routes and existing local text fallback')

assert.equal(gemini.GEMINI_MODEL_NAME, 'gemini-3.8-flash')
for (const [status, category] of [[401, 'authentication_failure'], [403, 'authentication_failure'], [429, 'quota_rate_limit'], [404, 'model_unavailable'], [503, 'provider_unavailable']]) {
  ocrText = 'CpE 408 Wednesday 07:30-10:30'
  const failure = Object.assign(new Error('secret provider payload'), { status })
  result = await scan(tinyPng, [failure])
  assert.equal(result.status, 200)
  assert.equal(result.data.provider, 'tesseract-local')
  assert.deepEqual(result.data.classes[0].days, ['Wed'])
  assert.equal(result.data.classes[0].instructor, 'TBA')
  assert.equal(calls.length, 1, 'A known outage must not repeat the vision/provider request')
  assert.equal(ocrCalls, 1)
  assert.ok(logs.some((log) => log[1]?.status === status && log[1]?.category === category))
}
ocrText = 'CpE 408 Mon 07:30-10:30'
result = await scan(tinyPng, [{ classes: [] }, { classes: [] }])
assert.equal(result.data.provider, 'tesseract-local')
assert.equal(calls.length, 2)
result = await scan(tinyPdf, [providerError])
assert.equal(result.status, 200)
assert.equal(result.data.provider, 'tesseract-local')
result = await scan(tinyPng, ['malformed response'])
assert.equal(result.data.provider, 'tesseract-local')
assert.ok(logs.some((log) => log[1]?.category === 'malformed_response'))
ocrText = 'Unreadable timetable cells'
result = await scan(tinyPng, [Object.assign(new Error('transient'), { status: 503 }), { classes: [entry] }])
assert.equal(result.data.provider, 'tesseract-gemini-text')
assert.equal(calls.length, 2)
result = await scan(tinyPng, [providerError])
assert.equal(result.status, 422)
assert.equal(result.data.error, "We found the timetable, but couldn't confidently extract the classes. Try cropping to the timetable area or continue with Paste Text.")
assert.equal(calls.length, 1)
ocrUnavailable = true
result = await scan(tinyPng, [providerError])
assert.equal(result.status, 503)
assert.equal(result.data.errorCode, 'provider_failure')
ocrUnavailable = false

const missingKeyGemini = loadTs('lib/gemini.ts', {}, { process: { env: {} } })
const missingKeyRoute = loadTs('app/api/schedule/parse/route.ts', {
  '@/lib/gemini': missingKeyGemini, '@/lib/parser': parser, '@/lib/schedule-ocr': ocrStub,
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
}, { console: fakeConsole })
ocrText = 'CpE 408 Mon 07:30-10:30'
const missingKeyResponse = await missingKeyRoute.POST(new Request('http://localhost/api/schedule/parse', { method: 'POST', body: JSON.stringify({ image: tinyPng }) }))
assert.equal(missingKeyResponse.status, 200)
assert.equal((await missingKeyResponse.json()).provider, 'tesseract-local')
const missingHealth = await missingKeyRoute.GET(new Request('http://localhost/api/schedule/parse?probe=1'))
assert.deepEqual(await missingHealth.json(), { keyConfigured: false, model: 'gemini-3.8-flash', ready: false, status: null, category: 'api_key_missing' })
const configuredGemini = loadTs('lib/gemini.ts', {}, { process: { env: { DORMOSAUR_SCHEDULE_MODEL: 'custom-schedule-model' } } })
assert.equal(configuredGemini.GEMINI_MODEL_NAME, 'custom-schedule-model')
assert.doesNotMatch(JSON.stringify(logs), /SECRET_INPUT|test-credential|secret provider payload|base64/)
for (const log of logs.filter((log) => log[0] === '[Schedule Parse API]' && ['authentication_failure', 'quota_rate_limit', 'model_unavailable', 'provider_unavailable'].includes(log[1]?.category))) {
  assert.deepEqual(Object.keys(log[1]).sort(), ['category', 'model', 'status'])
}
for (const invalid of ['Course code only: CpE 408', 'CpE 408 Mon', 'CpE 408 08:00-09:00', 'Room 202 Mon 08:00-09:00', 'CpE 408 Mon 99:00-99:30', 'Subject Room Time Monday']) {
  assert.equal(parser.parseRawSchedule(invalid, { requireExplicitMeeting: true }).length, 0, 'Strict OCR parser must not fabricate meetings')
}
assert.equal(parser.parseRawSchedule('Mon\nCpE 408 07:30-10:30', { requireExplicitMeeting: true }).length, 1)
assert.deepEqual([...parser.parseRawSchedule('CpE 408 Wednesday 07:30-10:30 (CpE 408/Online)', { requireExplicitMeeting: true })[0].days], ['Wed'])
replies = [{ classes: [{ code: 'CpE 408' }, { ...entry, days: [] }, { ...entry, start: null }] }]
assert.equal((await gemini.parseScheduleImageWithGemini(tinyPng)).length, 0, 'Gemini drafts must not substitute invented days/times')
console.log('PASS: missing key, 401/403/429/404/5xx, malformed response, dense retry, text recovery, total failure, safe health and strict local OCR parsing')

// Exercise the import action itself: it must not hide API errors or start a
// second scan while the background scan has already exhausted its one retry.
const importSource = readFileSync('app/(main)/schedule/import/page.tsx', 'utf8')
const actionSource = importSource.slice(importSource.indexOf('  const handleStartImport ='),
  importSource.indexOf('  React.useEffect', importSource.indexOf('  const handleStartImport =')))
let actionError
let rescanCount = 0
const actionExports = {}
const activeScanPromiseRef = { current: Promise.resolve({ success: false, error: 'AI scanner unavailable' }) }
vm.runInNewContext(ts.transpileModule(`${actionSource}\nexports.run = handleStartImport`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports: actionExports, activeScanPromiseRef, mode: 'photo', parsedClasses: null,
  raw: '', capturedImage: tinyPng, setLoading() {}, sessionStorage: { setItem() {} },
  setOcrError: (error) => actionError = error,
  processImageWithGemini: async () => { rescanCount++; actionError = 'AI scanner unavailable'; return null },
})
await actionExports.run()
assert.equal(actionError, 'AI scanner unavailable')
assert.equal(rescanCount, 0)
activeScanPromiseRef.current = null
await actionExports.run()
assert.equal(actionError, 'AI scanner unavailable')
assert.equal(rescanCount, 1)
console.log('PASS: import button preserves provider errors and does not duplicate an active scan')

if (process.argv.includes('--live') || process.argv.includes('--ocr')) {
  const targetUrl = process.argv.find((arg) => arg.startsWith('--url='))?.slice(6)
  require('@next/env').loadEnvConfig(process.cwd())
  if (!process.argv.includes('--ocr') && !targetUrl) assert.ok(process.env.GEMINI_API_KEY, 'Live tests require GEMINI_API_KEY')
  const sharp = require('sharp')
  const { jsPDF } = require('jspdf')
  const realPdf = loadTs('lib/schedule-pdf.ts')
  const realOcr = loadTs('lib/schedule-ocr.ts', { '@/lib/schedule-pdf': realPdf }, { setTimeout, clearTimeout })
  const liveGemini = process.argv.includes('--ocr') ? missingKeyGemini : loadTs('lib/gemini.ts')
  const liveRoute = loadTs('app/api/schedule/parse/route.ts', {
    '@/lib/gemini': liveGemini, '@/lib/parser': parser, '@/lib/schedule-ocr': realOcr,
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  })
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const meetings = [
    { code: 'CpE 408', day: 0, row: 1, span: 5, room: 'RM 202' },
    { code: 'MATH 401', day: 0, row: 9, span: 3, room: 'ONLINE' },
    { code: 'FE 407', day: 1, row: 3, span: 4, room: 'ENG LAB' },
    { code: 'ENGG 409', day: 1, row: 15, span: 5, room: 'RM 301' },
    { code: 'CpE 408', day: 2, row: 1, span: 5, room: 'RM 202' },
    { code: 'ChE 434', day: 2, row: 14, span: 6, room: 'CHE LAB' },
    { code: 'Fili 102', day: 3, row: 7, span: 3, room: 'ONLINE' },
    { code: 'CS 150', day: 3, row: 21, span: 4, room: 'CICS LAB' },
    { code: 'PE 103', day: 4, row: 0, span: 4, room: 'GYM' },
    { code: 'ECE 421', day: 4, row: 18, span: 5, room: 'RM 401' },
    { code: 'NSTP 102', day: 5, row: 6, span: 8, room: 'FIELD' },
    { code: 'ECE 422', day: 4, row: 19, span: 2, room: 'RM 402', overlap: true },
  ]
  const time = (row) => `${String(7 + Math.floor(row / 2)).padStart(2, '0')}:${row % 2 ? '30' : '00'}`
  const time12 = (row) => {
    const hour = 7 + Math.floor(row / 2)
    return `${hour % 12 || 12}:${row % 2 ? '30' : '00'}${hour < 12 ? 'AM' : 'PM'}`
  }
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="3000" height="1600"><rect width="3000" height="1600" fill="white"/><g font-family="Arial" fill="#111" font-size="18">'
  svg += '<text x="25" y="35" font-size="24">BATANGAS STATE UNIVERSITY - Class Schedule (synthetic regression fixture)</text>'
  days.forEach((day, index) => {
    const x = 260 + index * 385
    svg += `<text x="${x + 150}" y="76">${day}</text><text x="${x + 70}" y="109">Subject</text><text x="${x + 270}" y="109">Room</text>`
  })
  for (let row = 0; row < 28; row++) {
    const y = 125 + row * 50
    svg += `<rect x="0" y="${y}" width="3000" height="50" fill="${row % 2 ? '#f4f4f4' : '#e5e5e5'}"/><text x="25" y="${y + 28}" font-size="16">${time12(row)}-${time12(row + 1)}</text>`
  }
  days.forEach((_, index) => {
    const x = 260 + index * 385
    svg += `<path d="M${x} 55V1525 M${x + 225} 90V1525" stroke="#bbb"/>`
  })
  meetings.forEach((entry) => {
    const x = 260 + entry.day * 385
    const y = 125 + entry.row * 50
    svg += `<rect x="${x + (entry.overlap ? 14 : 4)}" y="${y + 1}" width="${entry.overlap ? 357 : 377}" height="${entry.span * 50 - 2}" fill="#f8fafc" stroke="#8a939c"/><text x="${x + 35}" y="${y + 27}" font-size="17">${entry.code}</text><text x="${x + 239}" y="${y + 27}" font-size="17">${entry.room}</text>`
    if (entry.overlap) svg += `<text x="${x + 35}" y="${y + 53}" font-size="16">${time(entry.row)}-${time(entry.row + entry.span)} (overlapping meeting)</text>`
  })
  svg += '</g></svg>'
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  const jpg = await sharp(png).jpeg({ quality: 95 }).toBuffer()
  const photo = await sharp(png).rotate(1, { background: '#ddd' }).modulate({ brightness: 0.93 }).jpeg({ quality: 94 }).toBuffer()
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [3000, 1600], compress: true })
  pdf.addImage(`data:image/png;base64,${png.toString('base64')}`, 'PNG', 0, 0, 3000, 1600)
  const fixtures = [
    ['dense PNG', 'image/png', png], ['dense JPG', 'image/jpeg', jpg],
    ['phone-photo simulation', 'image/jpeg', photo], ['PDF', 'application/pdf', Buffer.from(pdf.output('arraybuffer'))],
  ]
  const failures = []
  for (const [name, mime, bytes] of fixtures) {
    const selectedFixture = process.argv.find((arg) => arg.startsWith('--fixture='))?.slice(10)
    if (selectedFixture && name !== selectedFixture) continue
    const request = new Request(targetUrl || 'http://localhost/api/schedule/parse', {
      method: 'POST', body: JSON.stringify({ image: `data:${mime};base64,${bytes.toString('base64')}` }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = targetUrl ? await fetch(request) : await liveRoute.POST(request)
    const data = await response.json()
    if (response.status !== 200) {
      failures.push(`${name}: ${data.errorCode} (HTTP ${response.status})`)
      console.log(`FAIL LIVE: ${failures.at(-1)}`)
      continue
    }
    const localFallback = data.provider === 'tesseract-local'
    for (const entry of data.classes) {
      assert.ok(meetings.some((meeting) => meeting.code.toUpperCase().replace(/\s/g, '') === entry.code.replace(/\s/g, '') && entry.days.includes(days[meeting.day])), 'OCR must not invent course codes or weekdays')
      assert.match(entry.start, /^(?:[01]\d|2[0-3]):[0-5]\d$/)
      assert.ok(entry.end > entry.start)
      if (localFallback) assert.equal(entry.confidence, 'low')
    }
    let verifiedMeetings = 0
    for (const meeting of meetings) {
      const code = meeting.code.toUpperCase().replace(/\s/g, '')
      const found = data.classes.some((entry) => entry.code.replace(/\s/g, '') === code
        && entry.days.includes(days[meeting.day]) && entry.start === time(meeting.row)
        && (entry.end === time(meeting.row + meeting.span) || (localFallback && entry.lowFields?.includes('time'))))
      if (found) verifiedMeetings++
      else if (!localFallback) failures.push(`${name}: missing ${meeting.code} ${days[meeting.day]} ${time(meeting.row)}-${time(meeting.row + meeting.span)}`)
    }
    if (localFallback) assert.ok(verifiedMeetings >= 10, 'Dense OCR must recover a useful partial schedule with source-backed course/day/time relationships')
    console.log(`LIVE: ${name}: ${data.provider}, ${data.classes.length} draft entries, ${verifiedMeetings}/${meetings.length} source meetings recovered, ${failures.filter((failure) => failure.startsWith(name)).length} verification failures`)
  }
  assert.deepEqual(failures, [], 'Live scan failures')
}
