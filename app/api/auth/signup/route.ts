import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidEmailFormat } from '@/lib/email-utils'
import { authErrorMessage } from '@/lib/auth-errors'
import { apiError, boundedText, clientIp, consumeRateLimit, InputError, readJson } from '@/lib/api-security'

const CONFIRMATION_RESPONSE = {
  success: true,
  requiresConfirmation: true,
  message: 'Check your email to confirm your account before logging in.',
}

/**
 * Account sign-up with mandatory Supabase email confirmation.
 * Uses uniform 200 responses to prevent email-existence enumeration and blocks
 * pre-account takeover or Pro trial farming with unverified email addresses.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req)
    consumeRateLimit(`signup:ip:${ip}`, 5, 10 * 60_000)

    const body = await readJson(req, 4096)
    const email = boundedText(body.email, 254, 'email address', true).trim().toLowerCase()
    const name = boundedText(body.name, 80, 'name', true).trim()
    const password = typeof body.password === 'string' ? body.password : ''
    if (!isValidEmailFormat(email)) throw new InputError('Please enter a valid email address.')
    if (password.length < 8 || password.length > 128) throw new InputError('Use a password with at least 8 characters.')

    consumeRateLimit(`signup:email:${email}`, 3, 10 * 60_000)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const origin = appUrl && /^https?:\/\//.test(appUrl) ? new URL(appUrl).origin : new URL(req.url).origin
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${origin}/api/auth/callback`,
      },
    })

    if (error) {
      const taken = /already|registered|exists/i.test(error.message) || /exists/.test(error.code || '')
      if (taken) return NextResponse.json(CONFIRMATION_RESPONSE)
      const status = error.status === 429 ? 429 : 400
      return NextResponse.json({ error: authErrorMessage(error, 'signup') }, { status })
    }

    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return NextResponse.json(CONFIRMATION_RESPONSE)
    }

    return NextResponse.json(CONFIRMATION_RESPONSE)
  } catch (error) {
    return apiError(error, 'We could not create your account. Please try again.')
  }
}
