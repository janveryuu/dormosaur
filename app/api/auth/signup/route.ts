import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/admin-db'
import { isValidEmailFormat } from '@/lib/email-utils'
import { apiError, boundedText, consumeRateLimit, InputError, readJson } from '@/lib/api-security'

/**
 * Instant sign-up for the mobile app: creates an already-confirmed account,
 * so no verification email is needed. The client signs in right after.
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    consumeRateLimit(`signup:${ip}`, 5, 10 * 60_000)

    const body = await readJson(req, 4096)
    const email = boundedText(body.email, 254, 'email address', true).trim().toLowerCase()
    const name = boundedText(body.name, 80, 'name', true).trim()
    const password = typeof body.password === 'string' ? body.password : ''
    if (!isValidEmailFormat(email)) throw new InputError('Please enter a valid email address.')
    if (password.length < 8 || password.length > 128) throw new InputError('Use a password with at least 8 characters.')

    const { error } = await getSupabaseAdminClient().auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name },
    })
    if (error) {
      const taken = /already|registered|exists/i.test(error.message)
      return NextResponse.json(
        { error: taken ? 'An account with this email already exists. Try logging in.' : 'We could not create your account. Please try again.' },
        { status: taken ? 409 : 400 },
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error, 'We could not create your account. Please try again.')
  }
}
