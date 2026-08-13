import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/schedule', '/alarms', '/kitchen', '/profile']

// Routes only for unauthenticated users
const AUTH_ROUTES = ['/sign-in', '/sign-up']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user, supabase } = await updateSession(request)

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  let isOnboarded = Boolean(user?.user_metadata?.onboarding_completed)

  // If user metadata does not confirm onboarding, query profiles table in Supabase
  if (user && !isOnboarded) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (profile && profile.onboarding_completed === true) {
        isOnboarded = true
      }
    } catch (e) {
      console.warn('[Proxy Middleware Notice] Profile query check:', e)
    }
  }

  // 1. Logged in user who has NOT completed onboarding -> force to /onboarding
  if (user && !isOnboarded && pathname !== '/onboarding' && !pathname.startsWith('/api')) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // 2. Unauthenticated user trying to access a protected page -> /sign-in
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 3. Fully onboarded user trying to access sign-in/sign-up -> /dashboard
  if (isAuthRoute && user && isOnboarded) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and API routes
    '/((?!_next/static|_next/image|favicon.ico|icon.*|apple-icon.*|public|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
