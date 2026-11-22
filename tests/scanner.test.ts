/**
 * Scanner unit tests. Offline and deterministic: run with no GEMINI_API_KEY.
 *   npx tsx --test tests/scanner.test.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { askModels, modelChain, VERIFIED_MODELS } from '../lib/scanner/ai'
import { dateEvidence, normalizeDrafts, timeEvidence } from '../lib/scanner/deadlines'
import { cleanCode, finalize, unwrap } from '../lib/scanner/finalize'
import { isDitto, resolveGrid, rowTimes } from '../lib/scanner/grid'
import { parseDataUrl, scanSchedule, ScanError } from '../lib/scanner'
import { gridFromPdf } from '../lib/scanner/pdf-grid'
import { estimateSkew } from '../lib/scanner/prepare'
import { parseScheduleText } from '../lib/scanner/text'
import { parseDayString, parseRange, to24 } from '../lib/scanner/time'
import type { Draft, Grid } from '../lib/scanner/types'

delete process.env.GEMINI_API_KEY
const FX = 'tests/fixtures/scanner/'
const expected = (name: string) => JSON.parse(readFileSync(FX + name, 'utf8')).meetings as { code: string; day: string; start: string; end: string; room: string }[]
const meetings = (classes: { code: string; days: string[]; start: string; end: string; room: string }[]) =>
  classes.flatMap(c => c.days.map(day => `${day} ${c.code.replace(/\s/g, '').toLowerCase()} ${c.start}-${c.end} ${c.room.toLowerCase()}`)).sort()
const want = (name: string) => expected(name).map(e => `${e.day} ${e.code.replace(/\s/g, '').toLowerCase()} ${e.start}-${e.end} ${e.room.toLowerCase()}`).sort()
const draft = (p: Partial<Draft>): Draft => ({ code: 'X 1', subject: 'X 1', instructor: '', room: 'R1', days: ['Mon'], start: '08:00', end: '09:00', low: new Set(), ...p })

test('time: ranges, meridiem inference and 24-hour input', () => {
  assert.deepEqual(parseRange('07:00 AM-07:30 AM'), { start: '07:00', end: '07:30' })
  assert.deepEqual(parseRange('8:30-9:50am'), { start: '08:30', end: '09:50' })
  assert.deepEqual(parseRange('1-2:30pm'), { start: '13:00', end: '14:30' })
  assert.deepEqual(parseRange('11-12:30pm'), { start: '11:00', end: '12:30' })
  assert.deepEqual(parseRange('10:15 to 12'), { start: '10:15', end: '12:00' })
  assert.deepEqual(parseRange('15:00–16:20'), { start: '15:00', end: '16:20' })
  assert.deepEqual(parseRange('11:30 AM-12:00 PM'), { start: '11:30', end: '12:00' })
  assert.deepEqual(parseRange('7-9am'), { start: '07:00', end: '09:00' })
  assert.equal(parseRange('09:00-08:00'), null, 'end before start is not a meeting')
  assert.equal(to24('12nn'), '12:00')
  assert.equal(to24('12:30 AM'), '00:30')
})

test('time: compact day strings', () => {
  assert.deepEqual(parseDayString('MWF'), ['Mon', 'Wed', 'Fri'])
  assert.deepEqual(parseDayString('TTh'), ['Tue', 'Thu'])
  assert.deepEqual(parseDayString('TuTh'), ['Tue', 'Thu'])
  assert.deepEqual(parseDayString('M/W'), ['Mon', 'Wed'])
  assert.deepEqual(parseDayString('Mon-Wed-Fri'), ['Mon', 'Wed', 'Fri'])
  assert.deepEqual(parseDayString('MTWThF'), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
})

test('grid: dittos extend, blanks close, room ditto under a new subject inherits the column room', () => {
  const t = rowTimes(['07:00 AM-07:30 AM', '07:30 AM-08:00 AM', '08:00 AM-08:30 AM', '08:30 AM-09:00 AM', '09:00 AM-09:30 AM'])
  const grid: Grid = { days: ['Fri'], rows: [
    { label: '', ...t[0], cells: { Fri: { subject: 'Fili 102', room: 'ONLINE' } } },
    { label: '', ...t[1], cells: { Fri: { subject: '-do-', room: '-do-' } } },
    { label: '', ...t[2], cells: { Fri: { subject: 'CpE 412', room: '-do-' } } },
    { label: '', ...t[3], cells: { Fri: { subject: '-do-', room: '-do-' } } },
    { label: '', ...t[4], cells: {} },
  ] }
  const { drafts, orphans } = resolveGrid(grid)
  assert.equal(orphans, 0)
  assert.deepEqual(drafts.map(d => `${d.code} ${d.start}-${d.end} ${d.room}`), ['Fili 102 07:00-08:00 ONLINE', 'CpE 412 08:00-09:00 ONLINE'])
  for (const s of ['-do-', '-do', 'do', '"', '〃', 'ditto', '- do -']) assert.ok(isDitto(s), s)
  for (const s of ['CpE 410', 'DOST 1', 'Room']) assert.ok(!isDitto(s), s)
})

test('grid: a ditto with no class above is counted, never invented', () => {
  const t = rowTimes(['8:00', '8:30', '9:00'])
  const { drafts, orphans } = resolveGrid({ days: ['Mon'], rows: [
    { label: '', ...t[0], cells: { Mon: { subject: '-do-', room: '-do-' } } },
    { label: '', ...t[1], cells: {} },
    { label: '', ...t[2], cells: { Mon: { subject: 'CS 1', room: 'L1' } } },
  ] })
  assert.equal(drafts.length, 1)
  assert.equal(orphans, 1)
})

test('finalize: brackets, merging, one colour per subject, clashes and placeholders', () => {
  assert.equal(unwrap('RM 202 (CICS)'), 'RM 202 (CICS)', 'the old bug cut this to "RM 202 (CICS"')
  assert.equal(unwrap('RM202(CICS)'), 'RM202(CICS)')
  assert.equal(unwrap('(ONLINE)'), 'ONLINE')
  assert.equal(cleanCode('CpE413'), 'CpE 413')
  assert.equal(cleanCode('MATH-101'), 'MATH 101')
  const out = finalize([
    draft({ code: 'CpE 415', days: ['Tue'], start: '10:00', end: '12:00', room: 'COMPLAB3' }),
    draft({ code: 'CpE 415', days: ['Thu'], start: '10:00', end: '12:00', room: 'COMPLAB3' }),
    draft({ code: 'CpE 415', days: ['Fri'], start: '13:00', end: '15:00', room: 'ONLINE' }),
    draft({ code: 'MATH 1', days: ['Mon'], start: '08:00', end: '09:00', room: 'TBA', instructor: 'TBA' }),
    draft({ code: 'PE 2', days: ['Mon'], start: '08:30', end: '10:00' }),
    draft({ code: 'Thursday', days: ['Thu'] }),
  ])
  const cpe = out.filter(c => c.code === 'CpE 415')
  assert.equal(cpe.length, 2, 'identical meetings merge across days; different times stay separate')
  assert.deepEqual(cpe.find(c => c.start === '10:00')!.days, ['Tue', 'Thu'])
  assert.equal(new Set(cpe.map(c => c.color)).size, 1, 'one subject keeps one colour')
  const math = out.find(c => c.code === 'MATH 1')!
  assert.equal(math.room, '')
  assert.equal(math.instructor, '')
  assert.ok(math.lowFields!.includes('room'))
  assert.ok(math.lowFields!.includes('time'), 'MATH 1 clashes with PE 2')
  assert.ok(!out.some(c => c.code === 'Thursday'), 'a day name is never a course')
  assert.ok(out.find(c => c.start === '10:00')!.confidence === 'high')
})

test('PDF text layer: the real BSU schedule is read exactly, with no AI', async () => {
  const t = Date.now()
  const res = await scanSchedule({ image: `data:application/pdf;base64,${readFileSync(FX + 'bsu-grid.pdf').toString('base64')}` })
  assert.equal(res.provider, 'pdf-text')
  assert.deepEqual(meetings(res.classes), want('bsu-grid.expected.json'))
  assert.ok(res.classes.every(c => c.confidence === 'high'))
  assert.ok(Date.now() - t < 8000)
})

test('PDF text layer: merged-cell PDFs (no ditto marks) are not trusted for spans', async () => {
  const grid = await gridFromPdf(readFileSync(FX + 'merged-grid.ai.pdf'))
  assert.ok(grid, 'the grid is still detected')
  assert.ok(!grid!.rows.some(r => Object.values(r.cells).some(c => isDitto(c?.subject ?? ''))))
})

for (const [file, answer] of [['list-freeform.txt', 'list-freeform.expected.json'], ['day-grouped.txt', 'day-grouped.expected.json'], ['portal-table.txt', 'portal-table.expected.json']]) {
  test(`text fast path: ${file} is exact in milliseconds with no AI`, async () => {
    const t = Date.now()
    const res = await scanSchedule({ text: readFileSync(FX + file, 'utf8') })
    assert.equal(res.provider, 'text-local')
    assert.deepEqual(meetings(res.classes), want(answer))
    assert.ok(Date.now() - t < 200)
  })
}

test('text copied out of a grid is refused honestly instead of guessed', async () => {
  const text = readFileSync(FX + 'bsu-grid.paste.ai.txt', 'utf8')
  assert.equal(parseScheduleText(text).looksLikeGrid, true)
  await assert.rejects(scanSchedule({ text }), (e: unknown) => e instanceof ScanError && e.category === 'grid_text')
})

test('text parser: initials and room words are not weekdays', () => {
  const { drafts } = parseScheduleText('GEC 4\tReadings in Philippine History\t3\tF\t08:00AM-11:00AM\tRM 201\tSantos, M.')
  assert.deepEqual(drafts[0].days, ['Fri'])
  assert.equal(drafts[0].room, 'RM 201')
  assert.equal(drafts[0].instructor, 'Santos, M.')
})

test('uploads: magic bytes are checked', () => {
  assert.equal(parseDataUrl('data:image/png;base64,aGVsbG8='), null)
  assert.ok(parseDataUrl(`data:image/png;base64,${readFileSync(FX + 'bsu-grid.png').toString('base64')}`))
  assert.ok(parseDataUrl(`data:application/pdf;base64,${readFileSync(FX + 'bsu-grid.pdf').toString('base64')}`))
})

test('photos: tilt is measured so rows line up', async () => {
  assert.ok(Math.abs((await estimateSkew(readFileSync(FX + 'bsu-grid.photo.jpg'))) + 2.5) <= 0.3)
  assert.equal(await estimateSkew(readFileSync(FX + 'bsu-grid.png')), 0)
})

test('AI: overloaded models fall through the chain; a bad key stops at once', async () => {
  process.env.GEMINI_API_KEY = 'test-key'
  const realFetch = globalThis.fetch
  const seen: string[] = []
  try {
    globalThis.fetch = (async (url: string) => {
      const model = url.match(/models\/([^:]+):/)![1]
      seen.push(model)
      if (seen.length === 1) return new Response('{}', { status: 503 })
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] }), { status: 200 })
    }) as typeof fetch
    const r = await askModels([{ text: 'x' }], {}, (raw, model) => ({ raw, model }))
    assert.deepEqual(r.raw, { ok: true })
    assert.equal(r.model, modelChain()[1])
    seen.length = 0
    globalThis.fetch = (async () => { seen.push('call'); return new Response('{}', { status: 403 }) }) as unknown as typeof fetch
    await assert.rejects(askModels([{ text: 'x' }], {}, x => x), /authentication_failure/)
    assert.equal(seen.length, 1, 'no point trying other models with a rejected key')
    assert.equal(modelChain()[0], VERIFIED_MODELS[0])
  } finally {
    globalThis.fetch = realFetch
    delete process.env.GEMINI_API_KEY
  }
})

test('deadlines: dates must be written near the task; relative dates are flagged', () => {
  assert.equal(dateEvidence('Lab report due Nov 30', '2026-11-30'), 'exact')
  assert.equal(dateEvidence('Quiz 11/30', '2026-11-30'), 'exact')
  assert.equal(dateEvidence('Essay due next Friday', '2026-11-27'), 'relative')
  assert.equal(dateEvidence('Essay soon', '2026-11-27'), 'none')
  assert.ok(timeEvidence('due 11:59 PM', '23:59'))
  assert.ok(timeEvidence('submit by noon', '12:00'))
  assert.ok(!timeEvidence('due Friday', '23:59'))
  const borrowed = normalizeDrafts({ deadlines: [{ title: 'Project outline', dueDate: '2026-10-12', dueTime: '16:00', code: 'PHY 101', type: 'project' }] }, 'Project outline\nPHY 101 Quiz due 2026-10-12 at 4pm')
  assert.equal(borrowed[0].dueDate, '', 'a date from a different task is never borrowed')
  assert.equal(borrowed[0].dueTime, '')
  assert.equal(borrowed[0].code, '')
  const nextLine = normalizeDrafts({ deadlines: [{ title: 'Lab Report 3', dueDate: '2026-12-02', dueTime: '23:59', code: '', type: 'assignment' }] }, 'Lab Report 3\nDeadline: Dec 2, 11:59 PM')
  assert.equal(nextLine[0].dueDate, '2026-12-02')
  assert.equal(nextLine[0].dueTime, '23:59')
  const relative = normalizeDrafts({ deadlines: [{ title: 'Reflection paper', dueDate: '2026-11-27', dueTime: '', code: '', type: 'assignment' }] }, 'Reflection paper due next Friday')
  assert.equal(relative[0].dueDate, '2026-11-27')
  assert.ok(relative[0].lowFields.includes('dueDate'))
})

test('deadlines: a "Deadline: November 30" line belongs to the task above it', () => {
  const src = 'CPE 413 Announcements\nFinal project proposal\nDeadline: November 30 at noon\nLab Report 3 due Dec 2'
  const [d] = normalizeDrafts({ deadlines: [{ title: 'Final project proposal', dueDate: '2026-11-30', dueTime: '12:00', code: 'CPE 413', type: 'project' }] }, src)
  assert.equal(d.dueDate, '2026-11-30')
  assert.equal(d.dueTime, '12:00')
  assert.equal(d.code, 'CPE 413', 'the one course the announcement is about')
})
