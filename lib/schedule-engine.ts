/**
 * lib/schedule-engine.ts
 * Pure deterministic schedule calculation engine for Dormosaur.
 * Evaluates upcoming classes, in-progress lectures, and multi-day rollovers based on the user's timezone.
 */
import type { ClassEntry } from '@/lib/data'

export type NextClassStatus = 'in_progress' | 'upcoming_today' | 'upcoming_future'

export type NextClassResult = {
  entry: ClassEntry
  status: NextClassStatus
  dayLabel: string // 'Today', 'Tomorrow', 'Monday', 'Happening Now', etc.
  daysAhead: number // 0 for today, 1 for tomorrow, etc.
  remainingMinutes: number
  isToday: boolean
}

const DAYS_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function normDay(d?: string): string {
  if (!d) return ''
  const lower = d.trim().toLowerCase()
  if (lower.startsWith('mon')) return 'Mon'
  if (lower.startsWith('tue')) return 'Tue'
  if (lower.startsWith('wed')) return 'Wed'
  if (lower.startsWith('thu')) return 'Thu'
  if (lower.startsWith('fri')) return 'Fri'
  if (lower.startsWith('sat')) return 'Sat'
  if (lower.startsWith('sun')) return 'Sun'
  return d
}

export function getNextUpcomingClass(
  classes: ClassEntry[],
  date: Date = new Date(),
  userTimezone: string = 'Asia/Manila'
): NextClassResult | null {
  if (!classes || classes.length === 0) return null

  // 1. Get current day name and 24-hr time in student's timezone
  let currentDayShort = ''
  let currentHour = '00'
  let currentMin = '00'

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone || 'Asia/Manila',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const parts = formatter.formatToParts(date)
    for (const part of parts) {
      if (part.type === 'weekday') currentDayShort = part.value
      if (part.type === 'hour') currentHour = part.value
      if (part.type === 'minute') currentMin = part.value
    }
  } catch (err) {
    // Fallback if timezone string is invalid
    currentDayShort = DAYS_ORDER[date.getDay()]
    currentHour = String(date.getHours()).padStart(2, '0')
    currentMin = String(date.getMinutes()).padStart(2, '0')
  }

  if (currentHour === '24') currentHour = '00'
  const currentTimeStr = `${currentHour.padStart(2, '0')}:${currentMin.padStart(2, '0')}`
  const currentNowMinutes = parseInt(currentHour, 10) * 60 + parseInt(currentMin, 10)

  const currentDay = normDay(currentDayShort)
  const currentDayIndex = DAYS_ORDER.indexOf(currentDay) >= 0 ? DAYS_ORDER.indexOf(currentDay) : date.getDay()

  // 2. Check today's classes
  const todayClasses = classes
    .filter((c) => Array.isArray(c.days) && c.days.some((d) => normDay(d) === currentDay))
    .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'))

  // 2a. Check if a class is currently in progress
  const inProgress = todayClasses.find((c) => {
    const s = c.start || '00:00'
    const e = c.end || '23:59'
    return s <= currentTimeStr && currentTimeStr < e
  })

  if (inProgress) {
    const endMinutes =
      parseInt((inProgress.end || '23:59').split(':')[0], 10) * 60 +
      parseInt((inProgress.end || '23:59').split(':')[1] || '0', 10)
    const remainingMins = Math.max(0, endMinutes - currentNowMinutes)

    return {
      entry: inProgress,
      status: 'in_progress',
      dayLabel: 'Happening Now',
      daysAhead: 0,
      isToday: true,
      remainingMinutes: remainingMins,
    }
  }

  // 2b. Check upcoming classes later today
  const upcomingToday = todayClasses.filter((c) => (c.start || '00:00') > currentTimeStr)
  if (upcomingToday.length > 0) {
    const nextEntry = upcomingToday[0]
    const startMinutes =
      parseInt((nextEntry.start || '00:00').split(':')[0], 10) * 60 +
      parseInt((nextEntry.start || '00:00').split(':')[1] || '0', 10)
    const diffMins = Math.max(0, startMinutes - currentNowMinutes)

    return {
      entry: nextEntry,
      status: 'upcoming_today',
      dayLabel: 'Today',
      daysAhead: 0,
      isToday: true,
      remainingMinutes: diffMins,
    }
  }

  // 3. Roll forward across the next 7 days (e.g. Friday -> Monday)
  for (let offset = 1; offset <= 7; offset++) {
    const nextDayIndex = (currentDayIndex + offset) % 7
    const nextDayName = DAYS_ORDER[nextDayIndex]

    const dayClasses = classes
      .filter((c) => Array.isArray(c.days) && c.days.some((d) => normDay(d) === nextDayName))
      .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'))

    if (dayClasses.length > 0) {
      const nextEntry = dayClasses[0]
      const startMinutes =
        parseInt((nextEntry.start || '00:00').split(':')[0], 10) * 60 +
        parseInt((nextEntry.start || '00:00').split(':')[1] || '0', 10)
      const diffMins = offset * 24 * 60 - currentNowMinutes + startMinutes

      const dayLabel = offset === 1 ? 'Tomorrow' : nextDayName

      return {
        entry: nextEntry,
        status: 'upcoming_future',
        dayLabel,
        daysAhead: offset,
        isToday: false,
        remainingMinutes: diffMins,
      }
    }
  }

  return null
}
