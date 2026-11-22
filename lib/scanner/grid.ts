import type { Draft, Grid, GridRow } from './types'
import { minutes, parseRange, to24, type Weekday } from './time'

/** "-do-", "-do", "do", '"', "〃", "ditto", "- do -" all mean "same as the cell above". */
export const isDitto = (s: string) => /^(?:-*\s*do\s*-*|["“”〃'']{1,2}|-\s*["“”]\s*-|ditto|same|\^)$/i.test(s.trim())

const blank = (s: string | undefined) => !s || !s.trim() || /^[-–—_.·]+$/.test(s.trim())

/** Row label → start/end. A lone start time ends where the next row begins. */
export function rowTimes(labels: string[]): { start: string; end: string }[] {
  const parsed = labels.map(l => parseRange(l) ?? (to24(l.replace(/\s+/g, '')) ? { start: to24(l.replace(/\s+/g, '')), end: '' } : null))
  return parsed.map((p, i) => {
    if (!p) return { start: '', end: '' }
    if (p.end) return p
    const next = parsed.slice(i + 1).find(Boolean)
    const step = next ? minutes(next.start) - minutes(p.start) : 30
    const end = minutes(p.start) + (step > 0 && step <= 180 ? step : 30)
    return { start: p.start, end: `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}` }
  })
}

/**
 * Walk each day column top to bottom. A new subject opens a meeting; a ditto
 * extends it; an empty cell closes it. A ditto in the room column inherits the
 * last room written in that column, even under a new subject (BSU portals do this).
 */
export function resolveGrid(grid: Grid): { drafts: Draft[]; orphans: number } {
  const rows = [...grid.rows].filter(r => r.start && r.end).sort((a, b) => minutes(a.start) - minutes(b.start))
  const drafts: Draft[] = []
  let orphans = 0
  for (const day of grid.days) {
    let open: Draft | null = null
    let lastRoom = ''
    let lastSubject = ''
    const close = () => { if (open) drafts.push(open); open = null }
    for (const row of rows) {
      const cell = row.cells[day]
      const subj = cell?.subject?.trim() ?? ''
      const roomRaw = cell?.room?.trim() ?? ''
      if (blank(subj) && blank(roomRaw)) { close(); lastSubject = ''; continue }
      if (!blank(roomRaw) && !isDitto(roomRaw)) lastRoom = roomRaw
      if (blank(subj) || isDitto(subj)) {
        if (open) {
          const o: Draft = open
          o.end = row.end
          if (!blank(roomRaw) && !isDitto(roomRaw) && !o.room) o.room = roomRaw
          continue
        }
        if (isDitto(subj) && lastSubject) {
          // The opening row was missed but the subject above is known: reopen it.
          open = mk(lastSubject, lastRoom, day, row)
          open.low.add('time')
          continue
        }
        orphans++
        continue
      }
      close()
      lastSubject = subj
      const room = isDitto(roomRaw) ? lastRoom : blank(roomRaw) ? '' : roomRaw
      open = mk(subj, room, day, row)
    }
    close()
  }
  return { drafts, orphans }
}

function mk(subjectCell: string, room: string, day: Weekday, row: GridRow): Draft {
  // A subject cell may hold "CpE 413 / RM 202" or "CpE 413\nLecture" when no Room subcolumn exists.
  let subject = subjectCell.replace(/\s+/g, ' ').trim()
  let r = room
  if (!r) {
    const split = subject.match(/^(.+?)\s*(?:\/|\||@|\bin\b)\s*(.+)$/i)
    if (split) { subject = split[1].trim(); r = split[2].trim() }
  }
  return { code: subject, subject, instructor: '', room: r, days: [day], start: row.start, end: row.end, low: new Set(r ? [] : ['room']) }
}
