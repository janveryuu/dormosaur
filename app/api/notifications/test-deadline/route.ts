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
    const milestone = body.milestone || '3mins' // '1day' | '1hour' | '3mins'
    const title = body.title || 'CS150 Programming Project'

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
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
