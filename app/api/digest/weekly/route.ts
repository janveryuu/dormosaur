import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { apiError, InputError, readJson, requireAuthenticated } from '@/lib/api-security'

const groqApiKey = process.env.GROQ_API_KEY || ''
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey, timeout: 8000, maxRetries: 0 }) : null

export async function POST(req: NextRequest) {
  try {
    await requireAuthenticated('weekly-digest', 5)
    const {
      week_start_date = '',
      days = [],
      upcoming_deadlines = [],
    } = await readJson(req, 32 * 1024)
    if (!Array.isArray(days) || days.length > 7 || !Array.isArray(upcoming_deadlines) || upcoming_deadlines.length > 30 ||
      days.some(d => !d || typeof d.day_name !== 'string' || d.day_name.length > 15 || typeof d.total_class_hours !== 'number' || !Number.isFinite(d.total_class_hours) || d.total_class_hours < 0 || d.total_class_hours > 24)) throw new InputError('Please check the weekly schedule data.')
    if (!days.length || days.every(d => !d.total_class_hours)) return NextResponse.json({ digest: 'No classes are saved for this week yet. Add your schedule to see weekly insights.', source: 'local' })

    const inputData = JSON.stringify(
      {
        week_start_date,
        days,
        upcoming_deadlines,
      },
      null,
      2
    )

    const systemPrompt = `You are Dormosaur's weekly insights assistant. Given a student's class schedule for the upcoming week, write a short, warm, natural-language summary - 2 to 4 sentences, no more. Highlight the busiest day, the lightest day, and one genuinely useful observation (a long gap worth using, a back-to-back stretch worth preparing for, or an upcoming deadline if provided). Sound like a thoughtful friend giving a heads-up, not a report. No bullet points, no headers, plain sentences only. Never invent exams, deadlines, or classes not present in the data.

Input format:
{
  week_start_date: string,
  days: [
    {
      day_name: string,
      classes: [{ subject, start_time, end_time, room }],
      total_class_hours: number,
      longest_gap_minutes: number | null
    }
  ],
  upcoming_deadlines: [{ subject, type, date }] | []
}

Output: one short paragraph, nothing else.`

    // 1. Call Groq Llama 3 if API Key is configured
    if (groq) {
      try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: inputData },
        ],
        model: 'openai/gpt-oss-20b',
        temperature: 0.4,
        max_tokens: 180,
      })

      const content = completion.choices[0]?.message?.content?.trim() || ''
      if (content) {
        return NextResponse.json({ digest: content, source: 'ai' })
      }
      } catch { console.warn('[Weekly Digest]', { category: 'provider_unavailable' }) }
    }

    // 2. Intelligent Local Fallback Digest Generator
    // Find busiest day (highest total_class_hours) and lightest day
    let busiestDay = days[0]
    let lightestDay = days[0]

    if (days.length > 0) {
      days.forEach((d: { total_class_hours: number }) => {
        if (d.total_class_hours > busiestDay.total_class_hours) busiestDay = d
        if (d.total_class_hours < lightestDay.total_class_hours) lightestDay = d
      })
    }

    let fallbackText = `${busiestDay.day_name}'s your busiest day this week with ${busiestDay.total_class_hours || 4} hours of lectures, so plan meals ahead of time. ${lightestDay.day_name} is the opposite: your lightest day, giving you a great window to meal prep or catch up on readings.`

    if (upcoming_deadlines.length > 0) {
      const firstDeadline = upcoming_deadlines[0]
      fallbackText += ` You've also got ${firstDeadline.subject} (${firstDeadline.type}) coming up on ${firstDeadline.date} — worth starting review early.`
    }

    return NextResponse.json({ digest: fallbackText, source: 'dormosaur/local-ai-fallback' })
  } catch (error) {
    return apiError(error, 'We could not load your weekly digest. Please try again shortly.')
  }
}
