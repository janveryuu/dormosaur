import type { ClassItem, DeadlineItem, StudentContext } from './types'

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export type Clock = { timeZone: string; date: string; day: string; minutes: number; time: string }
export type ClassOccurrence = { class: ClassItem; date: string; day: string; daysAhead: number }

export function validTimeZone(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 80) return undefined
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }).format(); return value } catch { return undefined }
}

export function clockAt(now: Date, deviceZone: unknown, profileZone?: string): Clock {
  const timeZone = validTimeZone(deviceZone) ?? validTimeZone(profileZone) ?? 'UTC'
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const part = (type: string) => parts.find(p => p.type === type)!.value
  return { timeZone, date: `${part('year')}-${part('month')}-${part('day')}`, day: part('weekday'),
    minutes: Number(part('hour')) * 60 + Number(part('minute')), time: `${part('hour')}:${part('minute')}` }
}

export function timeMinutes(value?: string): number | null {
  if (!value) return null
  const m = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i)
  if (!m) return null
  let h = Number(m[1]); const minute = Number(m[2])
  if (minute > 59 || (m[3] ? h < 1 || h > 12 : h > 23)) return null
  if (m[3]) h = h % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0)
  return h * 60 + minute
}

export function displayTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  return `${h % 12 || 12}:${String(Math.floor(m % 60)).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export function addDays(date: string, offset: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

export function classesOn(classes: ClassItem[], day: string): ClassItem[] {
  return classes.filter(c => c.days.some(d => d.slice(0, 3).toLowerCase() === day.toLowerCase()))
    .sort((a, b) => (timeMinutes(a.start) ?? 1440) - (timeMinutes(b.start) ?? 1440))
}

export function nextClass(classes: ClassItem[], clock: Clock, fromTomorrow = false): ClassOccurrence | null {
  for (let offset = fromTomorrow ? 1 : 0; offset <= 7; offset++) {
    const day = DAYS[(DAYS.indexOf(clock.day) + offset) % 7]
    const found = classesOn(classes, day).find(c => {
      const start = timeMinutes(c.start)
      return start !== null && (offset > 0 || start >= clock.minutes)
    })
    if (found) return { class: found, day, date: addDays(clock.date, offset), daysAhead: offset }
  }
  return null
}

export function pendingDeadlines(deadlines: DeadlineItem[], clock: Clock, thisWeek: boolean, examsOnly = false): DeadlineItem[] {
  // This week means through Sunday in the student's local calendar, not seven days from now.
  const sunday = addDays(clock.date, (7 - DAYS.indexOf(clock.day)) % 7)
  return deadlines.filter(d => !d.completed && (!examsOnly || d.type === 'exam' || d.type === 'quiz') &&
    (!thisWeek || (!!d.dueDate && d.dueDate >= clock.date && d.dueDate <= sunday)))
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') || (a.dueTime ?? '').localeCompare(b.dueTime ?? ''))
}

export function wakeUp(context: StudentContext, occurrence: ClassOccurrence | null): string {
  if (!occurrence) return 'I need a recorded class day and start time to work out a wake-up time.'
  const cls = occurrence.class, start = timeMinutes(cls.start)!
  // Alarm.time is the class anchor in this repository. Actual alarm = anchor minus lead.
  const alarm = context.alarms.find(a => a.enabled && (
    (a.classId && a.classId === cls.id) || (a.code && a.code === cls.code)
  ))
  const label = cls.code ?? cls.subject ?? 'your class'
  if (alarm?.lead !== undefined) {
    const offset = Math.floor((start - alarm.lead) / 1440)
    const wakeDate = addDays(occurrence.date, offset)
    return `For ${label} at ${displayTime(start)} on ${occurrence.date}, your configured ${alarm.lead}-minute lead gives ${displayTime(start - alarm.lead)} on ${wakeDate} (${context.sources.alarms === 'local' ? 'local alarm' : 'recorded alarm'}). Allow extra time if preparation or travel takes longer. I haven't changed any alarms.`
  }
  return `${label} starts at ${displayTime(start)} on ${occurrence.date}. I don't have a matching enabled alarm lead or preparation/travel settings. Choose a lead that covers getting ready and reaching class; for example, a 60-minute lead would mean ${displayTime(start - 60)}${start < 60 ? ' the previous day' : ''}. That's a suggestion, and I haven't set an alarm.`
}
