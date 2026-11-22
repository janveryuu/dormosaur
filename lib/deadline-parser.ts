import type { DeadlineItem } from '@/components/schedule-provider'
import { addDays, clockAt } from './copilot/time'
import { validDate, validTime } from './date-time'

export function parseDeadlineText(text: string, now = new Date(), timezone = 'Asia/Manila'): DeadlineItem[] {
  const today = clockAt(now, timezone).date
  return text.split(/\n/).map(line => line.trim()).filter(Boolean).slice(0, 50).map(line => {
    const lowFields: string[] = []
    const code = line.match(/\b([A-Z]{2,8}\s*\d{2,4}(?:[-A-Z]\d*)?)\b/i)?.[1]?.toUpperCase() || ''
    const explicit = line.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1]
    let dueDate = explicit && validDate(explicit) ? explicit : ''
    if (!dueDate) {
      const month = line.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/i)
      if (month) {
        const index = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(month[1].slice(0, 3).toLowerCase()) + 1
        const date = `${month[3] || today.slice(0, 4)}-${String(index).padStart(2, '0')}-${month[2].padStart(2, '0')}`
        if (validDate(date)) dueDate = date
        if (!month[3]) lowFields.push('dueDate')
      } else if (/\btomorrow\b/i.test(line)) { dueDate = addDays(today, 1); lowFields.push('dueDate') }
      else if (/\btoday\b/i.test(line)) { dueDate = today; lowFields.push('dueDate') }
      else {
        const weekday = line.match(/\b(?:next\s+|this\s+|on\s+|due\s+)(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/i)
        if (weekday) {
          const target = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(weekday[1].toLowerCase())
          const current = new Date(`${today}T12:00:00Z`).getUTCDay()
          const offset = (target - current + 7) % 7 || 7
          dueDate = addDays(today, offset); lowFields.push('dueDate')
        }
      }
    }
    let dueTime = ''
    const t = line.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
    if (t && Number(t[1]) >= 1 && Number(t[1]) <= 12 && Number(t[2] || 0) <= 59) {
      dueTime = `${String(Number(t[1]) % 12 + (t[3].toLowerCase() === 'pm' ? 12 : 0)).padStart(2, '0')}:${t[2] || '00'}`
    } else dueTime = line.match(/\b((?:[01]\d|2[0-3]):[0-5]\d)\b/)?.[1] || ''
    if (!dueDate) lowFields.push('dueDate')
    if (!dueTime) lowFields.push('dueTime')
    if (!code) lowFields.push('code')
    return { id: crypto.randomUUID(), title: line.slice(0, 250), code,
      type: /\bquiz\b/i.test(line) ? 'quiz' : /\bexam|midterm|final\b/i.test(line) ? 'exam' : /\bproject|presentation|thesis\b/i.test(line) ? 'project' : 'assignment',
      dueDate, dueTime, color: 1, completed: false, source: 'text_import',
      confidence: lowFields.length ? 'low' : 'high', lowFields: [...new Set(lowFields)] }
  })
}
