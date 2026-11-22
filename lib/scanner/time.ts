/** Time and day helpers shared by every scanner path. Times are HH:MM, 24-hour. */

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export type Weekday = (typeof WEEKDAYS)[number]

const DAY_ALIASES: Record<string, Weekday> = {
  m: 'Mon', mo: 'Mon', mon: 'Mon', monday: 'Mon', lunes: 'Mon',
  t: 'Tue', tu: 'Tue', tue: 'Tue', tues: 'Tue', tuesday: 'Tue', martes: 'Tue',
  w: 'Wed', we: 'Wed', wed: 'Wed', weds: 'Wed', wednesday: 'Wed', miyerkules: 'Wed',
  th: 'Thu', thu: 'Thu', thur: 'Thu', thurs: 'Thu', thursday: 'Thu', r: 'Thu', huwebes: 'Thu',
  f: 'Fri', fr: 'Fri', fri: 'Fri', friday: 'Fri', biyernes: 'Fri',
  sa: 'Sat', sat: 'Sat', saturday: 'Sat', s: 'Sat', sabado: 'Sat',
  su: 'Sun', sun: 'Sun', sunday: 'Sun', u: 'Sun', linggo: 'Sun',
}

/** "Thursday" / "THURS" / "Th." → "Thu". Single letters are accepted only when `loose`. */
export function dayOf(token: string, loose = false): Weekday | null {
  const t = token.toLowerCase().replace(/[^a-z]/g, '')
  if (!t || (!loose && t.length < 2)) return null
  return DAY_ALIASES[t] ?? null
}

export const sortDays = (days: Iterable<string>) =>
  [...new Set(days)].filter((d): d is Weekday => (WEEKDAYS as readonly string[]).includes(d)).sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))

/** Compact day strings: "MWF", "TTh", "M/W", "Mon-Wed-Fri", "TuTh", "MTWThF". */
export function parseDayString(raw: string): Weekday[] {
  const s = raw.trim()
  if (!s) return []
  const words = s.split(/[\s,/&+|;]+|(?<=[a-z])-(?=[a-z])/i).filter(Boolean)
  const asWords = words.map(w => dayOf(w)).filter(Boolean) as Weekday[]
  if (asWords.length === words.length && asWords.length) return sortDays(asWords)
  // Run-together letters: MTWThF, TTh, MWF, TuTh, SaSu
  const compact = s.replace(/[\s,/&+.-]/g, '')
  if (!/^[MTWRFSU][a-z]*$/i.test(compact) && !/^(?:M|T|W|R|F|S|U|Th|Tu|Sa|Su)+$/i.test(compact)) return sortDays(asWords)
  const out: Weekday[] = []
  const re = /(Th|Tu|Sa|Su|M|T|W|R|F|S|U)/gi
  let m: RegExpExecArray | null
  let consumed = 0
  while ((m = re.exec(compact))) {
    if (m.index !== consumed) return sortDays(asWords)
    consumed += m[0].length
    const d = dayOf(m[0], true)
    if (d) out.push(d)
  }
  return consumed === compact.length ? sortDays(out) : sortDays(asWords)
}

/** "7:00 AM" / "07:00" / "7am" / "1:30p" / "13:00" / "12nn" → "HH:MM" ('' when invalid). */
export function to24(raw: string, assume?: 'am' | 'pm'): string {
  const m = raw.trim().toLowerCase().replace(/\s+/g, '').replace(/\.(?=[apmn])/g, '').replace(/(?<=[ap])\.?m\.?$/, 'm')
    .match(/^(\d{1,2})(?:[:.h](\d{2}))?(am|pm|a|p|nn|noon)?$/)
  if (!m) return ''
  let h = Number(m[1])
  const min = Number(m[2] ?? 0)
  let period = m[3] ? (m[3].startsWith('a') ? 'am' : 'pm') : assume
  if (m[3] === 'nn' || m[3] === 'noon') { if (h !== 12) return ''; period = 'pm' }
  if (min > 59) return ''
  if (period) {
    if (h < 1 || h > 12) return h <= 23 && !m[3] ? `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}` : ''
    if (period === 'pm' && h < 12) h += 12
    if (period === 'am' && h === 12) h = 0
  } else if (h > 23) return ''
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const fromMinutes = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`

const TIME = String.raw`\d{1,2}(?:[:.]\d{2})?\s*(?:[ap]\.?m\.?|[ap]\b|nn\b|noon\b)?`
export const TIME_RANGE = new RegExp(String.raw`(${TIME})\s*(?:-|–|—|to|until|~)\s*(${TIME})`, 'i')

/**
 * "07:00 AM-07:30 AM", "8:30-9:50am", "1-2:30pm", "10:15 to 12", "15:00–16:20".
 * Missing meridiems are inferred from the other end and from class-hours sense.
 */
export function parseRange(raw: string): { start: string; end: string } | null {
  const m = raw.match(TIME_RANGE)
  if (!m) return null
  const a = m[1].trim(), b = m[2].trim()
  const period = (x: string) => { const p = x.replace(/[\d:.\s]/g, '').toLowerCase(); return !p ? null : p.startsWith('a') ? 'am' as const : 'pm' as const }
  const pa = period(a), pb = period(b)
  const flip = (p: 'am' | 'pm') => (p === 'am' ? 'pm' : 'am')
  let start = '', end = ''
  if (pa && pb) { start = to24(a); end = to24(b) }
  else if (pb) {
    // "8:30-9:50am", "1-2:30pm", "11-12:30pm": the start takes whichever period keeps it before the end.
    end = to24(b)
    const same = to24(a, pb), other = to24(a, flip(pb))
    start = same && end && minutes(same) < minutes(end) ? same : other && end && minutes(other) < minutes(end) ? other : same
  } else if (pa) {
    start = to24(a)
    const same = to24(b, pa), other = to24(b, flip(pa))
    end = same && start && minutes(same) > minutes(start) ? same : other || same
  } else {
    const ha = Number(a.match(/\d{1,2}/)![0]), hb = Number(b.match(/\d{1,2}/)![0])
    if (ha > 12 || hb > 12 || /^0\d/.test(a)) { start = to24(a); end = to24(b) }
    else {
      // No meridiem anywhere: assume school hours (7–11 am, 12–6 pm).
      start = to24(a, ha >= 7 && ha <= 11 ? 'am' : 'pm')
      end = to24(b, hb >= 7 && hb <= 11 ? 'am' : 'pm')
      if (start && end && minutes(end) <= minutes(start)) end = to24(b, 'pm')
    }
  }
  if (!start || !end || minutes(end) <= minutes(start)) return null
  return { start, end }
}
