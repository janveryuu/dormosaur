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

  const tokens = normalized.split(/[\s,/\-+&]+/)
  for (const token of tokens) {
    const clean = token.toLowerCase().trim()
    if (DAY_MAP[clean]) {
      found.add(DAY_MAP[clean])
    }
  }

  const result = Array.from(found).sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))
  return result
}

function parseTime(timeStr: string): string {
  const match = timeStr.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
  if (!match) return ''

  let hours = parseInt(match[1], 10)
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  const period = match[3] ? match[3].toLowerCase() : null
  if (minutes > 59 || (period ? hours < 1 || hours > 12 : hours > 23)) return ''

  if (period === 'pm' && hours < 12) hours += 12
  if (period === 'am' && hours === 12) hours = 0

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function parseTimeRange(text: string): { start: string; end: string } {
  // Matches patterns like "8:30-9:50am", "10:15 to 12", "1pm-2:40pm", "15:00-16:20"
  const rangeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
  const match = text.match(rangeRegex)

  if (!match) return { start: '', end: '' }

  let rawStart = match[1].trim()
  const rawEnd = match[2].trim()

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

export function parseRawScheduleLine(line: string, index: number): ClassEntry | null {
  let trimmed = line.trim()
  if (!trimmed) return null

  // Skip year/semester header lines
  if (/^(first|second|third|fourth|fifth)\s+(year|semester|sem)(\s*[-–]\s*(first|second)\s+semester)?$/i.test(trimmed)) {
    return null
  }

  // 1. Course code detection (e.g. FE 407, ENGG 409, Fili 102, ChE 434, MATH 101, CS150)
  const codeMatch = trimmed.match(/\b([A-Za-z]{2,8})\s*[-_]?\s*(\d{2,4}[A-Za-z]?)\b/)
  const detectedCode = codeMatch ? `${codeMatch[1].toUpperCase()} ${codeMatch[2]}` : ''
  if (codeMatch && /^(room|rm|lab|hall|time|bsu|year)$/i.test(codeMatch[1])) return null

  // Clean unit notes like "(1 units)" or "(3 units)"
  trimmed = trimmed.replace(/\(\s*\d+\s*(?:units?|credits?)\s*\)/gi, '').trim()

  // 2. Times
  const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi
  const hasExplicitTime = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i.test(trimmed)
  const { start, end } = parseTimeRange(trimmed)

  // Strip time strings out before attempting room or subject extraction
  const textWithoutTime = trimmed.replace(timeRegex, '').trim()

  // 3. Days
  const hasExplicitDays = /\b(mon(?:day)?|tue(?:sday|s)?|wed(?:nesday)?|thu(?:rsday|rs)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|mwf|tth|mw)\b/i.test(trimmed)
  const days = parseDays(trimmed)

  // 4. Room (must not be a time fragment like "00pm-5")
  const roomMatch = textWithoutTime.match(/(?:sci hall|hall|lab|tech center|west wing|humanities|room|bldg|building)\s*([A-Za-z0-9\s-]+\s*\d{1,4}[A-Za-z]?)/i)
  let room = roomMatch ? roomMatch[0].trim() : ''
  if (/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)|00pm/i.test(room) && !/hall|lab|room|bldg/i.test(room)) {
    room = ''
  }

  // 5. Instructor
  const instructorMatch = textWithoutTime.match(/\b(?:instructor\s*:|dr\.?|prof\.?|coach)\s+([A-Za-z][A-Za-z.'-]+(?:\s+[A-Za-z][A-Za-z.'-]+)?)/i)
  const instructor = instructorMatch ? instructorMatch[1].trim() : ''

  // 6. Subject Title
  let subject = textWithoutTime
    .replace(codeMatch ? codeMatch[0] : '', '')
    .replace(room, '')
    .replace(instructorMatch ? instructorMatch[0] : '', '')
    .replace(/\b(mon(?:day)?|tue(?:sday|s)?|wed(?:nesday)?|thu(?:rsday|rs)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|mwf|tth|mw)\b/gi, '')
    .replace(/^[-_\s:]+/, '')
    .replace(/[-_\s:]+$/, '')
    .trim()

  const finalCode = detectedCode
  if (!subject || subject.length < 2) {
    subject = finalCode
  }

  const color = ((index % 5) + 1) as SubjectColor

  const lowFields: string[] = []
  if (!codeMatch) lowFields.push('code')
  if (!hasExplicitTime || !start || !end || end <= start) lowFields.push('time', 'start', 'end')
  if (!hasExplicitDays || !days.length) lowFields.push('days')
  if (!room) lowFields.push('room')
  if (!instructor) lowFields.push('instructor')

  return {
    id: `parsed-${Date.now()}-${index}`,
    subject: subject.charAt(0).toUpperCase() + subject.slice(1),
    code: finalCode,
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

export function parseRawSchedule(text: string, options: { requireExplicitMeeting?: boolean } = {}): ClassEntry[] {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !/^(first|second|third|fourth|fifth)\s+(year|semester|sem)(\s*[-–]\s*(first|second)\s+semester)?$/i.test(l))
    .filter((l) => !/^[A-Za-z0-9\s-]+[-_]\s*CLASS SCHEDULE$/i.test(l))

  if (rawLines.length === 0) return []

  const DAY_NAME_MAP: Record<string, string> = {
    m: 'Mon', mon: 'Mon', monday: 'Mon',
    tu: 'Tue', tue: 'Tue', tues: 'Tue', tuesday: 'Tue',
    w: 'Wed', wed: 'Wed', wednesday: 'Wed',
    th: 'Thu', thu: 'Thu', thur: 'Thu', thurs: 'Thu', thursday: 'Thu',
    f: 'Fri', fri: 'Fri', friday: 'Fri',
    sa: 'Sat', sat: 'Sat', saturday: 'Sat',
    su: 'Sun', sun: 'Sun', sunday: 'Sun',
  }

  const result: ClassEntry[] = []
  let currentDay = ''
  let hasDayHeader = false
  let index = 0

  for (const line of rawLines) {
    const cleanLine = line.trim()
    const cleanLower = cleanLine.toLowerCase().replace(/[:\s]+$/, '')

    // Check if standalone line is purely a Day Header (e.g. "MON", "MON:", "THURS", "TUESDAY")
    if (DAY_NAME_MAP[cleanLower]) {
      currentDay = DAY_NAME_MAP[cleanLower]
      hasDayHeader = true
      continue // Skip creating a class entry for day headers!
    }

    if (options.requireExplicitMeeting) {
      const code = cleanLine.match(/\b([A-Za-z]{2,8})\s*[-_]?\s*(\d{2,4}[A-Za-z]?)\b/)
      const range = cleanLine.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–|—)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i)
      const hasDays = hasDayHeader || /\b(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|mwf|tth|mw)\b/i.test(cleanLine)
      // OCR must not turn headers, rooms or arbitrary text into invented classes.
      if (!code || /^(room|rm|lab|hall|time|bsu|year)$/i.test(code[1]) || !range || !hasDays) continue
      const { start, end } = parseTimeRange(range[0].replace(/—/g, '-'))
      if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(end) || end <= start) continue
    }

    // Check if line matches parenthetical entry: e.g. "7:00am - 10:00am (Food Chem/Even-Lab 2)"
    const parentheticalMatch = cleanLine.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*\(([^)]+)\)/i)
    if (parentheticalMatch) {
      const startStr = parentheticalMatch[1]
      const endStr = parentheticalMatch[2]
      const insideParen = parentheticalMatch[3].trim()

      const { start, end } = parseTimeRange(`${startStr} - ${endStr}`)

      let subject = insideParen
      let room = ''

      if (insideParen.includes('/')) {
        const parts = insideParen.split('/')
        subject = parts[0].trim()
        room = parts[1].trim()
      }

      const codeMatch = subject.match(/\b([A-Za-z]{2,8})\s*[-_]?\s*(\d{2,4}[A-Za-z]?)\b/)
      const code = codeMatch ? `${codeMatch[1].toUpperCase()} ${codeMatch[2]}` : ''
      const color = ((index % 5) + 1) as SubjectColor

      result.push({
        id: `parsed-${Date.now()}-${index}`,
        subject: subject.charAt(0).toUpperCase() + subject.slice(1),
        code,
        instructor: '',
        room,
        days: parseDays(cleanLine).length ? parseDays(cleanLine) : currentDay ? [currentDay] : [],
        start,
        end,
        color,
        confidence: 'low',
        lowFields: ['instructor', ...(!code ? ['code'] : []), ...(!room ? ['room'] : []), ...(!currentDay && !parseDays(cleanLine).length ? ['days'] : [])],
      })
      index++
      continue
    }

    // Fallback to single line parser
    const entry = parseRawScheduleLine(cleanLine, index)
    if (entry) {
      // Ensure day headers aren't subject titles
      const cleanSubj = (entry.subject || '').trim().toLowerCase()
      if (DAY_NAME_MAP[cleanSubj]) {
        currentDay = DAY_NAME_MAP[cleanSubj]
        continue
      }

      // Inherit currentDay if line didn't explicitly specify multiple days
      if (entry.lowFields?.includes('days') && currentDay) {
        entry.days = [currentDay]
      }

      if (options.requireExplicitMeeting) {
        // OCR names are not reliable evidence of an instructor. Keep uncertain
        // titles/rooms editable without inventing a teacher from the course code.
        entry.instructor = ''
        entry.subject = entry.code
        entry.confidence = 'low'
        entry.lowFields = [...new Set([...(entry.lowFields || []), 'subject', 'instructor', 'code'])]
      }
      result.push(entry)
      index++
    }
  }

  return result
}
