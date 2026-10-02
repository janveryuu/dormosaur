import type { ClassEntry } from '@/lib/data'
export const WALLPAPER_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export type WallpaperDay = typeof WALLPAPER_DAYS[number]
export function wallpaperMinutes(value: string): number {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i)
  if (!match) return 0
  let hour = Number(match[1])
  if (match[3]?.toLowerCase() === 'pm' && hour < 12) hour += 12
  if (match[3]?.toLowerCase() === 'am' && hour === 12) hour = 0
  return hour * 60 + Number(match[2])
}
export function wallpaperTime(value: string): string {
  const minutes = wallpaperMinutes(value), hour = Math.floor(minutes / 60)
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}
export function wallpaperCourse(entry: ClassEntry): string {
  const code = entry.code?.trim()
  if (code && !/^(tba|untitled class)$/i.test(code)) return code
  const subject = entry.subject?.trim() || 'Class'
  return subject.length > 22 ? `${subject.slice(0, 21).trim()}…` : subject
}
export function wallpaperTimeRange(entry: ClassEntry): string {
  const start = wallpaperTime(entry.start), end = wallpaperTime(entry.end)
  return `${start.slice(-2) === end.slice(-2) ? start.slice(0, -3) : start}–${end}`
}
export function groupWallpaperClasses(classes: ClassEntry[]): Record<WallpaperDay, ClassEntry[]> {
  const grouped = Object.fromEntries(WALLPAPER_DAYS.map((day) => [day, []])) as unknown as Record<WallpaperDay, ClassEntry[]>
  for (const entry of classes) {
    const days = new Set(entry.days.map((value) => WALLPAPER_DAYS.find((day) => day.toLowerCase() === value.trim().slice(0, 3).toLowerCase())))
    for (const day of days) if (day) grouped[day].push(entry)
  }
  for (const day of WALLPAPER_DAYS) grouped[day].sort((a, b) => wallpaperMinutes(a.start) - wallpaperMinutes(b.start))
  return grouped
}
