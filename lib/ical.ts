import type { ClassEntry } from './data'

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

function getNextDateForDay(dayName: string): Date {
  const targetDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dayName)
  const date = new Date()
  const currentDay = date.getDay()
  let distance = targetDay - currentDay
  if (distance < 0) distance += 7
  date.setDate(date.getDate() + distance)
  return date
}

export function generateIcsContent(classList: ClassEntry[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dormosaur//Class Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Dormosaur Schedule',
  ]

  classList.forEach((cls) => {
    if (!cls.days || cls.days.length === 0) return

    const firstDay = cls.days[0]
    const baseDate = getNextDateForDay(firstDay)

    const [startH, startM] = cls.start.split(':').map(Number)
    const [endH, endM] = cls.end.split(':').map(Number)

    const startDate = new Date(baseDate)
    startDate.setHours(startH, startM, 0, 0)

    const endDate = new Date(baseDate)
    endDate.setHours(endH, endM, 0, 0)

    const byDays = cls.days.map((d) => DAY_CODES[d] || 'MO').join(',')

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:dormosaur-${cls.id}-${Date.now()}@dormosaur.app`)
    lines.push(`DTSTAMP:${formatDateToICS(new Date())}`)
    lines.push(`DTSTART:${formatDateToICS(startDate)}`)
    lines.push(`DTEND:${formatDateToICS(endDate)}`)
    lines.push(`SUMMARY:${cls.code} - ${cls.subject}`)
    lines.push(`LOCATION:${cls.room}`)
    lines.push(`DESCRIPTION:Instructor: ${cls.instructor} | Managed by Dormosaur`)
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDays};UNTIL=20261231T235959Z`)
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcsFile(classList: ClassEntry[]) {
  const csData = generateIcsContent(classList)
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

export function getGoogleCalendarUrl(cls: ClassEntry): string {
  const baseDate = getNextDateForDay(cls.days[0] || 'Mon')
  const [startH, startM] = cls.start.split(':').map(Number)
  const [endH, endM] = cls.end.split(':').map(Number)

  const startDate = new Date(baseDate)
  startDate.setHours(startH, startM, 0, 0)

  const endDate = new Date(baseDate)
  endDate.setHours(endH, endM, 0, 0)

  const datesStr = `${formatDateToICS(startDate)}/${formatDateToICS(endDate)}`
  const title = encodeURIComponent(`${cls.code} - ${cls.subject}`)
  const details = encodeURIComponent(`Instructor: ${cls.instructor}\nLocation: ${cls.room}`)
  const location = encodeURIComponent(cls.room)

  const byDays = cls.days.map((d) => DAY_CODES[d] || 'MO').join(',')
  const recur = encodeURIComponent(`RRULE:FREQ=WEEKLY;BYDAY=${byDays}`)

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesStr}&details=${details}&location=${location}&recur=${recur}`
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

export function parseIcsContent(icsText: string): ClassEntry[] {
  if (!icsText || !icsText.includes('BEGIN:VCALENDAR')) {
    return []
  }

  const events = icsText.split('BEGIN:VEVENT')
  const classes: ClassEntry[] = []

  events.slice(1).forEach((eventBlock, index) => {
    const lines = eventBlock.split(/\r?\n/)
    let summary = ''
    let location = ''
    let description = ''
    let start = ''
    let end = ''
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
        const timeMatch = trimmed.match(/T(\d{2})(\d{2})/)
        if (timeMatch) start = `${timeMatch[1]}:${timeMatch[2]}`
      } else if (trimmed.startsWith('DTEND')) {
        const timeMatch = trimmed.match(/T(\d{2})(\d{2})/)
        if (timeMatch) end = `${timeMatch[1]}:${timeMatch[2]}`
      } else if (trimmed.startsWith('RRULE:')) {
        const byDayMatch = trimmed.match(/BYDAY=([A-Z,]+)/)
        if (byDayMatch) {
          const rawDays = byDayMatch[1].split(',')
          days = rawDays
            .map((d) => REVERSE_DAY_MAP[d.trim().toUpperCase()] || d.trim())
            .filter(Boolean)
        }
      }
    })

    if (summary || start) {
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
        code: code || 'COURSE',
        subject: subject || code || 'Untitled Course',
        instructor: instructor || '',
        room: location || '',
        days: days.length > 0 ? days : ['Mon'],
        start: start || '08:00',
        end: end || '09:00',
        color: (((index % 5) + 1) as 1 | 2 | 3 | 4 | 5),
        confidence: 'high',
      })
    }
  })

  return classes
}

