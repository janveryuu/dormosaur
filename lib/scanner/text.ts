import type { Draft, Field } from './types'
import { dayOf, parseDayString, parseRange, sortDays, TIME_RANGE, type Weekday } from './time'
import { isDitto } from './grid'

const CODE = /\b([A-Za-z]{2,8})\s*[-_]?\s*(\d{1,4}[A-Za-z]?)\b/
const NOT_CODE = /^(rm|room|lab|hall|bldg|building|sec|section|blk|block|year|yr|sem|units?|complab|comlab|cl|gym|ave|st|no|grade|pm|am|avr)$/i
const ROOM_WORD = String.raw`(?:rm|room|bldg|building|hall|lab(?:oratory)?|complab|comlab|cl|gym|court|field|library|lib|avr|online|virtual|zoom|google meet|gmeet|ms teams|teams|tba)`
// Room: optional one-word prefix (Sci Hall, Micro Lab, CPE LAB) + keyword + optional identifier (204, B11, 3), or a fused code (COMPLAB2, RM202(CICS)).
const ROOM = new RegExp(String.raw`(?:\b[A-Za-z]+ (?=${ROOM_WORD}\b))?\b${ROOM_WORD}\b\.?(?:\s*[A-Za-z]?\d+[A-Za-z]?(?:\s*\([^)|]*\)?)?)?|\b[A-Za-z]{2,}\d{1,4}[A-Za-z]?(?:\s*\([^)|]*\)?)?`, 'i')
const TEACHER = /\b(?:instructor|prof(?:essor)?|dr|engr|mr|ms|mrs|sir|ma'?am|teacher)\.?\s*:?\s*([A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,3})/i
const DAY_WORD = /\b(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs?(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b\.?/gi
const NOISE = /^(?:time|day|days|schedule|class schedule|subject|course|code|room|instructor|units?|total.*|summer|semester|school year|sy\b.*|name\b.*|student\b.*|program\b.*|section\b.*)\b/i
const SEP = ' ¦ '

export type TextParse = { drafts: Draft[]; confident: boolean; looksLikeGrid: boolean }

/** Day tokens: "MWF", "TTh", "M/W", "Mon & Wed", "Tuesday", "TuTh"; a lone letter only as its own table cell. */
function daysIn(line: string): { days: Weekday[]; spans: string[] } {
  const days: Weekday[] = []
  const spans: string[] = []
  for (const cell of line.split('¦')) {
    const c = cell.trim()
    if (/^[MTWRFSU]$/.test(c)) { days.push(dayOf(c, true)!); spans.push(c); continue }
    for (const tok of c.split(/[\s,;()[\]]+/)) {
      const t = tok.replace(/[.:]$/, '')
      if (!t || /\d/.test(t) || t.length < 2 || NOT_CODE.test(t)) continue
      const parts = t.split(/[/&+-]/).filter(Boolean)
      const words = parts.map(p => dayOf(p))
      if (words.length && words.every(Boolean)) { days.push(...(words as Weekday[])); spans.push(tok); continue }
      if (/^[MTWRFSU]/.test(t) && /^(?:M|T|W|R|F|S|U|Th|Tu|Sa|Su)+$/.test(t.replace(/[/-]/g, ''))) {
        const d = parseDayString(t)
        if (d.length) { days.push(...d); spans.push(tok) }
      }
    }
  }
  return { days: sortDays(days), spans }
}

export function parseScheduleText(text: string): TextParse {
  const lines = text.split(/\r?\n/).map(l => l.replace(/\t+/g, SEP).replace(/ {2,}/g, SEP).trim()).filter(Boolean)
  // Text copied out of a timetable grid ("-do-" ditto marks, Subj/Room headers) has lost its columns.
  const looksLikeGrid = lines.filter(l => /(^|\s)-do-?(\s|$|\d)/i.test(l)).length >= 3 || lines.some(l => /\bsubj\b.*\broom\b.*\bsubj\b.*\broom\b/i.test(l))
  const drafts: Draft[] = []
  let current: Weekday[] = []
  let meaningful = 0, unparsed = 0

  for (const raw of lines) {
    const line = raw.replace(/[ \u00a0]+/g, ' ')
    const bare = line.replace(/[¦:\-–—|]+/g, ' ').trim()
    const headerDays = bare.split(/[\s,/&]+/).map(w => dayOf(w))
    if (headerDays.length && headerDays.length <= 3 && headerDays.every(Boolean)) { current = sortDays(headerDays as Weekday[]); continue }
    if (NOISE.test(bare) && !TIME_RANGE.test(line)) continue
    const range = parseRange(line)
    if (!range) { if (CODE.test(line) && !NOT_CODE.test(line.match(CODE)![1])) { meaningful++; unparsed++ } continue }
    meaningful++
    const low = new Set<Field>()
    const tm = line.match(TIME_RANGE)!
    let rest = line.replace(tm[0], SEP)
    const { days: inline, spans } = daysIn(rest)
    for (const s of spans) rest = rest.replace(new RegExp(String.raw`(^|[\s¦,;(])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[\s¦,;)])`), `$1${SEP}`)
    rest = rest.replace(DAY_WORD, SEP)
    const days = inline.length ? inline : current
    if (!days.length) low.add('days')

    let subject = '', room = ''
    const paren = rest.match(/\(([^()]+\/[^()]+)\)/)
    if (paren) {
      const [s, r] = paren[1].split('/').map(x => x.trim())
      subject = s; room = r
      rest = rest.replace(paren[0], SEP)
    }
    const teacher = rest.match(TEACHER)
    let instructor = teacher ? teacher[1].trim() : ''
    if (teacher) rest = rest.replace(teacher[0], SEP)

    let code = ''
    const cm = rest.match(CODE)
    if (cm && !NOT_CODE.test(cm[1])) { code = `${cm[1]} ${cm[2]}`; rest = rest.replace(cm[0], SEP) }
    if (!room) {
      for (const cell of rest.split('¦')) {
        const rm = cell.match(ROOM)
        if (rm && rm[0].trim().length >= 2) { room = rm[0].trim(); rest = rest.replace(rm[0], SEP); break }
      }
    }
    const cells = rest.split('¦').map(s => s.replace(/^[\s\-–—:,.|]+|[\s\-–—:,|]+$/g, '').trim()).filter(s => s && !isDitto(s) && !/^\d+(\.\d+)?\s*(units?)?$/i.test(s))
    // In a table row the instructor is the trailing "Surname, I." cell.
    if (!instructor) {
      const last = cells[cells.length - 1]
      if (cells.length >= 2 && last && /^[A-Z][A-Za-z'-]+(?: [A-Z][A-Za-z'-]+)*,\s*[A-Z]\.?(?:\s*[A-Z]\.?)*$/.test(last)) instructor = cells.pop()!
    }
    if (!subject) subject = [...cells].sort((a, b) => b.length - a.length)[0] ?? ''
    if (!code && !subject) { unparsed++; continue }
    if (!room) low.add('room')
    drafts.push({ code: code || subject, subject: subject || code, instructor, room, days, start: range.start, end: range.end, low })
  }

  const confident = !looksLikeGrid && drafts.length > 0 && unparsed === 0 && meaningful === drafts.length
    && drafts.every(d => !d.low.has('days') && !d.low.has('time') && d.subject.length <= 80)
  return { drafts, confident, looksLikeGrid }
}
