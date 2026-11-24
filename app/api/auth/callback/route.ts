import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getUserProfile, seedNewUser } from '@/lib/db'
import { safeNextPath } from '@/lib/auth-errors'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const nextParam = requestUrl.searchParams.get('next')
  const defaultNext = safeNextPath(nextParam)
  const origin = requestUrl.origin

  if (!code && !(tokenHash && (type === 'email' || type === 'signup'))) {
    return NextResponse.redirect(`${origin}/sign-in?error=confirmation_expired`)
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              )
            } catch {
              // Ignore cookie set errors in server context
            }
          },
        },
      },
    )

    const { error, data } = tokenHash && (type === 'email' || type === 'signup')
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : await supabase.auth.exchangeCodeForSession(code!)

    if (!error && data?.user) {
      const userId = data.user.id

      try {
        const existing = await getUserProfile(supabase, userId)
        const isFullyOnboarded = Boolean(
          existing && existing.onboarding_completed === true,
        )

        if (!isFullyOnboarded) {
          if (!existing) {
            const meta = data.user.user_metadata
            const fullName: string = meta?.full_name || meta?.name || 'Student'
            const parts = fullName.trim().split(' ')
            const initials =
              parts.length >= 2
                ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
                : fullName.slice(0, 2).toUpperCase() || '??'

            await seedNewUser(supabase, userId, {
              name: fullName,
              school: '',
              dorm: 'Dorm Room',
              year: '',
              initials,
              onboarding_completed: false,
            })
          }

          return NextResponse.redirect(`${origin}/?confirmed=1`)
        }

        // Students confirm here, then continue in the app; only explicit admin destinations stay on the web.
        return NextResponse.redirect(nextParam?.startsWith('/admin') ? `${origin}${defaultNext}` : `${origin}/?confirmed=1`)
      } catch {
        console.warn('[Auth Callback]', { category: 'profile_unavailable' })
        return NextResponse.redirect(`${origin}/?confirmed=1`)
      }
    } else {
      console.warn('[Auth Callback]', { category: 'confirmation_failed' })
      // If code was already used or expired, user is likely already signed in -> check session
      const { data: sessionData } = await supabase.auth.getUser()
      if (sessionData?.user) {
        const existing = await getUserProfile(supabase, sessionData.user.id)
        if (existing && existing.onboarding_completed === true) {
          return NextResponse.redirect(`${origin}/?confirmed=1`)
        }
        return NextResponse.redirect(`${origin}/?confirmed=1`)
      }
    }
  } catch {
    console.warn('[Auth Callback]', { category: 'callback_failed' })
  }

  // Graceful fallback redirect on any code failure
  return NextResponse.redirect(`${origin}/sign-in?error=confirmation_expired`)
}
