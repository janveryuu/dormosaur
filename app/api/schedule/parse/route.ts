import { NextResponse } from 'next/server'
import { GEMINI_MODEL_NAME, ScheduleParseError, checkScheduleProvider, getScheduleProviderConfiguration, parseScheduleImageWithGemini, parseScheduleTextWithGemini } from '@/lib/gemini'
import { parseRawSchedule } from '@/lib/parser'
import { recognizeScheduleWithTesseract } from '@/lib/schedule-ocr'

export const runtime = 'nodejs'
export const maxDuration = 120

function logFailure(error: unknown) {
  // Log controlled diagnostics only: no raw image, schedule, SDK URLs or API keys.
  console.warn('[Schedule Parse API]', {
    status: error instanceof ScheduleParseError ? error.providerStatus ?? null : null,
    category: error instanceof ScheduleParseError ? (error.code === 'provider_failure' || error.code === 'invalid_response' ? error.category : error.code) : 'unexpected_failure',
    model: GEMINI_MODEL_NAME,
  })
}

// Configuration is safe metadata, never the key. A probe makes one small text
// request so production can diagnose the actual runtime independently of OCR.
export async function GET(req: Request) {
  const configuration = getScheduleProviderConfiguration()
  const headers = { 'Cache-Control': 'no-store' }
  if (!configuration.keyConfigured) {
    logFailure(new ScheduleParseError('provider_failure', 'Missing key', undefined, 'api_key_missing'))
    return NextResponse.json({ ...configuration, ready: false, status: null, category: 'api_key_missing' }, { headers })
  }
  if (new URL(req.url).searchParams.get('probe') !== '1') return NextResponse.json(configuration, { headers })
  try {
    await checkScheduleProvider()
    return NextResponse.json({ ...configuration, ready: true, status: 200, category: 'available' }, { headers })
  } catch (error: unknown) {
    logFailure(error)
    return NextResponse.json({ ...configuration, ready: false, status: error instanceof ScheduleParseError ? error.providerStatus ?? null : null, category: error instanceof ScheduleParseError ? error.category : 'unexpected_failure' }, { headers })
  }
}

function failure(error: ScheduleParseError) {
  const messages = {
    invalid_image: 'This image or PDF could not be opened. Please upload a valid PNG, JPG, WebP, HEIC, or PDF file.',
    provider_failure: 'The AI schedule scanner is currently unavailable. Please try again shortly or paste your schedule text.',
    invalid_response: 'The AI scanner could not finish reading the schedule. Please try again or paste your schedule text.',
    no_schedule: 'No timetable was detected in this file. Upload the schedule itself or paste your schedule text.',
    zero_entries: "We found the timetable, but couldn't confidently extract the classes. Try cropping to the timetable area or continue with Paste Text.",
  }
  const status = error.code === 'provider_failure' ? 503 : error.code === 'invalid_response' ? 502 : error.code === 'invalid_image' ? 400 : 422
  return NextResponse.json({ success: false, errorCode: error.code, error: messages[error.code] }, { status })
}

async function ocrFallback(image: string, providerError?: ScheduleParseError) {
  let ocr: Awaited<ReturnType<typeof recognizeScheduleWithTesseract>>
  try {
    ocr = await recognizeScheduleWithTesseract(image)
  } catch {
    console.warn('[Schedule OCR]', { category: image.startsWith('data:application/pdf') ? 'pdf_ocr_unavailable' : 'ocr_unavailable' })
    return failure(providerError || new ScheduleParseError('zero_entries', 'No OCR draft could be extracted.'))
  }
  const classes = parseRawSchedule(ocr.meetingText || ocr.text, { requireExplicitMeeting: true })
  if (classes.length > 0) {
    if (ocr.uncertainTimes) for (const entry of classes) entry.lowFields = [...new Set([...(entry.lowFields || []), 'time'])]
    return NextResponse.json({ success: true, provider: 'tesseract-local', classes })
  }
  // Known missing credentials/auth/quota/model failures cannot recover by
  // repeating the same provider request. Only a transient failure gets a single
  // text pass when local parsing could not preserve a recognizable meeting.
  if (ocr.text.trim() && getScheduleProviderConfiguration().keyConfigured && (!providerError || ['provider_unavailable', 'network_failure'].includes(providerError.category))) {
    try {
      const aiClasses = await parseScheduleTextWithGemini(`${ocr.text}\n\n${ocr.meetingText || ''}`)
      if (aiClasses.length > 0) return NextResponse.json({ success: true, provider: 'tesseract-gemini-text', classes: aiClasses })
    } catch (error: unknown) {
      logFailure(error)
    }
  }
  // OCR ran, but it did not yield a safe meeting: do not blame image quality or
  // hide the available Paste Text path behind the original provider error.
  return failure(new ScheduleParseError('zero_entries', 'No confident OCR meeting could be extracted.'))
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
            logFailure(error)
            if (error instanceof ScheduleParseError && error.code === 'invalid_image') return failure(error)
            return ocrFallback(body.image, error instanceof ScheduleParseError && error.code === 'provider_failure' ? error : undefined)
          }
        }
        logFailure(emptyResult)
      }
      return ocrFallback(body.image)
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
