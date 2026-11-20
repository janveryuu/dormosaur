import { DAYS, type ClassEntry, type Day } from './repo'

export const minutesOf = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

export const formatRange = (a: string, b: string) => `${formatTime(a)} – ${formatTime(b)}`

/** JS getDay(): 0=Sun. Our DAYS start Monday. */
export const dayOf = (date = new Date()): Day => DAYS[(date.getDay() + 6) % 7]

export function classesOn(classes: ClassEntry[], day: string) {
  return classes.filter(c => c.days.includes(day)).sort((a, b) => minutesOf(a.start) - minutesOf(b.start))
}

export type NextClass = { entry: ClassEntry; startsAt: Date; endsAt: Date; live: boolean }

/** Finds the class happening now, or the next one within the coming 7 days. */
export function nextClass(classes: ClassEntry[], now = new Date()): NextClass | null {
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(now)
    date.setDate(now.getDate() + offset)
    const list = classesOn(classes, dayOf(date))
    for (const entry of list) {
      const startsAt = new Date(date); startsAt.setHours(0, minutesOf(entry.start), 0, 0)
      const endsAt = new Date(date); endsAt.setHours(0, minutesOf(entry.end), 0, 0)
      if (endsAt > now) return { entry, startsAt, endsAt, live: startsAt <= now }
    }
  }
  return null
}

export function splitDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 60000))
  const days = Math.floor(total / 1440)
  const hours = Math.floor((total % 1440) / 60)
  const minutes = total % 60
  return { days, hours, minutes }
}

export function relativeDue(iso: string, now = new Date()) {
  const due = new Date(iso)
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((startOf(due) - startOf(now)) / 86400000)
  if (due < now) return 'Overdue'
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7) return due.toLocaleDateString(undefined, { weekday: 'long' })
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const clockOf = (iso: string) => {
  const d = new Date(iso)
  return formatTime(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`)
}

export function greeting(now = new Date()) {
  const h = now.getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
