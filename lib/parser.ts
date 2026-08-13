import type { ClassEntry, SubjectColor } from './data'

const DAY_MAP: Record<string, string> = {
  m: 'Mon',
  mon: 'Mon',
  monday: 'Mon',
  tu: 'Tue',
  tue: 'Tue',
  tues: 'Tue',
  tuesday: 'Tue',
  w: 'Wed',
  wed: 'Wed',
  wednesday: 'Wed',
  th: 'Thu',
  thu: 'Thu',
  thur: 'Thu',
  thurs: 'Thu',
  thursday: 'Thu',
  f: 'Fri',
  fri: 'Fri',
  friday: 'Fri',
  sa: 'Sat',
  sat: 'Sat',
  saturday: 'Sat',
  su: 'Sun',
  sun: 'Sun',
  sunday: 'Sun',
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function parseDays(text: string): string[] {
  const found = new Set<string>()

  // Check common combined abbreviations first
  const normalized = text.replace(/tth/gi, 'Tue Thu').replace(/mwf/gi, 'Mon Wed Fri').replace(/mw/gi, 'Mon Wed')

  const tokens = normalized.split(/[\s,/\-+]+/)
  for (const token of tokens) {
    const clean = token.toLowerCase().trim()
    if (DAY_MAP[clean]) {
      found.add(DAY_MAP[clean])
    }
  }

  const result = Array.from(found).sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))
  return result.length > 0 ? result : ['Mon', 'Wed', 'Fri']
}

function parseTime(timeStr: string): string {
  const match = timeStr.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
  if (!match) return '09:00'

  let hours = parseInt(match[1], 10)
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  const period = match[3] ? match[3].toLowerCase() : null

  if (period === 'pm' && hours < 12) hours += 12
  if (period === 'am' && hours === 12) hours = 0

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function parseTimeRange(text: string): { start: string; end: string } {
  // Matches patterns like "8:30-9:50am", "10:15 to 12", "1pm-2:40pm", "15:00-16:20"
  const rangeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
  const match = text.match(rangeRegex)

  if (!match) return { start: '09:00', end: '10:15' }

  let rawStart = match[1].trim()
  let rawEnd = match[2].trim()

  // If end has am/pm but start doesn't, infer am/pm for start
  const endPeriod = rawEnd.match(/(am|pm)$/i)?.[0]
  const startPeriod = rawStart.match(/(am|pm)$/i)?.[0]

  if (endPeriod && !startPeriod) {
    const startHour = parseInt(rawStart.split(':')[0], 10)
    const endHour = parseInt(rawEnd.split(':')[0], 10)
    // If end is pm and start hour is <= end hour or <= 12, match period
    if (endPeriod.toLowerCase() === 'pm' && startHour < 12 && startHour <= endHour) {
      rawStart += 'pm'
    } else if (endPeriod.toLowerCase() === 'pm' && startHour >= 8 && startHour < 12) {
      rawStart += 'am'
    } else {
      rawStart += endPeriod
    }
  }

  return {
    start: parseTime(rawStart),
    end: parseTime(rawEnd),
  }
}

export function parseRawScheduleLine(line: string, index: number): ClassEntry {
  let trimmed = line.trim()
  if (!trimmed) return null as unknown as ClassEntry

  // Skip year/semester header lines
  if (/^(first|second|third|fourth|fifth)\s+(year|semester|sem)(\s*[-–]\s*(first|second)\s+semester)?$/i.test(trimmed)) {
    return null as unknown as ClassEntry
  }

  // 1. Course code detection (e.g. FE 407, ENGG 409, Fili 102, ChE 434, MATH 101, CS150)
  const codeMatch = trimmed.match(/([A-Za-z]{2,5})\s*[-_]?\s*(\d{2,4}[A-Za-z]?)/)
  const code = codeMatch ? `${codeMatch[1].toUpperCase()} ${codeMatch[2]}` : `COURSE ${index + 1}`

  // Clean unit notes like "(1 units)" or "(3 units)"
  trimmed = trimmed.replace(/\(\s*\d+\s*(?:units?|credits?)\s*\)/gi, '').trim()

  // 2. Times
  const hasExplicitTime = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i.test(trimmed)
  let { start, end } = parseTimeRange(trimmed)

  // Stagger default times if no explicit time in line
  if (!hasExplicitTime) {
    const defaultSlots = [
      { start: '08:00', end: '09:15' },
      { start: '09:30', end: '10:45' },
      { start: '11:00', end: '12:15' },
      { start: '13:00', end: '14:15' },
      { start: '14:30', end: '15:45' },
      { start: '16:00', end: '17:15' },
    ]
    const slot = defaultSlots[index % defaultSlots.length]
    start = slot.start
    end = slot.end
  }

  // 3. Days
  const hasExplicitDays = /\b(mon|tue|wed|thu|fri|sat|sun|mwf|tth|mw)\b/i.test(trimmed)
  const days = parseDays(trimmed)

  // 4. Room
  const roomMatch = trimmed.match(/(?:sci hall|hall|lab|tech center|west wing|humanities|room|bldg|building)?\s*([A-Za-z0-9\s-]+\s*\d{1,4}[A-Za-z]?)/i)
  const room = roomMatch ? roomMatch[0].trim() : 'Room TBA'

  // 5. Instructor
  const instructorMatch = trimmed.match(/(?:dr\.?|prof\.?|coach)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)
  const instructor = instructorMatch && instructorMatch[0].length > 2 ? instructorMatch[0].trim() : 'TBA'

  // 6. Subject Title
  let subject = trimmed
    .replace(codeMatch ? codeMatch[0] : '', '')
    .replace(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi, '')
    .replace(/\b(mon|tue|wed|thu|fri|sat|sun|mwf|tth|mw)\b/gi, '')
    .replace(/^[-_\s:]+/, '')
    .replace(/[-_\s:]+$/, '')
    .trim()

  if (!subject || subject.length < 2) {
    subject = code
  }

  const color = ((index % 5) + 1) as SubjectColor

  const lowFields: string[] = []
  if (!codeMatch) lowFields.push('code')
  if (!hasExplicitTime) lowFields.push('time')
  if (!hasExplicitDays) lowFields.push('days')
  if (room === 'Room TBA') lowFields.push('room')

  return {
    id: `parsed-${Date.now()}-${index}`,
    subject: subject.charAt(0).toUpperCase() + subject.slice(1),
    code,
    instructor,
    room,
    days,
    start,
    end,
    color,
    confidence: lowFields.length === 0 ? 'high' : 'low',
    lowFields: lowFields.length > 0 ? lowFields : undefined,
  }
}

export function parseRawSchedule(text: string): ClassEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3)
    .filter((l) => !/^(first|second|third|fourth|fifth)\s+(year|semester|sem)(\s*[-–]\s*(first|second)\s+semester)?$/i.test(l))

  if (lines.length === 0) return []

  const parsed = lines
    .map((line, idx) => parseRawScheduleLine(line, idx))
    .filter(Boolean)

  return parsed
}
