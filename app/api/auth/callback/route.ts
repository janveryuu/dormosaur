import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getUserProfile, seedNewUser } from '@/lib/db'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextParam = requestUrl.searchParams.get('next')
  const defaultNext = nextParam && nextParam !== '/onboarding' ? nextParam : '/dashboard'
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in`)
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

    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

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
              avatar_url: meta?.avatar_url || meta?.picture || '',
              initials,
              onboarding_completed: false,
            }).catch((e) => console.error('seed error:', e))
          }

          return NextResponse.redirect(`${origin}/onboarding`)
        }

        return NextResponse.redirect(`${origin}${defaultNext}`)
      } catch (dbErr) {
        console.error('DB error in callback:', dbErr)
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    } else {
      console.warn('OAuth code exchange notice:', error?.message)
      // If code was already used or expired, user is likely already signed in -> check session
      const { data: sessionData } = await supabase.auth.getUser()
      if (sessionData?.user) {
        const existing = await getUserProfile(supabase, sessionData.user.id)
        if (existing && existing.onboarding_completed === true) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  } catch (err) {
    console.error('Top-level auth callback catch:', err)
  }

  // Graceful fallback redirect on any code failure
  return NextResponse.redirect(`${origin}/onboarding`)
}
