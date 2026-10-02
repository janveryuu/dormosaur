import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
function loadTs(path, overrides = {}, globals = {}) {
  const exports = {}
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, {
    exports, require: (name) => overrides[name] ?? require(name),
    process, console, Buffer, ...globals,
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
const route = loadTs('app/api/schedule/parse/route.ts', {
  '@/lib/gemini': gemini,
  '@/lib/parser': parser,
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
}, { console: fakeConsole })
const entry = { code: 'CpE 408', subject: null, instructor: null, room: null, days: ['Wednesday'], start: '07:30', end: '10:30' }
async function scan(image, responses) {
  calls.length = 0
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
assert.equal(result.data.errorCode, 'no_schedule')
assert.equal(calls.length, 2)
result = await scan('data:image/png;base64,aGVsbG8=', [])
assert.equal(result.status, 400)
assert.equal(result.data.errorCode, 'invalid_image')
assert.equal(calls.length, 0)
result = await scan({ malformed: true }, [])
assert.equal(result.data.errorCode, 'invalid_image')
const providerError = Object.assign(new Error('https://provider/?key=SECRET_INPUT'), { status: 429 })
result = await scan(tinyJpg, [providerError])
assert.equal(result.status, 503)
assert.equal(result.data.errorCode, 'provider_failure')
assert.equal(calls.length, 1)
assert.doesNotMatch(result.data.error, /clearer|blurry/i)
assert.doesNotMatch(JSON.stringify(logs), /SECRET_INPUT|test-credential|base64/)
assert.ok(logs.some((log) => log[1]?.providerStatus === 429))
result = await scan(tinyPng, ['broken json'])
assert.equal(result.status, 502)
assert.equal(result.data.errorCode, 'invalid_response')
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

if (process.argv.includes('--live')) {
  require('@next/env').loadEnvConfig(process.cwd())
  assert.ok(process.env.GEMINI_API_KEY, 'Live tests require GEMINI_API_KEY')
  const sharp = require('sharp')
  const { jsPDF } = require('jspdf')
  const liveGemini = loadTs('lib/gemini.ts')
  const liveRoute = loadTs('app/api/schedule/parse/route.ts', {
    '@/lib/gemini': liveGemini, '@/lib/parser': parser,
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
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [3000, 1600] })
  pdf.addImage(`data:image/png;base64,${png.toString('base64')}`, 'PNG', 0, 0, 3000, 1600)
  const fixtures = [
    ['dense PNG', 'image/png', png], ['dense JPG', 'image/jpeg', jpg],
    ['phone-photo simulation', 'image/jpeg', photo], ['PDF', 'application/pdf', Buffer.from(pdf.output('arraybuffer'))],
  ]
  const failures = []
  for (const [name, mime, bytes] of fixtures) {
    const response = await liveRoute.POST(new Request('http://localhost/api/schedule/parse', {
      method: 'POST', body: JSON.stringify({ image: `data:${mime};base64,${bytes.toString('base64')}` }),
    }))
    const data = await response.json()
    if (response.status !== 200) {
      failures.push(`${name}: ${data.errorCode} (HTTP ${response.status})`)
      console.log(`FAIL LIVE: ${failures.at(-1)}`)
      continue
    }
    for (const meeting of meetings) {
      const code = meeting.code.toUpperCase().replace(/\s/g, '')
      const found = data.classes.some((entry) => entry.code.replace(/\s/g, '') === code
        && entry.days.includes(days[meeting.day]) && entry.start === time(meeting.row)
        && entry.end === time(meeting.row + meeting.span))
      if (!found) failures.push(`${name}: missing ${meeting.code} ${days[meeting.day]} ${time(meeting.row)}-${time(meeting.row + meeting.span)}`)
    }
    console.log(`LIVE: ${name}: ${data.classes.length} draft entries, ${failures.filter((failure) => failure.startsWith(name)).length} verification failures`)
  }
  assert.deepEqual(failures, [], 'Live scan failures')
}
