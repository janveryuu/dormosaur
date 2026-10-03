import type { ClassEntry } from './data'
import { addDays, clockAt, validTimeZone, DAYS } from './copilot/time'
import { localDateTimeToIso, validTime } from './date-time'

const DAY_CODES: Record<string, string> = {
  Mon: 'MO',
  Tue: 'TU',
  Wed: 'WE',
  Thu: 'TH',
  Fri: 'FR',
  Sat: 'SA',
  Sun: 'SU',
}

function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function getNextDateForDay(dayName: string, timezone: string, now = new Date()): string {
  const clock = clockAt(now, timezone)
  return addDays(clock.date, (DAYS.indexOf(dayName) - DAYS.indexOf(clock.day) + 7) % 7)
}

export function generateIcsContent(classList: ClassEntry[], timezone = 'Asia/Manila', now = new Date()): string {
  timezone = validTimeZone(timezone) || 'Asia/Manila'
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dormosaur//Class Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Dormosaur Schedule',
    `X-WR-TIMEZONE:${timezone}`,
  ]

  classList.forEach((cls) => {
    const days = cls.days.filter(day => DAY_CODES[day])
    if (!days.length || !validTime(cls.start) || !validTime(cls.end) || cls.end <= cls.start) return
    const baseDate = getNextDateForDay(days[0], timezone, now)
    const localStamp = (time: string) => `${baseDate.replace(/-/g, '')}T${time.replace(':', '')}00`
    const byDays = days.map(day => DAY_CODES[day]).join(',')

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:dormosaur-${encodeURIComponent(cls.id)}@dormosaur.app`)
    lines.push(`DTSTAMP:${formatDateToICS(now)}`)
    lines.push(`DTSTART;TZID=${timezone}:${localStamp(cls.start)}`)
    lines.push(`DTEND;TZID=${timezone}:${localStamp(cls.end)}`)
    lines.push(`SUMMARY:${cls.code} - ${cls.subject}`)
    lines.push(`LOCATION:${cls.room}`)
    lines.push(`DESCRIPTION:Instructor: ${cls.instructor} | Managed by Dormosaur`)
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDays}`)
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcsFile(classList: ClassEntry[], timezone = 'Asia/Manila') {
  const csData = generateIcsContent(classList, timezone)
  const blob = new Blob([csData], { type: 'text/calendar;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'dormosaur_schedule.ics')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getGoogleCalendarUrl(cls: ClassEntry, timezone = 'Asia/Manila'): string {
  timezone = validTimeZone(timezone) || 'Asia/Manila'
  const day = cls.days.find(day => DAY_CODES[day])
  if (!day || !validTime(cls.start) || !validTime(cls.end) || cls.end <= cls.start) return 'https://calendar.google.com/calendar/'
  const baseDate = getNextDateForDay(day, timezone)
  const startDate = new Date(localDateTimeToIso(baseDate, cls.start, timezone))
  const endDate = new Date(localDateTimeToIso(baseDate, cls.end, timezone))

  const datesStr = `${formatDateToICS(startDate)}/${formatDateToICS(endDate)}`
  const title = encodeURIComponent(`${cls.code} - ${cls.subject}`)
  const details = encodeURIComponent(`Instructor: ${cls.instructor}\nLocation: ${cls.room}`)
  const location = encodeURIComponent(cls.room)

  const byDays = cls.days.filter(day => DAY_CODES[day]).map((d) => DAY_CODES[d]).join(',')
  const recur = encodeURIComponent(`RRULE:FREQ=WEEKLY;BYDAY=${byDays}`)

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesStr}&details=${details}&location=${location}&recur=${recur}&ctz=${encodeURIComponent(timezone)}`
}

const REVERSE_DAY_MAP: Record<string, string> = {
  MO: 'Mon',
  TU: 'Tue',
  WE: 'Wed',
  TH: 'Thu',
  FR: 'Fri',
  SA: 'Sat',
  SU: 'Sun',
}

function eventClock(line: string, timezone: string) {
  const match = line.match(/:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(?:\d{2})?(Z)?$/)
  if (!match) return null
  const date = `${match[1]}-${match[2]}-${match[3]}`, time = `${match[4]}:${match[5]}`
  const sourceZone = line.match(/TZID=([^;:]+)/)?.[1]
  try {
    const instant = match[6] ? `${date}T${time}:00Z` : sourceZone ? localDateTimeToIso(date, time, sourceZone) : null
    return instant ? clockAt(new Date(instant), timezone) : clockAt(new Date(localDateTimeToIso(date, time, timezone)), timezone)
  } catch { return null }
}

export function parseIcsContent(icsText: string, timezone = 'Asia/Manila'): ClassEntry[] {
  if (!icsText || !icsText.includes('BEGIN:VCALENDAR')) {
    return []
  }

  const events = icsText.replace(/\r?\n[ \t]/g, '').split('BEGIN:VEVENT')
  const classes: ClassEntry[] = []

  events.slice(1).forEach((eventBlock, index) => {
    const lines = eventBlock.split(/\r?\n/)
    let summary = ''
    let location = ''
    let description = ''
    let start = ''
    let end = ''
    let startDay = ''
    let days: string[] = []

    lines.forEach((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('SUMMARY:')) {
        summary = trimmed.replace('SUMMARY:', '').trim()
      } else if (trimmed.startsWith('LOCATION:')) {
        location = trimmed.replace('LOCATION:', '').trim()
      } else if (trimmed.startsWith('DESCRIPTION:')) {
        description = trimmed.replace('DESCRIPTION:', '').trim()
      } else if (trimmed.startsWith('DTSTART')) {
        const clock = eventClock(trimmed, timezone)
        start = clock?.time || ''
        startDay = clock?.day || ''
      } else if (trimmed.startsWith('DTEND')) {
        end = eventClock(trimmed, timezone)?.time || ''
      } else if (trimmed.startsWith('RRULE:')) {
        const byDayMatch = trimmed.match(/BYDAY=([A-Z,]+)/)
        if (byDayMatch) {
          const rawDays = byDayMatch[1].split(',')
          days = rawDays
            .map((d) => REVERSE_DAY_MAP[d.trim().toUpperCase()])
            .filter(Boolean)
        }
      }
    })

    if (!days.length && startDay) days = [startDay]
    if (summary && validTime(start) && validTime(end) && end > start && days.length) {
      let code = summary
      let subject = summary
      if (summary.includes(' - ')) {
        const parts = summary.split(' - ')
        code = parts[0].trim()
        subject = parts.slice(1).join(' - ').trim()
      } else if (summary.includes(':')) {
        const parts = summary.split(':')
        code = parts[0].trim()
        subject = parts.slice(1).join(':').trim()
      }

      let instructor = ''
      if (description.includes('Instructor:')) {
        instructor = description.split('Instructor:')[1].split('|')[0].trim()
      }

      classes.push({
        id: `ics-${Date.now()}-${index}`,
        code: code || '',
        subject: subject || code,
        instructor: instructor || '',
        room: location || '',
        days,
        start,
        end,
        color: (((index % 5) + 1) as 1 | 2 | 3 | 4 | 5),
        confidence: 'high',
      })
    }
  })

  return classes
}
