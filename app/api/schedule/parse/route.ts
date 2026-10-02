import { NextResponse } from 'next/server'
import { GEMINI_MODEL_NAME, ScheduleParseError, parseScheduleImageWithGemini, parseScheduleTextWithGemini } from '@/lib/gemini'
import { parseRawSchedule } from '@/lib/parser'

function logFailure(error: unknown, attempt?: number) {
  // Log controlled diagnostics only: no raw image, schedule, SDK URLs or API keys.
  console.warn('[Schedule Parse API]', {
    reason: error instanceof ScheduleParseError ? error.code : 'unexpected_failure',
    detail: error instanceof ScheduleParseError ? error.message : 'Unexpected schedule parsing error.',
    providerStatus: error instanceof ScheduleParseError ? error.providerStatus : undefined,
    model: GEMINI_MODEL_NAME,
    attempt,
  })
}

function failure(error: ScheduleParseError) {
  const messages = {
    invalid_image: 'This image or PDF could not be opened. Please upload a valid PNG, JPG, WebP, HEIC, or PDF file.',
    provider_failure: 'The AI schedule scanner is currently unavailable. Please try again shortly or paste your schedule text.',
    invalid_response: 'The AI scanner could not finish reading the schedule. Please try again or paste your schedule text.',
    no_schedule: 'No timetable was detected in this file. Upload the schedule itself or paste your schedule text.',
    zero_entries: 'A schedule scan completed, but no class entries could be extracted. Try a crop of just the timetable or paste your schedule text.',
  }
  const status = error.code === 'provider_failure' ? 503 : error.code === 'invalid_response' ? 502 : error.code === 'invalid_image' ? 400 : 422
  return NextResponse.json({ success: false, errorCode: error.code, error: messages[error.code] }, { status })
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    const input = await req.json()
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid request body')
    body = input
  } catch {
    console.warn('[Schedule Parse API]', { reason: 'invalid_payload', detail: 'Expected a JSON object.' })
    return NextResponse.json({ success: false, errorCode: 'invalid_payload', error: 'The upload could not be read. Please select the file again.' }, { status: 400 })
  }

  try {
    if (body.image !== undefined) {
      if (typeof body.image !== 'string') {
        const error = new ScheduleParseError('invalid_image', 'Image payload must be a data URL string.')
        logFailure(error)
        return failure(error)
      }

      // Exactly one retry, only after an empty extraction. Reuse the preserved
      // original (or the highest-quality upload for oversized sources).
      let emptyResult = new ScheduleParseError('zero_entries', 'Gemini returned zero usable class entries.')
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const classes = await parseScheduleImageWithGemini(body.image, attempt === 2)
          if (classes.length > 0) {
            return NextResponse.json({ success: true, provider: GEMINI_MODEL_NAME, classes })
          }
          emptyResult = new ScheduleParseError('zero_entries', 'Gemini returned zero usable class entries.')
        } catch (error: unknown) {
          if (error instanceof ScheduleParseError && error.code === 'no_schedule') {
            emptyResult = error
          } else {
            logFailure(error, attempt)
            return failure(error instanceof ScheduleParseError ? error : new ScheduleParseError('provider_failure', 'Gemini vision parsing failed.'))
          }
        }
        logFailure(emptyResult, attempt)
      }
      return failure(emptyResult)
    }

    // Retain the existing text parser fallback when AI is unavailable.
    const textToParse = body.text || body.content || ''
    if (typeof textToParse !== 'string') {
      console.warn('[Schedule Parse API]', { reason: 'invalid_payload', detail: 'Text payload must be a string.' })
      return NextResponse.json({ success: false, errorCode: 'invalid_payload', error: 'Please provide schedule text or upload a timetable.' }, { status: 400 })
    }
    if (textToParse.trim()) {
      try {
        const classes = await parseScheduleTextWithGemini(textToParse)
        if (classes.length > 0) return NextResponse.json({ success: true, provider: 'gemini-text', classes })
      } catch (error: unknown) {
        logFailure(error)
      }
      const classes = parseRawSchedule(textToParse)
      if (classes.length > 0) return NextResponse.json({ success: true, provider: 'parser-local', classes })
    }
    const error = new ScheduleParseError('no_schedule', 'No image or nonempty schedule text was supplied.')
    logFailure(error)
    return failure(error)
  } catch (error: unknown) {
    logFailure(error)
    return NextResponse.json({ success: false, errorCode: 'unexpected_failure', error: 'The schedule import could not complete. Please try again.' }, { status: 500 })
  }
}
