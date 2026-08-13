import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendClassReminder } from '@/lib/notification-service'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const customTitle = body.title || 'Dormosaur'
    const customMessage = body.message || 'Calculus I in 15m — Sci Hall 204 • Dr. Elena Reyes'

    const result = await sendClassReminder({
      userId: user.id,
      title: customTitle,
      body: customMessage,
      tag: `test-push-${Date.now()}`,
      url: '/dashboard',
    })

    return NextResponse.json({
      success: true,
      message: 'Test push notification sent!',
      result,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
