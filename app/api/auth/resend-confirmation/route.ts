import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidEmailFormat } from '@/lib/email-utils'
import { authErrorMessage } from '@/lib/auth-errors'
import { apiError, boundedText, consumeRateLimit, InputError, readJson } from '@/lib/api-security'

export async function POST(req: Request) {
  try {
    const body = await readJson(req, 4096)
    const email = boundedText(body.email, 254, 'email address', true).toLowerCase()
    if (!isValidEmailFormat(email)) throw new InputError('Please enter a valid email address.')
    consumeRateLimit(`resend:${email}`, 1)
    const supabase = await createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const origin = appUrl && /^https?:\/\//.test(appUrl) ? new URL(appUrl).origin : new URL(req.url).origin
    // Supabase sends the real tokenized link using its configured provider/SMTP.
    const { error } = await supabase.auth.resend({ type: 'signup', email,
      options: { emailRedirectTo: `${origin}/api/auth/callback` } })
    if (error) {
      console.warn('[Auth Resend]', { category: error.status === 429 ? 'rate_limit' : 'delivery_failed' })
      return NextResponse.json({ error: authErrorMessage(error, 'resend') }, { status: error.status === 429 ? 429 : 503 })
    }
    return NextResponse.json({ success: true, message: 'If your account needs confirmation, a new link is on its way. Check your inbox and spam folder.' })
  } catch (error) {
    return apiError(error, 'We could not send your confirmation email. Please try again shortly.')
  }
}
