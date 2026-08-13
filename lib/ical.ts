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
