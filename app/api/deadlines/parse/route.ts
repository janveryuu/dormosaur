import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { apiError, boundedText, InputError, readJson, requireAuthenticated } from '@/lib/api-security'
import { getClasses, getUserProfile } from '@/lib/db'
import { generateStructuredJson, ScheduleParseError } from '@/lib/gemini'
import { recognizeScheduleWithTesseract } from '@/lib/schedule-ocr'
import { normalizeDeadlineDrafts, parseDeadlineText } from '@/lib/deadline-parser'
import { clockAt } from '@/lib/copilot/time'

export const runtime = 'nodejs'
export const maxDuration = 120
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 12_000, maxRetries: 0 }) : null
export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireAuthenticated('deadline-import', 5)
    const body = await readJson(req, 4 * 1024 * 1024)
    const mode = body.mode || 'text'
    if (!['text', 'camera', 'photo'].includes(mode as string)) throw new InputError('Please choose text or an image to import.')
    let content = boundedText(body.content, mode === 'text' ? 30_000 : 4 * 1024 * 1024, 'deadline content', true)
    const [classes, profile] = await Promise.all([getClasses(supabase, user.id), getUserProfile(supabase, user.id)])
    const timezone = profile?.timezone || 'Asia/Manila'
    const prompt = `Extract deadlines into JSON {deadlines:[{title,code,dueDate,dueTime,type,confidence,lowFields}]}.
Use only information present in the source. Never guess a course, date or time. Leave unknown code/dueDate/dueTime as empty strings and list them in lowFields. Dates YYYY-MM-DD, times HH:MM, type assignment|exam|project|quiz|other. Relative dates are relative to ${clockAt(new Date(), timezone).date} (${timezone}) and need review. A course list is for recognizing an explicitly named course, never filling an unknown one: ${JSON.stringify(classes.map(c => ({ code: c.code, subject: c.subject })))}`
    if (mode !== 'text') {
      try {
        const raw = await generateStructuredJson(prompt, content) as { deadlines?: unknown }
        const deadlines = normalizeDeadlineDrafts(raw?.deadlines, 'image_import')
        if (deadlines.length) return NextResponse.json({ success: true, deadlines })
      } catch (error) {
        if (error instanceof ScheduleParseError && error.code === 'invalid_image') throw new InputError('Please upload a valid PNG, JPG or PDF file.')
        console.warn('[Deadline Parse]', { category: 'vision_unavailable' })
      }
      try { content = (await recognizeScheduleWithTesseract(content)).text }
      catch { throw new InputError('The deadline scanner is unavailable right now. Try again shortly or paste the deadline text.', 503) }
      if (!content.trim()) throw new InputError('No deadline text could be extracted. Try another file or paste the text.', 422)
    }
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({ model: 'openai/gpt-oss-20b', response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: prompt }, { role: 'user', content }], temperature: 0, max_tokens: 3000 })
        const raw = JSON.parse(completion.choices[0]?.message?.content || '{}')
        const deadlines = normalizeDeadlineDrafts(raw.deadlines, mode === 'text' ? 'text_import' : 'image_import', content, timezone)
        if (deadlines.length) return NextResponse.json({ success: true, deadlines })
      } catch { console.warn('[Deadline Parse]', { category: 'text_provider_unavailable' }) }
    }
    const deadlines = parseDeadlineText(content, new Date(), timezone).map(d => ({ ...d, source: mode === 'text' ? 'text_import' : 'image_import' }))
    if (!deadlines.length) throw new InputError('No deadline entries were found. Please add the deadline text.', 422)
    return NextResponse.json({ success: true, deadlines })
  } catch (error) { return apiError(error, 'The deadline import could not complete. Please try again shortly.') }
}
