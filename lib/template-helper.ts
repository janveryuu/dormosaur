/**
 * lib/template-helper.ts
 * Helper utilities for formatting and organizing schedule classes for template layouts.
 */

import type { ClassEntry } from '@/lib/data'

export type DayKey = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export const WEEKDAYS: DayKey[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export const SHORT_DAY_MAP: Record<string, DayKey> = {
  M: 'Monday',
  Mon: 'Monday',
  Monday: 'Monday',
  T: 'Tuesday',
  Tue: 'Tuesday',
  Tues: 'Tuesday',
  Tuesday: 'Tuesday',
  W: 'Wednesday',
  Wed: 'Wednesday',
  Wednesday: 'Wednesday',
  Th: 'Thursday',
  Thu: 'Thursday',
  Thurs: 'Thursday',
  Thursday: 'Thursday',
  F: 'Friday',
  Fri: 'Friday',
  Friday: 'Friday',
  S: 'Saturday',
  Sat: 'Saturday',
  Saturday: 'Saturday',
  Su: 'Sunday',
  Sun: 'Sunday',
  Sunday: 'Sunday',
}

export function parseMinutesFromTimeString(timeStr: string): number {
  if (!timeStr) return 0
  const clean = timeStr.trim().toLowerCase()
  const isPM = clean.includes('pm')
  const isAM = clean.includes('am')
  const numbersOnly = clean.replace(/[^\d:]/g, '')
  const parts = numbersOnly.split(':')
  let hours = parseInt(parts[0] || '0', 10)
  const mins = parseInt(parts[1] || '0', 10)

  if (isPM && hours < 12) hours += 12
  if (isAM && hours === 12) hours = 0

  // Heuristic: If hours are between 1 and 6 (inclusive) and no AM is explicitly specified,
  // it's almost certainly a PM class (1:00 PM to 6:00 PM).
  if (!isAM && !isPM && hours >= 1 && hours <= 6) {
    hours += 12
  }

  return hours * 60 + mins
}

export function sortClassesByTime(classes: ClassEntry[]): ClassEntry[] {
  return [...classes].sort((a, b) => {
    return parseMinutesFromTimeString(a.start) - parseMinutesFromTimeString(b.start)
  })
}

export function groupClassesByDay(classes: ClassEntry[]): Record<DayKey, ClassEntry[]> {
  const grouped: Record<DayKey, ClassEntry[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  }

  classes.forEach((cls) => {
    cls.days.forEach((dayStr) => {
      const fullDay = SHORT_DAY_MAP[dayStr] || 'Monday'
      if (grouped[fullDay]) {
        grouped[fullDay].push(cls)
      }
    })
  })

  // Sort each day chronologically
  Object.keys(grouped).forEach((day) => {
    grouped[day as DayKey] = sortClassesByTime(grouped[day as DayKey])
  })

  return grouped
}

export interface DynamicGridTimeRange {
  startHour: number
  endHour: number
  startMins: number
  endMins: number
  totalMins: number
  hoursList: string[]
}

export function getDynamicGridTimeRange(
  classes: ClassEntry[],
  delimiter: ':' | '.' = ':',
): DynamicGridTimeRange {
  let earliest = 24 * 60
  let latest = 0

  if (classes && classes.length > 0) {
    classes.forEach((c) => {
      const s = parseMinutesFromTimeString(c.start)
      let e = parseMinutesFromTimeString(c.end)
      if (!e || e <= s) e = s + 60

      if (s < earliest) earliest = s
      if (e > latest) latest = e
    })
  } else {
    earliest = 7 * 60
    latest = 17 * 60
  }

  // 1-hour leading buffer BEFORE earliest class (e.g. 7 AM class -> 6 AM grid start)
  const rawStartHour = Math.floor(earliest / 60) - 1
  const startHour = Math.max(5, Math.min(7, rawStartHour))
  const startMins = startHour * 60

  // 2-hour trailing buffer AFTER latest class (e.g. 5 PM latest end -> 7 PM grid end)
  const latestHour = Math.ceil(latest / 60)
  const endHour = Math.min(23, Math.max(18, latestHour + 2))
  const endMins = endHour * 60

  const totalMins = endMins - startMins

  const hoursList: string[] = []
  for (let h = startHour; h < endHour; h++) {
    const period = h >= 12 ? 'PM' : 'AM'
    const displayHour = h % 12 === 0 ? 12 : h % 12
    const padHour = displayHour < 10 ? `0${displayHour}` : `${displayHour}`
    hoursList.push(`${padHour}${delimiter}00 ${period}`)
  }

  return {
    startHour,
    endHour,
    startMins,
    endMins,
    totalMins,
    hoursList,
  }
}
