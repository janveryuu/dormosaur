import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// The student experience lives in the native app (mobile/). The web keeps:
//   /          public APK download page
//   /sign-in   admin sign-in
//   /admin     admin console (also guarded server-side by lib/admin-auth.ts)
const PROTECTED_ROUTES = ['/admin']
const AUTH_ROUTES = ['/sign-in']
// Retired student pages; old bookmarks and notification links land on the download page.
const RETIRED_ROUTES = ['/dashboard', '/schedule', '/alarms', '/deadlines', '/kitchen', '/profile', '/onboarding', '/sign-up', '/video']

const matches = (pathname: string, routes: string[]) =>
  routes.some(route => pathname === route || pathname.startsWith(`${route}/`))

function isAllowedAdminEmail(email: string | undefined | null): boolean {
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return false
  return (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (matches(pathname, RETIRED_ROUTES)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const { supabaseResponse, user } = await updateSession(request)
  const redirectWithCookies = (url: URL) => {
    const response = NextResponse.redirect(url)
    for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie)
    return response
  }

  if (matches(pathname, PROTECTED_ROUTES) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('next', pathname)
    return redirectWithCookies(url)
  }

  if (matches(pathname, AUTH_ROUTES) && user && isAllowedAdminEmail(user.email)) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    url.search = ''
    return redirectWithCookies(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and API routes
    '/((?!_next/static|_next/image|\\.well-known|site\\.webmanifest|sw\\.js|favicon.ico|icon.*|apple-icon.*|public|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|apk)$).*)',
  ],
}
