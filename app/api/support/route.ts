import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const TOPICS = new Set([
  'Something is broken (bug)',
  'Schedule scanner issue',
  'Alarms or notifications',
  'Dormosaur Pro / payment',
  'Account or data request',
  'Feature suggestion',
  'Other',
])

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      topic?: unknown
      details?: unknown
      email?: unknown
    }

    const topic = typeof body.topic === 'string' && TOPICS.has(body.topic) ? body.topic : 'Other'
    const details = typeof body.details === 'string' ? body.details.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''

    if (details.length < 8) {
      return NextResponse.json(
        { error: 'Please share a bit more detail (at least 8 characters) so we can help.' },
        { status: 400 },
      )
    }

    if (details.length > 4000) {
      return NextResponse.json({ error: 'Message is too long (max 4,000 characters).' }, { status: 400 })
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address or leave it blank.' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY || ''
    const recipient =
      process.env.SUPPORT_TO_EMAIL ||
      (process.env.ADMIN_ALLOWED_EMAILS || 'janvermanlapaz@gmail.com').split(',')[0]?.trim() ||
      'janvermanlapaz@gmail.com'
    const from = process.env.RESEND_FROM_EMAIL || 'Dormosaur Support <onboarding@resend.dev>'

    if (apiKey) {
      const resend = new Resend(apiKey)
      await resend.emails.send({
        from,
        to: [recipient],
        replyTo: email || undefined,
        subject: `[Dormosaur Support] ${topic}`,
        text: [
          `Topic: ${topic}`,
          `Reply email: ${email || '(not provided)'}`,
          '',
          'Details:',
          details,
        ].join('\n'),
      })
    } else {
      console.info('[Dormosaur Support] Received support message (RESEND_API_KEY not set)', {
        topic,
        hasEmail: Boolean(email),
        length: details.length,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'We could not send your message right now. Please try emailing us directly.' },
      { status: 500 },
    )
  }
}
