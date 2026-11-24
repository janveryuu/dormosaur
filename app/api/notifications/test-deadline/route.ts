import { NextRequest, NextResponse } from 'next/server'
import { sendClassReminder } from '@/lib/notification-service'
import { apiError, boundedText, InputError, readJson, requireAuthenticated } from '@/lib/api-security'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  try {
    const { user } = await requireAuthenticated('push-test', 2)
    const body = await readJson(req, 4096)
    const milestone = body.milestone || '3mins' // '1day' | '1hour' | '3mins'
    const title = boundedText(body.title || 'Test deadline', 150, 'deadline title')
    if (!['1day', '1hour', '3mins'].includes(milestone as string)) throw new InputError('Please choose a valid reminder interval.')

    let pushTitle = ''
    let pushBody = ''

    if (milestone === '1day') {
      pushTitle = `⏰ 1 Day Left: ${title}`
      pushBody = `Due tomorrow at 11:59 PM • Make sure your project is ready for submission!`
    } else if (milestone === '1hour') {
      pushTitle = `🚨 1 Hour Left: ${title}`
      pushBody = `Due in 60 minutes! Final stretch — finish and submit now.`
    } else {
      pushTitle = `🔥 URGENT — 3 Mins Left: ${title}`
      pushBody = `Due in 3 minutes! Submit your assignment right now!`
    }

    const result = await sendClassReminder({
      userId: user.id,
      title: pushTitle,
      body: pushBody,
      tag: `test-deadline-${milestone}-${Date.now()}`,
      url: '/schedule',
    })

    return NextResponse.json({
      success: true,
      milestone,
      title: pushTitle,
      body: pushBody,
      result,
    })
  } catch (err: unknown) {
    return apiError(err, 'We could not send this test notification.')
  }
}
