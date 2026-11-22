import { NextResponse } from 'next/server'
import { apiError, InputError, readJson, requireAuthenticated } from '@/lib/api-security'
import { aiConfigured, modelChain } from '@/lib/scanner/ai'
import { scanSchedule, ScanError } from '@/lib/scanner'

export const runtime = 'nodejs'
export const maxDuration = 60

const MESSAGES = {
  invalid_image: 'This file could not be opened. Use a PNG, JPG, WebP, HEIC or PDF.',
  provider_failure: 'The scanner is busy right now. Try again in a moment, or paste your schedule as text.',
  no_schedule: 'This doesn’t look like a class schedule. Upload the timetable itself or paste its text.',
  zero_entries: 'We found a timetable but couldn’t read its classes. Try a sharper screenshot or the original PDF.',
  grid_text: 'Text copied out of a timetable loses its columns, so days can’t be read exactly. Upload the PDF or a screenshot instead.',
}

// Safe configuration metadata only; never the key. Disabled in production.
export async function GET() {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  try { await requireAuthenticated('schedule-probe', 2) } catch (error) { return apiError(error, 'Scanner diagnostics are unavailable.') }
  return NextResponse.json({ keyConfigured: aiConfigured(), models: modelChain() }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    await requireAuthenticated('schedule-import', 8)
    const input = await readJson(req, 4.4 * 1024 * 1024)
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InputError('The upload could not be read. Please select the file again.')
    body = input
  } catch (error) {
    if (error instanceof InputError) return apiError(error, 'The upload could not be read. Please select the file again.')
    return NextResponse.json({ success: false, errorCode: 'invalid_payload', error: 'The upload could not be read. Please select the file again.' }, { status: 400 })
  }

  const started = Date.now()
  try {
    let result
    if (body.image !== undefined) {
      if (typeof body.image !== 'string') throw new ScanError('invalid_image')
      result = await scanSchedule({ image: body.image })
    } else {
      const text = body.text ?? body.content ?? ''
      if (typeof text !== 'string' || !text.trim()) throw new ScanError('no_schedule')
      if (text.length > 30_000) throw new InputError('Please keep schedule text under 30,000 characters.', 413)
      result = await scanSchedule({ text })
    }
    // Controlled diagnostics only: never the schedule, image or key.
    console.info('[Schedule Scan]', { provider: result.provider, classes: result.classes.length, flagged: result.classes.filter(c => c.confidence === 'low').length, ms: Date.now() - started })
    return NextResponse.json({ success: true, provider: result.provider, classes: result.classes, skipped: result.skipped, hint: result.hint ?? null })
  } catch (error) {
    if (error instanceof InputError) return apiError(error, 'The schedule import could not complete.')
    if (error instanceof ScanError) {
      console.warn('[Schedule Scan]', { code: error.code, category: error.category ?? null, ms: Date.now() - started })
      const key = error.category === 'grid_text' ? 'grid_text' : error.code
      const status = error.code === 'provider_failure' ? 503 : error.code === 'invalid_image' ? 400 : 422
      return NextResponse.json({ success: false, errorCode: key, error: MESSAGES[key] }, { status })
    }
    console.warn('[Schedule Scan]', { code: 'unexpected_failure', ms: Date.now() - started })
    return NextResponse.json({ success: false, errorCode: 'unexpected_failure', error: 'The schedule import could not complete. Please try again.' }, { status: 500 })
  }
}
