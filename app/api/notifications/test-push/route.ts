import { NextRequest, NextResponse } from 'next/server'
import { sendClassReminder } from '@/lib/notification-service'
import { apiError, boundedText, readJson, requireAuthenticated } from '@/lib/api-security'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  try {
    const { user } = await requireAuthenticated('push-test', 2)
    const body = await readJson(req, 4096)
    const customTitle = boundedText(body.title || 'Dormosaur', 100, 'notification title')
    const customMessage = boundedText(body.message || 'This is a notification test for your device.', 500, 'notification message')

    const result = await sendClassReminder({
      userId: user.id,
      title: customTitle,
      body: customMessage,
      tag: `test-push-${Date.now()}`,
      url: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Test push notification sent!',
      result,
    })
  } catch (err: unknown) {
    return apiError(err, 'We could not send this test notification.')
  }
}
