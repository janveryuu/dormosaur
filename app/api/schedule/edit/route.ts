import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import type { ClassEntry } from '@/lib/data'
import { getClasses } from '@/lib/db'
import { apiError, boundedText, InputError, readJson, requireAuthenticated } from '@/lib/api-security'
import { validTime } from '@/lib/date-time'

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 12_000, maxRetries: 0 }) : null
const clarify = (message = 'Please name one class by course code and day, and specify the exact change.') => { throw new InputError(message, 422) }
const normal = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
function targetClass(prompt: string, classes: ClassEntry[]) {
  const words = normal(prompt).split(' ')
  const text = ` ${normal(prompt)} `
  const codeMatches = classes.filter(c => c.code.trim() && text.includes(` ${normal(c.code)} `))
  let candidates = codeMatches.length ? codeMatches : classes.filter(c => {
    const subject = normal(c.subject)
    return subject && (text.includes(` ${subject} `) || subject.split(' ').some(word =>
      word.length >= 4 && !['general', 'introduction', 'laboratory', 'advanced', 'class'].includes(word) && words.includes(word)))
  })
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayAliases = [['sun', 'sunday', 'sundays'], ['mon', 'monday', 'mondays'], ['tue', 'tues', 'tuesday', 'tuesdays'], ['wed', 'wednesday', 'wednesdays'], ['thu', 'thur', 'thurs', 'thursday', 'thursdays'], ['fri', 'friday', 'fridays'], ['sat', 'saturday', 'saturdays']]
  const namedDays = dayNames.filter((_day, index) => dayAliases[index].some(day => words.includes(day)))
  if (namedDays.length) candidates = candidates.filter(c => namedDays.every(day => c.days.some(d => d.slice(0, 3) === day)))
  if (candidates.length !== 1) return clarify(candidates.length > 1 ? 'More than one meeting matches. Include the course code and meeting day.' : 'I could not identify that class in your saved schedule. Include its course code and day.')
  if (namedDays.length && candidates[0].days.length > namedDays.length) return clarify('That class has several meeting days. Edit a single meeting manually, or request the change for all its days.')
  return candidates[0]
}
function timeInPrompt(prompt: string) {
  const matches = [...prompt.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b((?:[01]\d|2[0-3]):[0-5]\d)\b/gi)]
  const match = matches.at(-1)
  if (!match) return ''
  if (match[4]) return match[4]
  const hour = Number(match[1]), minute = Number(match[2] || 0)
  if (hour < 1 || hour > 12 || minute > 59) return ''
  return `${String(hour % 12 + (match[3].toLowerCase() === 'pm' ? 12 : 0)).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireAuthenticated()
    const body = await readJson(req)
    const prompt = boundedText(body.prompt, 2000, 'edit instruction', true)
    if (body.classes !== undefined && (!Array.isArray(body.classes) || body.classes.length > 100 || !body.classes.length)) return clarify('Add a class first, then name the class you want to edit.')
    // Browser records never determine which saved student class can be changed.
    const classes = await getClasses(supabase, user.id)
    if (!classes.length) return clarify('There are no saved classes to edit yet.')
    const target = targetClass(prompt, classes)
    const lower = prompt.toLowerCase()
    const action: 'update' | 'delete' = /\b(delete|remove|drop)\b/.test(lower) ? 'delete' : 'update'
    let fieldChanged = action === 'delete' ? 'class' : /\broom\b/.test(lower) ? 'room' : /\bend\b/.test(lower) ? 'end' : 'start'
    let newValue = fieldChanged === 'room' ? prompt.match(/\broom\s+(?:to\s+|is\s+)?(.+)$/i)?.[1]?.trim() || '' : timeInPrompt(prompt)
    let source = 'local'
    if (action !== 'delete' && !newValue && groq) {
      try {
        const completion = await groq.chat.completions.create({ model: 'openai/gpt-oss-20b',
          messages: [{ role: 'system', content: 'Extract one explicitly requested change to this class. Never infer a value. Return JSON {action:"update"|"delete",targetClassId,fieldChanged:"room"|"start"|"end",newValue}. Use 24-hour HH:MM for times. If missing, return {}. Class: ' + JSON.stringify(target) }, { role: 'user', content: prompt }],
          response_format: { type: 'json_object' }, temperature: 0, max_tokens: 300 })
        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}')
        if (parsed.targetClassId === target.id && ['room', 'start', 'end'].includes(parsed.fieldChanged) && typeof parsed.newValue === 'string') {
          fieldChanged = parsed.fieldChanged; newValue = parsed.newValue; source = 'ai'
        }
      } catch { console.warn('[Schedule Edit]', { category: 'provider_unavailable' }) }
    }
    if (action === 'update') {
      if (!['room', 'start', 'end'].includes(fieldChanged)) return clarify()
      if (fieldChanged === 'room') {
        if (!newValue || newValue.length > 120 || !normal(prompt).includes(normal(newValue))) return clarify('Please specify the exact new room name or number.')
      } else {
        if (!validTime(newValue) || newValue !== timeInPrompt(prompt)) return clarify('Please specify an exact time, including AM or PM.')
        if (fieldChanged === 'start' ? newValue >= target.end : newValue <= target.start) return clarify('The start must be before the end. Edit both times manually if you are moving the whole class.')
      }
    }
    const oldValue = fieldChanged === 'room' ? target.room : fieldChanged === 'end' ? target.end : target.start
    const updatedClass = action === 'delete' ? target : { ...target, [fieldChanged]: newValue }
    return NextResponse.json({ action, targetClassId: target.id, targetSubject: target.subject, targetCode: target.code,
      fieldChanged, oldValue, newValue: action === 'delete' ? '' : newValue, updatedClass, source,
      confirmationText: action === 'delete' ? `Delete ${target.code || target.subject} (${target.days.join(', ')})?` : `Change ${target.code || target.subject} (${target.days.join(', ')}) ${fieldChanged} from ${oldValue || 'unset'} to ${newValue}?` })
  } catch (error) { return apiError(error, 'We could not prepare that edit. Please try again or edit the class manually.') }
}
