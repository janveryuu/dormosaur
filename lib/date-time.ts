import { clockAt, validTimeZone } from './copilot/time'

export const DEFAULT_TIMEZONE = 'Asia/Manila'
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function validTime(value: unknown): value is string {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
}
export function localDateTimeToIso(date: string, time: string, zone = DEFAULT_TIMEZONE): string {
  if (!validDate(date) || !validTime(time)) throw new Error('Please review the deadline date and time before saving.')
  const timezone = validTimeZone(zone) || DEFAULT_TIMEZONE
  const target = Date.parse(`${date}T${time}:00Z`)
  let instant = target
  for (let attempt = 0; attempt < 4; attempt++) {
    const clock = clockAt(new Date(instant), timezone)
    const represented = Date.parse(`${clock.date}T${clock.time}:00Z`)
    instant += target - represented
    if (target === represented) return new Date(instant).toISOString()
  }
  throw new Error('This time does not exist in your timezone. Please choose another time.')
}
export function deadlineFields(value: string, zone = DEFAULT_TIMEZONE): { dueDate: string; dueTime: string } {
  if (!value) return { dueDate: '', dueTime: '' }
  if (/[Zz]$|[+-]\d{2}:\d{2}$/.test(value)) {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return { dueDate: '', dueTime: '' }
    const clock = clockAt(date, validTimeZone(zone) || DEFAULT_TIMEZONE)
    return { dueDate: clock.date, dueTime: clock.time }
  }
  const [date, time] = value.split('T')
  return { dueDate: validDate(date) ? date : '', dueTime: validTime(time?.slice(0, 5)) ? time.slice(0, 5) : '' }
}
