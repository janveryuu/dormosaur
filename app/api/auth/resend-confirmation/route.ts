import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendBrandedConfirmationEmail } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 })
    }

    const cleanEmail = email.trim()
    const supabase = await createClient()
    const origin = req.headers.get('origin') || 'https://dormosaur.vercel.app'
    const redirectUrl = `${origin}/api/auth/callback`

    // 1. Call Supabase Auth Resend
    const { error: supabaseErr } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })

    if (supabaseErr) {
      console.warn('[Resend API Notice] Supabase auth.resend warning:', supabaseErr.message)
    }

    // 2. If RESEND_API_KEY is present, also send direct branded email via Resend API
    if (process.env.RESEND_API_KEY) {
      const confirmationUrl = redirectUrl
      await sendBrandedConfirmationEmail({
        email: cleanEmail,
        confirmationUrl,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully. Please check your inbox or spam folder.',
    })
  } catch (err: any) {
    console.error('[Resend API Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to resend confirmation email. Please try again.' },
      { status: 500 }
    )
  }
}
