import { createHash } from 'node:crypto'
import type { ClassEntry } from '@/lib/data'
import { AiError, aiConfigured, askBlockEnds, askSchedule, SCHEDULE_PROMPT, VERIFIED_MODELS, type AiResult } from './ai'
import { finalize } from './finalize'
import { isDitto, resolveGrid } from './grid'
import { gridFromPdf, textFromPdf } from './pdf-grid'
import { parseScheduleText } from './text'
import { dayOf, minutes, parseDayString, parseRange, sortDays, to24, type Weekday } from './time'
import type { Draft, Field, Grid, ScanInput } from './types'
import { straighten } from './prepare'

export type { ScanInput } from './types'

export type ScanErrorCode = 'invalid_image' | 'provider_failure' | 'no_schedule' | 'zero_entries'
export class ScanError extends Error {
  constructor(public readonly code: ScanErrorCode, public readonly category?: string) { super(code) }
}

export type ScanResult = {
  classes: ClassEntry[]
  /** Which route produced the answer: pdf-text, text-local, ai:<model>, ocr-local. */
  provider: string
  /** Meetings that could not be placed (e.g. a ditto with nothing above it). */
  skipped: number
  /** grid_text: text copied out of a timetable lost its columns; ask for the PDF/screenshot instead. */
  hint?: 'grid_text'
}

// Small per-instance cache: re-scanning the same file or text is instant.
const cache = new Map<string, ScanResult>()
const remember = (k: string, r: ScanResult) => { cache.set(k, r); if (cache.size > 64) cache.delete(cache.keys().next().value!) ; return r }

type Inline = { mimeType: string; data: string; bytes: Buffer }

/** Strict data-URL check with magic bytes. */
export function parseDataUrl(dataUrl: string): Inline | null {
  const m = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif|heic|heif)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/)
  if (!m) return null
  const bytes = Buffer.from(m[2], 'base64')
  if (!bytes.length) return null
  const mime = m[1] === 'image/jpg' ? 'image/jpeg' : m[1]
  const ok = mime === 'application/pdf' ? bytes.subarray(0, 5).toString() === '%PDF-'
    : mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : mime === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : mime === 'image/webp' ? bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
    : mime === 'image/gif' ? /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString())
    : bytes.subarray(4, 8).toString() === 'ftyp'
  return ok ? { mimeType: mime, data: m[2], bytes } : null
}

/** AI answer → drafts. Grids are resolved by our own code, never by the model. */
function draftsFromAi(ai: AiResult): { drafts: Draft[]; skipped: number } {
  if (ai.layout === 'grid' && ai.grid) {
    const { drafts, orphans } = resolveGrid(ai.grid)
    return { drafts, skipped: orphans }
  }
  const drafts: Draft[] = ai.classes.map(c => {
    const low = new Set<Field>((c.uncertain ?? []).filter((f): f is Field => ['code', 'subject', 'instructor', 'room', 'days', 'time'].includes(f)))
    const days = sortDays((c.days ?? []).flatMap(d => { const one = dayOf(d, true); return one ? [one] : parseDayString(d) }) as Weekday[])
    let start = /^\d{2}:\d{2}$/.test(c.start ?? '') ? c.start! : to24(c.start ?? '')
    let end = /^\d{2}:\d{2}$/.test(c.end ?? '') ? c.end! : to24(c.end ?? '')
    if ((!start || !end) && c.start && c.end) { const r = parseRange(`${c.start}-${c.end}`); if (r) ({ start, end } = r) }
    return { code: c.code ?? '', subject: c.subject ?? '', instructor: c.instructor ?? '', room: c.room ?? '', days, start, end, low }
  })
  return { drafts, skipped: 0 }
}

async function viaAi(parts: unknown[], image?: unknown): Promise<{ result: ScanResult; layout: AiResult['layout'] }> {
  const ai = await askSchedule(parts)
  const { drafts, skipped } = draftsFromAi(ai)
  if (image && ai.layout === 'grid' && ai.grid) await checkMergedSpans(ai.grid, drafts, image)
  // Last-resort models are not benchmark-verified on dense grids: never present their times as certain.
  if (!VERIFIED_MODELS.includes(ai.model)) for (const d of drafts) d.low.add('time')
  return { result: { classes: finalize(drafts), provider: `ai:${ai.model}`, skipped }, layout: ai.layout }
}

