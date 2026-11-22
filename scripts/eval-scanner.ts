/**
 * Scanner accuracy benchmark.
 *
 *   npx tsx --env-file=.env.local scripts/eval-scanner.ts           # offline fixtures only
 *   npx tsx --env-file=.env.local scripts/eval-scanner.ts --live    # + AI-backed fixtures
 *   ... --only=bsu-grid.png  --runs=3  --json
 *
 * Every fixture has a hand-verified answer. A schedule is "perfect" only when
 * every meeting matches on code, day, start, end and room, with nothing invented.
 */
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { scanSchedule, type ScanInput } from '../lib/scanner'

type Meeting = { code: string; day: string; start: string; end: string; room: string; low?: string[] }
type Fixture = { name: string; input: ScanInput; expected: Meeting[]; expectHint?: string; needsAi: boolean }

const DIR = path.join(process.cwd(), 'tests/fixtures/scanner')
const args = process.argv.slice(2)
const live = args.includes('--live')
const only = args.find(a => a.startsWith('--only='))?.slice(7)
const runs = Number(args.find(a => a.startsWith('--runs='))?.slice(7) || 1)
const gap = Number(args.find(a => a.startsWith('--gap='))?.slice(6) || 0)

const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

function loadFixtures(): Fixture[] {
  const out: Fixture[] = []
  for (const file of readdirSync(DIR).sort()) {
    if (file.endsWith('.expected.json')) continue
    const base = file.replace(/\.(png|jpe?g|pdf|txt)$/i, '')
    const ext = path.extname(file).slice(1).toLowerCase()
    let expectedFile = path.join(DIR, `${base}.expected.json`)
    // Variants (bsu-grid.photo.jpg) share the answer of their source (bsu-grid).
    try { readFileSync(expectedFile) } catch { expectedFile = path.join(DIR, `${base.split('.')[0]}.expected.json`) }
    const answer = JSON.parse(readFileSync(expectedFile, 'utf8')) as { meetings?: Meeting[]; expectHint?: string }
    const expected = answer.meetings ?? []
    const bytes = readFileSync(path.join(DIR, file))
    const input: ScanInput = ext === 'txt'
      ? { text: bytes.toString('utf8') }
      : { image: `data:${ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg'};base64,${bytes.toString('base64')}` }
    out.push({ name: file, input, expected, expectHint: answer.expectHint, needsAi: ext === 'png' || ext === 'jpg' || ext === 'jpeg' || file.includes('.ai.') })
  }
  return out
}

function score(expected: Meeting[], predicted: Meeting[]) {
  const pool = [...predicted]
  let fields = 0, correct = 0, silent = 0
  const problems: string[] = []
  for (const e of expected) {
    const i = pool.findIndex(p => p.day === e.day && norm(p.code) === norm(e.code) && p.start === e.start)
      >= 0 ? pool.findIndex(p => p.day === e.day && norm(p.code) === norm(e.code) && p.start === e.start)
      : pool.findIndex(p => p.day === e.day && norm(p.code) === norm(e.code))
    fields += 4 // presence(code+day), start, end, room
    if (i < 0) { problems.push(`MISSED ${e.day} ${e.code} ${e.start}-${e.end}`); silent++; continue }
    const p = pool.splice(i, 1)[0]
    correct++
    for (const f of ['start', 'end', 'room'] as const) {
      if (norm(p[f]) === norm(e[f])) correct++
      else {
        // A wrong value the student is told to check is a prompt; an unflagged one is a silent error.
        const flagged = p.low?.includes(f === 'room' ? 'room' : 'time')
        if (!flagged) silent++
        problems.push(`${flagged ? 'FLAGGED' : 'WRONG'} ${f} ${e.day} ${e.code}: got "${p[f]}" want "${e[f]}"`)
      }
    }
  }
  for (const p of pool) { problems.push(`INVENTED ${p.day} ${p.code} ${p.start}-${p.end} ${p.room}`); if (!p.low?.length) silent++ }
  return { accuracy: correct / fields, perfect: problems.length === 0, problems, invented: pool.length, silent }
}

async function main() {
  const fixtures = loadFixtures().filter(f => (!only || f.name === only) && (live || !f.needsAi))
  if (!fixtures.length) { console.log('No fixtures selected.'); return }
  const rows: { name: string; accuracy: number; perfect: boolean; ms: number; provider: string; silent: number }[] = []
  for (const f of fixtures) {
    for (let r = 0; r < runs; r++) {
      const t = performance.now()
      let predicted: Meeting[] = [], provider = 'error', problems: string[] = [], hinted = false
      try {
        const res = await scanSchedule(f.input)
        provider = res.provider
        hinted = Boolean(f.expectHint && res.hint === f.expectHint && res.classes.every(c => c.confidence === 'low'))
        predicted = res.classes.flatMap(c => c.days.map(day => ({ code: c.code, day, start: c.start, end: c.end, room: c.room, low: c.lowFields ?? [] })))
      } catch (e) {
        const hint = (e as { category?: string }).category
        if (f.expectHint && hint === f.expectHint) hinted = true
        else problems = [`ERROR ${e instanceof Error ? e.message : String(e)}`]
      }
      const ms = Math.round(performance.now() - t)
      // Ambiguous sources pass only when the scanner says so (hint + every class flagged) instead of guessing silently.
      const s = f.expectHint ? { accuracy: hinted ? 1 : 0, perfect: hinted, problems: hinted ? [] : [`EXPECTED hint ${f.expectHint} with all classes flagged`], invented: 0, silent: hinted ? 0 : 1 }
        : problems.length ? { accuracy: 0, perfect: false, problems, invented: 0, silent: 0 } : score(f.expected, predicted)
      rows.push({ name: f.name, accuracy: s.accuracy, perfect: s.perfect, ms, provider, silent: s.silent })
      if (gap) await new Promise(r => setTimeout(r, gap))
      console.log(`${s.perfect ? 'PERFECT' : 'IMPERFECT'}  ${f.name.padEnd(34)} ${(s.accuracy * 100).toFixed(1).padStart(5)}%  ${String(ms).padStart(6)}ms  ${provider}`)
      for (const p of s.problems.slice(0, 12)) console.log(`    ${p}`)
    }
  }
  const perfect = rows.filter(r => r.perfect).length
  const ms = rows.map(r => r.ms).sort((a, b) => a - b)
  const avg = rows.reduce((a, r) => a + r.accuracy, 0) / rows.length
  const silent = rows.reduce((a, r) => a + r.silent, 0)
  console.log(`\nSCORE  perfect ${perfect}/${rows.length}  field accuracy ${(avg * 100).toFixed(1)}%  silent errors ${silent}  p50 ${ms[Math.floor(ms.length / 2)]}ms  max ${ms[ms.length - 1]}ms`)
  if (args.includes('--strict') && perfect !== rows.length) process.exitCode = 1
}

main()
