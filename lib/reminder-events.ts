import type { Alarm, ClassEntry } from '@/lib/data'
import type { DeadlineItem } from '@/lib/types'
import { addDays, clockAt, DAYS } from './copilot/time'
import { localDateTimeToIso, validTime } from './date-time'

export type ReminderEvent = { key: string; title: string; body: string; url: string }
export function dueReminders(userId: string, classes: ClassEntry[], alarms: Alarm[], deadlines: DeadlineItem[], now: Date, timezone: string, windowMinutes?: number): ReminderEvent[] {
  const events = new Map<string, ReminderEvent>()
  const clock = clockAt(now, timezone)
  const parsedWindow = Number(windowMinutes ?? process.env.REMINDER_WINDOW_MINUTES)
  const effectiveWindow = Number.isFinite(parsedWindow) && parsedWindow >= 5 && parsedWindow <= 1440 ? parsedWindow : 5
  const triggered = (time: number) => now.getTime() >= time && now.getTime() - time < effectiveWindow * 60_000
  for (const alarm of alarms) {
    if (!alarm.enabled || ![15, 30, 60].includes(alarm.lead)) continue
    const cls = classes.find(c => c.id === alarm.classId)
    if (!cls || !validTime(cls.start) || !Array.isArray(cls.days)) continue
    for (const offset of [0, 1]) {
      const date = addDays(clock.date, offset)
      const day = DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()]
      if (!cls.days.some(d => d.slice(0, 3).toLowerCase() === day.toLowerCase())) continue
      let start: number
      try { start = Date.parse(localDateTimeToIso(date, cls.start, timezone)) } catch { continue }
      if (!triggered(start - alarm.lead * 60_000)) continue
      const key = `${userId}:alarm:${alarm.id}:class:${cls.id}:${date}:${cls.start}`
      events.set(key, { key, title: `Class reminder: ${cls.code || cls.subject}`,
        body: `${cls.subject} in ${Math.max(0, Math.round((start - now.getTime()) / 60_000))} minutes${cls.room ? ` — ${cls.room}` : ''}.`, url: '/schedule' })
    }
  }
  for (const deadline of deadlines) {
    if (deadline.completed || !deadline.dueDate || !validTime(deadline.dueTime)) continue
    let due: number
    try { due = Date.parse(localDateTimeToIso(deadline.dueDate, deadline.dueTime, timezone)) } catch { continue }
    for (const [minutes, label] of [[1440, '1 day'], [60, '1 hour'], [3, '3 minutes']] as const) {
      if (!triggered(due - minutes * 60_000) || now.getTime() >= due) continue
      const key = `${userId}:deadline:${deadline.id}:${new Date(due).toISOString()}:${minutes}`
      events.set(key, { key, title: `${label} left: ${deadline.title}`, body: `Your ${deadline.type} deadline is approaching. Check its due time and submit when ready.`, url: '/deadlines' })
    }
  }
  return [...events.values()]
}
