import { NextResponse } from 'next/server'
import { ProLimitError, consumeFeature } from '@/lib/pro'
import { apiError, boundedText, InputError, readJson, requireAuthenticated } from '@/lib/api-security'
import { getClasses, getUserProfile } from '@/lib/db'
import { parseDeadlineText } from '@/lib/deadline-parser'
import { clockAt } from '@/lib/copilot/time'
import { parseDataUrl } from '@/lib/scanner'
import { textFromPdf } from '@/lib/scanner/pdf-grid'
import { askDeadlines, deadlinePrompt, type DeadlineDraft } from '@/lib/scanner/deadlines'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const started = Date.now()
  let refund: () => Promise<void> = async () => {}
  try {
    const { supabase, user } = await requireAuthenticated('deadline-import', 8)
    const body = await readJson(req, 4.4 * 1024 * 1024)
    const mode = body.mode || 'text'
    if (!['text', 'camera', 'photo', 'file'].includes(mode as string)) throw new InputError('Please choose text or an image to import.')
    const content = boundedText(body.content, mode === 'text' ? 30_000 : 4.4 * 1024 * 1024, 'deadline content', true)
    const file = mode !== 'text' ? parseDataUrl(content) : null
    if (mode !== 'text' && !file) throw new InputError('Please upload a valid PNG, JPG or PDF file.')
    refund = await consumeFeature(user.id, 'syllabus_scan')
    const [classes, profile] = await Promise.all([getClasses(supabase, user.id), getUserProfile(supabase, user.id)])
    const timezone = profile?.timezone || 'Asia/Manila'
    const today = clockAt(new Date(), timezone).date
    const weekday = new Date(`${today}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
    const prompt = deadlinePrompt(today, weekday, timezone, classes.map(c => ({ code: c.code, subject: c.subject })))

    let source: string | null = mode === 'text' ? content : null
    let parts: unknown[] = [{ text: `${prompt}\n\nMATERIAL:\n"""\n${content}\n"""` }]
    if (file) {
      // A digital PDF has exact text: read it and verify dates against it.
      const pdfText = file.mimeType === 'application/pdf' ? await textFromPdf(file.bytes).catch(() => '') : ''
      if (pdfText.trim().length > 40) { source = pdfText; parts = [{ text: `${prompt}\n\nMATERIAL:\n"""\n${pdfText.slice(0, 30_000)}\n"""` }] }
      else parts = [{ inlineData: { mimeType: file.mimeType, data: file.data } }, { text: prompt }]
    }

    let deadlines: DeadlineDraft[] = []
    try {
      deadlines = await askDeadlines(parts, source)
    } catch {
      console.warn('[Deadline Scan]', { category: 'ai_unavailable' })
      if (source === null) throw new InputError('The deadline scanner is busy right now. Try again shortly or paste the text.', 503)
      // Local fallback: only explicit dates and times are taken; everything else is flagged.
      deadlines = parseDeadlineText(source, new Date(), timezone).map(d => ({
        title: d.title, code: d.code, dueDate: d.dueDate, dueTime: d.dueTime ?? '', type: d.type,
        confidence: 'low' as const, lowFields: d.lowFields ?? [],
      }))
    }
    if (!deadlines.length) throw new InputError('No deadlines were found. Try another file or paste the text.', 422)
    console.info('[Deadline Scan]', { count: deadlines.length, flagged: deadlines.filter(d => d.confidence === 'low').length, ms: Date.now() - started })
    return NextResponse.json({ success: true, deadlines })
  } catch (error) {
    if (!(error instanceof ProLimitError)) await refund().catch(() => {})
    return apiError(error, 'The deadline import could not complete. Please try again shortly.')
  }
}
