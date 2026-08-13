import type { ClassEntry } from './data'

export type ScheduleGap = {
  type: 'between_classes' | 'after_last_class' | 'free_day'
  start: string
  end: string
  durationMinutes: number
  beforeClassSubject?: string
  afterClassSubject?: string
}

export type TodayScheduleAnalysis = {
  dayName: string
  todayClasses: ClassEntry[]
  gaps: ScheduleGap[]
  packedUntil: string | null
  maxRecommendedCookTime: number
  summaryHeadline: string
}

// Convert "8:30" or "15:00" or "8:30 AM" / "3:00 PM" to minutes from midnight
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const clean = timeStr.trim().toUpperCase()
  let isPM = clean.includes('PM')
  let isAM = clean.includes('AM')

  const timeOnly = clean.replace(/AM|PM/g, '').trim()
  const [hStr, mStr] = timeOnly.split(':')
  let hours = parseInt(hStr || '0', 10)
  const minutes = parseInt(mStr || '0', 10)

  if (isPM && hours < 12) hours += 12
  if (isAM && hours === 12) hours = 0

  return hours * 60 + minutes
}

// Format minutes from midnight to "3:00 PM"
export function formatMinutesToTime(mins: number): string {
  let hours = Math.floor(mins / 60)
  const minutes = mins % 60
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  const mPadded = minutes < 10 ? `0${minutes}` : `${minutes}`
  return `${hours}:${mPadded} ${ampm}`
}

export function analyzeTodaySchedule(classes: ClassEntry[], dayName = 'Mon'): TodayScheduleAnalysis {
  // Filter classes occurring on this day
  const todayClasses = classes
    .filter((c) => c.days.some((d) => d.toLowerCase().startsWith(dayName.toLowerCase().slice(0, 3))))
    .sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start))

  if (todayClasses.length === 0) {
    return {
      dayName,
      todayClasses: [],
      gaps: [{ type: 'free_day', start: '08:00 AM', end: '10:00 PM', durationMinutes: 840 }],
      packedUntil: null,
      maxRecommendedCookTime: 30,
      summaryHeadline: 'No classes today! Perfect time for a full home-cooked meal.',
    }
  }

  const gaps: ScheduleGap[] = []
  let maxGap = 0

  // 1. Check gaps between consecutive classes
  for (let i = 0; i < todayClasses.length - 1; i++) {
    const currentClass = todayClasses[i]
    const nextClass = todayClasses[i + 1]

    const endCurrent = parseTimeToMinutes(currentClass.end)
    const startNext = parseTimeToMinutes(nextClass.start)

    if (startNext > endCurrent) {
      const gapDuration = startNext - endCurrent
      if (gapDuration > maxGap) maxGap = gapDuration

      gaps.push({
        type: 'between_classes',
        start: formatMinutesToTime(endCurrent),
        end: formatMinutesToTime(startNext),
        durationMinutes: gapDuration,
        afterClassSubject: currentClass.subject,
        beforeClassSubject: nextClass.subject,
      })
    }
  }

  // 2. Check time after the last class
  const lastClass = todayClasses[todayClasses.length - 1]
  const lastClassEndMins = parseTimeToMinutes(lastClass.end)
  const packedUntilStr = formatMinutesToTime(lastClassEndMins)

  gaps.push({
    type: 'after_last_class',
    start: packedUntilStr,
    end: '10:00 PM',
    durationMinutes: 180,
    afterClassSubject: lastClass.subject,
  })

  // Max cook time: if gap is 30 mins, cook time should be ~10 mins so student can eat!
  const maxRecommendedCookTime = maxGap >= 45 ? 15 : maxGap >= 30 ? 10 : 5

  let summaryHeadline = `You're packed until ${packedUntilStr} today!`
  if (gaps.some((g) => g.type === 'between_classes' && g.durationMinutes >= 30)) {
    const mainGap = gaps.find((g) => g.type === 'between_classes' && g.durationMinutes >= 30)!
    summaryHeadline = `You have a ${mainGap.durationMinutes}-min break at ${mainGap.start} between lectures.`
  }

  return {
    dayName,
    todayClasses,
    gaps,
    packedUntil: packedUntilStr,
    maxRecommendedCookTime,
    summaryHeadline,
  }
}
