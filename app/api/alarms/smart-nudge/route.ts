import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { apiError, boundedText, InputError, readJson, requireAuthenticated } from '@/lib/api-security'

const groqApiKey = process.env.GROQ_API_KEY || ''
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey, timeout: 8000, maxRetries: 0 }) : null

export async function POST(req: NextRequest) {
  try {
    await requireAuthenticated('alarm-nudge', 30)
    const {
      subject = '',
      room = '',
      minutes_until = 15,
      is_first_class_today = false,
      gap_before_minutes = null,
      reminder_item = null,
    } = await readJson(req, 8192)
    boundedText(subject, 150, 'subject', true)
    boundedText(room, 150, 'room')
    if (typeof minutes_until !== 'number' || !Number.isFinite(minutes_until) || minutes_until < 0 || minutes_until > 1440) throw new InputError('Please check the reminder time.')
    if (reminder_item !== null) boundedText(reminder_item, 120, 'reminder item')

    const inputJson = JSON.stringify(
      {
        subject,
        room,
        minutes_until,
        is_first_class_today,
        gap_before_minutes,
        reminder_item,
      },
      null,
      2
    )

    const systemPrompt = `You are Dormosaur's alarm assistant. Generate a single short, casual reminder notification for a student's upcoming class. Keep it under 15 words. Sound like a quick nudge from a friend, not a formal alert. Include the subject name, how many minutes until it starts, and one useful contextual detail (room, or a note if it's back-to-back with no gap, or a reminder item if provided). Never invent details not given to you. No emojis. No exclamation points unless it's genuinely urgent (5 minutes or less).

Input format:
{
  subject: string,
  room: string,
  minutes_until: number,
  is_first_class_today: boolean,
  gap_before_minutes: number | null,
  reminder_item: string | null
}

Output: one plain sentence, nothing else.`

    // 1. Call Groq Llama 3 if API Key is configured
    if (groq) {
      try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: inputJson },
        ],
        model: 'openai/gpt-oss-20b',
        temperature: 0.3,
        max_tokens: 60,
      })

      const rawContent = completion.choices[0]?.message?.content?.trim() || ''
      if (rawContent) {
        // Strip quotes or newlines if any
        const cleaned = rawContent.replace(/^["']|["']$/g, '').trim()
        return NextResponse.json({ nudge: cleaned, source: 'ai' })
      }
      } catch { console.warn('[Alarm Nudge]', { category: 'provider_unavailable' }) }
    }

    // 2. Instant Graceful Fallback Rule
    let fallback = `${subject} in ${minutes_until} — it's in ${room}.`
    if (minutes_until <= 5) {
      fallback = `${subject} in ${minutes_until}! ${room} — go now.`
    } else if (is_first_class_today) {
      fallback = `First class of the day: ${subject} in ${minutes_until}, ${room}.`
    } else if (gap_before_minutes === 0) {
      fallback = `${subject} in ${minutes_until}, straight after your last class — ${room}.`
    } else if (reminder_item) {
      fallback = `${subject} in ${minutes_until} — it's in ${room}, grab your ${reminder_item}.`
    }

    return NextResponse.json({ nudge: fallback, source: 'dormosaur/local-ai-fallback' })
  } catch (error) {
    if (error instanceof InputError) return apiError(error, 'We could not load this reminder.')
    console.warn('[Alarm Nudge]', { category: 'request_failed' })
    // Always degrade gracefully! Never block or delay reminders
    return NextResponse.json({
      nudge: 'Class starts soon — check your schedule room number.',
      source: 'dormosaur/error-fallback',
    })
  }
}
