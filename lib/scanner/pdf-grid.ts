import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Grid, GridRow } from './types'
import { dayOf, TIME_RANGE, type Weekday } from './time'
import { rowTimes } from './grid'

type Item = { str: string; x: number; y: number; w: number; h: number }

/**
 * Exact reading of a digital PDF timetable from its text layer: every word
 * comes with its position, so cells map to (day, time row) with no OCR and no AI.
 * Returns null when the PDF has no usable text grid (scans, photos, list layouts).
 */
export async function pdfTextItems(bytes: Buffer): Promise<Item[][]> {
  const nodeRequire = createRequire(path.join(process.cwd(), 'package.json'))
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(nodeRequire.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href
  const root = path.dirname(nodeRequire.resolve('pdfjs-dist/package.json'))
  const task = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    standardFontDataUrl: path.join(root, 'standard_fonts').replace(/\\/g, '/') + '/',
    useSystemFonts: false,
    verbosity: 0,
  })
  try {
    const doc = await task.promise
    const pages: Item[][] = []
    for (let p = 1; p <= Math.min(doc.numPages, 4); p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      const items: Item[] = []
      for (const it of content.items as { str?: string; transform?: number[]; width?: number; height?: number }[]) {
        const str = (it.str ?? '').trim()
        if (!str || !it.transform) continue
        // pdf space: y grows upward; flip so rows sort top to bottom
        items.push({ str, x: it.transform[4], y: -it.transform[5], w: it.width ?? 0, h: Math.abs(it.height ?? it.transform[3] ?? 8) })
      }
      pages.push(items)
      page.cleanup()
    }
    return pages
  } finally {
    await task.destroy()
  }
}

const cx = (i: Item) => i.x + i.w / 2
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol

/** Group items into visual lines by y. */
function lines(items: Item[]): Item[][] {
  const out: Item[][] = []
  for (const it of [...items].sort((a, b) => a.y - b.y)) {
    const last = out[out.length - 1]
    if (last && near(last[0].y, it.y, Math.max(2, it.h * 0.45))) last.push(it)
    else out.push([it])
  }
  return out.map(l => l.sort((a, b) => a.x - b.x))
}

export function gridFromItems(items: Item[]): Grid | null {
  const ls = lines(items)
  // Header: the line with the most weekday names (≥3).
  let header: { day: Weekday; x: number; y: number }[] = []
  for (const l of ls) {
    const days = l.flatMap(i => { const d = /^[a-z]{2,9}\.?$/i.test(i.str) ? dayOf(i.str) : null; return d ? [{ day: d, x: cx(i), y: i.y }] : [] })
    if (days.length > header.length && days.length >= 3) header = days
  }
  if (!header.length) return null
  header.sort((a, b) => a.x - b.x)
  const headerY = header[0].y
  const dayGap = header.length > 1 ? (header[header.length - 1].x - header[0].x) / (header.length - 1) : 100

  // Optional Subj/Room subheader line just below the day headers.
  const subLine = ls.find(l => l[0].y > headerY && l.filter(i => /^(subj(ect)?|course|code|room|rm|venue|loc(ation)?)\.?$/i.test(i.str)).length >= 2)
  type Col = { day: Weekday; kind: 'subject' | 'room' | 'both'; x: number }
  let cols: Col[]
  if (subLine) {
    cols = subLine.filter(i => /^(subj(ect)?|course|code|room|rm|venue|loc(ation)?)\.?$/i.test(i.str)).map(i => {
      const day = header.reduce((b, h) => (Math.abs(h.x - cx(i)) < Math.abs(b.x - cx(i)) ? h : b)).day
      return { day, kind: /^(room|rm|venue|loc)/i.test(i.str) ? 'room' as const : 'subject' as const, x: cx(i) }
    })
  } else {
    cols = header.map(h => ({ day: h.day, kind: 'both' as const, x: h.x }))
  }
  cols.sort((a, b) => a.x - b.x)
  const firstColX = Math.min(...cols.map(c => c.x)) - dayGap / 3
  const bodyTop = (subLine ? subLine[0].y : headerY) + 1

  // Time rows: text left of the first column that contains a time range or a time.
  const rowLines = ls.filter(l => l[0].y > bodyTop)
  const timeRows: { label: string; y: number; cells: Item[] }[] = []
  for (const l of rowLines) {
    const left = l.filter(i => i.x + i.w <= firstColX + 2)
    const label = left.map(i => i.str).join(' ').replace(/\s*-\s*/g, '-').trim()
    if (left.length && (TIME_RANGE.test(label) || /^\d{1,2}[:.]\d{2}\s*([ap]\.?m\.?)?$/i.test(label))) {
      timeRows.push({ label, y: left[0].y, cells: l.filter(i => i.x + i.w > firstColX + 2) })
    } else if (timeRows.length) {
      // wrapped cell text on its own line belongs to the row above
      timeRows[timeRows.length - 1].cells.push(...l)
    }
  }
  if (timeRows.length < 2) return null
  const times = rowTimes(timeRows.map(r => r.label))
  const colTol = Math.max(18, (cols.length > 1 ? Math.min(...cols.slice(1).map((c, i) => c.x - cols[i].x)) : dayGap) * 0.6)
  const rows: GridRow[] = timeRows.map((r, i) => {
    const cells: GridRow['cells'] = {}
    for (const it of r.cells) {
      const col = cols.reduce((b, c) => (Math.abs(c.x - cx(it)) < Math.abs(b.x - cx(it)) ? c : b))
      if (Math.abs(col.x - cx(it)) > colTol * 1.6) continue
      const cell = (cells[col.day] ??= { subject: '', room: '' })
      if (col.kind === 'room') cell.room = `${cell.room} ${it.str}`.trim()
      else cell.subject = `${cell.subject} ${it.str}`.trim()
    }
    return { label: r.label, start: times[i].start, end: times[i].end, cells }
  })
  return { days: [...new Set(header.map(h => h.day))], rows }
}

export async function gridFromPdf(bytes: Buffer): Promise<Grid | null> {
  const pages = await pdfTextItems(bytes)
  for (const items of pages) {
    const g = gridFromItems(items)
    if (g && g.rows.some(r => Object.keys(r.cells).length)) return g
  }
  return null
}

/** Plain text of a PDF's text layer (for list-style PDFs), lines in reading order. */
export async function textFromPdf(bytes: Buffer): Promise<string> {
  const pages = await pdfTextItems(bytes)
  return pages.map(items => lines(items).map(l => l.map(i => i.str).join(' ')).join('\n')).join('\n\n')
}
