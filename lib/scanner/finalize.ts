import type { ClassEntry, SubjectColor } from '@/lib/data'
import type { Draft, Field } from './types'
import { minutes, sortDays, WEEKDAYS } from './time'

const PLACEHOLDER = /^(?:tba|tbd|tba\.|n\/?a|none|null|-+|—|room tba|to be announced|unassigned)$/i
const LOOKS_LIKE_TIME = /\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}/i

/** "CpE413" → "CpE 413", "MATH-101" → "MATH 101", whitespace collapsed; case kept as printed. */
export function cleanCode(raw: string) {
  return raw.replace(/\s+/g, ' ').trim()
    .replace(/^([A-Za-z]{2,8})\s*[-_]?\s*(\d{2,4}[A-Za-z]?)$/, '$1 $2')
}

/** Removes only brackets that wrap the WHOLE value: "(ONLINE)" → "ONLINE", "RM 202 (CICS)" stays. */
export function unwrap(raw: string) {
  let s = raw.replace(/\s+/g, ' ').trim()
  while (/^\(([^()]*)\)$/.test(s)) s = s.slice(1, -1).trim()
  return s
}

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Drafts → saved classes:
 * clean fields, flag what needs a look, merge one subject's identical meetings
 * across days, give each subject one colour, and flag clashing times.
 */
export function finalize(drafts: Draft[]): ClassEntry[] {
  const cleaned = drafts.flatMap(d => {
    const low = new Set<Field>(d.low)
    const code = cleanCode(unwrap(d.code || d.subject))
    let subject = unwrap(d.subject || d.code).replace(/\s+/g, ' ')
    if (!code && !subject) return []
    if (/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?$/i.test(code)) return []
    if (!subject) subject = code
    let room = unwrap(d.room)
    if (PLACEHOLDER.test(room) || LOOKS_LIKE_TIME.test(room)) { room = ''; low.add('room') }
    let instructor = unwrap(d.instructor)
    if (PLACEHOLDER.test(instructor)) instructor = ''
    const days = sortDays(d.days)
    if (!days.length) low.add('days')
    const ok = /^\d{2}:\d{2}$/
    let { start, end } = d
    if (!ok.test(start) || !ok.test(end) || minutes(end) <= minutes(start)) { low.add('time'); if (!ok.test(start)) start = ''; if (!ok.test(end) || (start && minutes(end) <= minutes(start))) end = '' }
    else {
      const len = minutes(end) - minutes(start)
      if (len < 20 || len > 6 * 60 || minutes(start) < 6 * 60 || minutes(end) > 22 * 60 + 30) low.add('time')
    }
    return [{ code, subject, instructor, room, days, start, end, low }]
  })

  // Merge identical meetings of one subject held on several days.
  const merged: typeof cleaned = []
  for (const d of cleaned) {
    const twin = merged.find(m => key(m.code) === key(d.code) && m.start === d.start && m.end === d.end && key(m.room) === key(d.room) && key(m.instructor) === key(d.instructor))
    if (twin && d.start) {
      twin.days = sortDays([...twin.days, ...d.days])
      for (const f of d.low) twin.low.add(f)
      if (!twin.subject || twin.subject === twin.code) twin.subject = d.subject
    } else merged.push({ ...d, low: new Set(d.low) })
  }

  // Same-day clashes are usually a misread. Flag both for review.
  for (const day of WEEKDAYS) {
    const list = merged.filter(m => m.days.includes(day) && m.start && m.end)
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j]
      if (minutes(a.start) < minutes(b.end) && minutes(b.start) < minutes(a.end)) { a.low.add('time'); b.low.add('time') }
    }
  }

  // One colour per subject, in order of first appearance.
  const palette = new Map<string, SubjectColor>()
  const sorted = [...merged].sort((a, b) => WEEKDAYS.indexOf(a.days[0] ?? 'Sun') - WEEKDAYS.indexOf(b.days[0] ?? 'Sun') || (a.start || '99').localeCompare(b.start || '99'))
  for (const m of sorted) if (!palette.has(key(m.code))) palette.set(key(m.code), ((palette.size % 5) + 1) as SubjectColor)

  return sorted.map((m, i) => ({
    id: `scan-${Date.now().toString(36)}-${i}`,
    code: m.code,
    subject: m.subject,
    instructor: m.instructor,
    room: m.room,
    days: m.days,
    start: m.start,
    end: m.end,
    color: palette.get(key(m.code)) ?? 1,
    confidence: m.low.size ? 'low' as const : 'high' as const,
    lowFields: m.low.size ? [...m.low] : undefined,
  }))
}