/** Merged-cell grids: confirm where each multi-row box ends; disagreement is flagged, never hidden. */
async function checkMergedSpans(grid: Grid, drafts: Draft[], image: unknown) {
  const cells = grid.rows.flatMap(r => Object.values(r.cells))
  const dittos = cells.filter(c => isDitto(c?.subject ?? '')).length
  const labelled = cells.filter(c => c?.subject && !isDitto(c.subject)).length
  // BSU-style grids write every row ("-do-"); only merged layouts need the second look.
  if (!drafts.length || dittos >= labelled) return
  const labels = grid.rows.map(r => r.label)
  const blocks = drafts.map((d, id) => ({ id, day: d.days[0], subject: d.code, firstRow: grid.rows.find(r => r.start === d.start)?.label ?? d.start }))
  try {
    const ends = await askBlockEnds(image, labels, blocks)
    drafts.forEach((d, id) => {
      const row = grid.rows.find(r => r.label === ends.get(id))
      if (!row || minutes(row.end) <= minutes(d.start)) { d.low.add('time'); return }
      if (row.end !== d.end) { d.end = row.end; d.low.add('time') }
    })
  } catch {
    for (const d of drafts) d.low.add('time')
  }
}

function providerError(e: unknown): ScanError {
  return new ScanError('provider_failure', e instanceof AiError ? e.category : 'unexpected')
}

async function scanText(text: string): Promise<ScanResult> {
  const local = parseScheduleText(text)
  if (local.confident) return { classes: finalize(local.drafts), provider: 'text-local', skipped: 0 }
  if (aiConfigured()) {
    try {
      const { result, layout } = await viaAi([{ text: `${SCHEDULE_PROMPT}\n\nSCHEDULE TEXT:\n"""\n${text}\n"""` }])
      if (result.classes.length && local.looksLikeGrid) {
        // Copied grid text cannot say which column a cell was in: every day/time is a guess.
        for (const c of result.classes) { c.confidence = 'low'; c.lowFields = [...new Set([...(c.lowFields ?? []), 'days', 'time'])] }
        return { ...result, hint: 'grid_text' }
      }
      if (result.classes.length) return result
      if (layout === 'none' && !local.drafts.length) throw new ScanError('no_schedule')
    } catch (e) {
      if (e instanceof ScanError) throw e
      if (!local.drafts.length && !local.looksLikeGrid) throw providerError(e)
    }
  }
  if (local.looksLikeGrid) throw new ScanError('zero_entries', 'grid_text')
  if (local.drafts.length) return { classes: finalize(local.drafts), provider: 'text-local', skipped: 0 }
  throw new ScanError(aiConfigured() ? 'zero_entries' : 'provider_failure', aiConfigured() ? undefined : 'api_key_missing')
}

async function scanFile(file: Inline): Promise<ScanResult> {
  if (file.mimeType === 'application/pdf') {
    // Digital PDFs carry exact text with positions: no AI needed.
    try {
      const grid = await gridFromPdf(file.bytes)
      // Text alone proves a block's length only when every row is written out
      // (ditto marks). Merged-cell PDFs print a label once: let the model see the boxes.
      const spelledOut = grid?.rows.some(r => Object.values(r.cells).some(c => isDitto(c?.subject ?? '')))
      if (grid && spelledOut) {
        const { drafts, orphans } = resolveGrid(grid)
        if (drafts.length) return { classes: finalize(drafts), provider: 'pdf-text', skipped: orphans }
      }
      const text = await textFromPdf(file.bytes)
      if (text.trim()) {
        const local = parseScheduleText(text)
        if (local.confident) return { classes: finalize(local.drafts), provider: 'pdf-text', skipped: 0 }
      }
    } catch { /* scanned or unusual PDF: let the model read it */ }
  }
  if (file.mimeType !== 'application/pdf') {
    const fixed = await straighten(file.bytes)
    if (fixed) file = { mimeType: 'image/png', data: fixed.toString('base64'), bytes: fixed }
  }
  const image = { inlineData: { mimeType: file.mimeType, data: file.data } }
  try {
    const { result, layout } = await viaAi([image, { text: SCHEDULE_PROMPT }], image)
    if (result.classes.length) return result
    throw new ScanError(layout === 'none' ? 'no_schedule' : 'zero_entries')
  } catch (e) {
    // No OCR guesswork: a partial schedule with silently missing classes is worse than "try again".
    if (e instanceof ScanError) throw e
    throw providerError(e)
  }
}

/** One entry point for every source: pasted text, screenshots, photos and PDFs. */
export async function scanSchedule(input: ScanInput): Promise<ScanResult> {
  const raw = 'text' in input ? input.text : input.image
  const k = createHash('sha256').update(raw).digest('hex')
  const hit = cache.get(k)
  if (hit) return { ...hit, classes: hit.classes.map(c => ({ ...c })) }
  if ('text' in input) return remember(k, await scanText(input.text))
  const file = parseDataUrl(input.image)
  if (!file) throw new ScanError('invalid_image')
  return remember(k, await scanFile(file))
}
