import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabaseAdminClient } from './admin-db'
import { consumeRateLimit, InputError } from './api-security'

export type AdminUser = {
  id: string
  email: string
  name: string
  school: string
  initials: string
  is_admin: boolean
}

function allowedAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_ALLOWED_EMAILS || 'janvermanlapaz@gmail.com')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAllowedAdminEmail(email: string | undefined | null): boolean {
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return false
  return allowedAdminEmails().has(normalized)
}

async function resolveAdminUser(): Promise<{ user: AdminUser | null; reason: 'unauthenticated' | 'forbidden' | 'ok' }> {
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
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user || user.is_anonymous) {
    return { user: null, reason: 'unauthenticated' }
  }

  const userEmail = (user.email || '').toLowerCase().trim()
  if (!isAllowedAdminEmail(userEmail)) {
    console.warn('[Admin access]', { category: 'allowlist_denied' })
    return { user: null, reason: 'forbidden' }
  }

  const adminClient = getSupabaseAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('name,school,initials,is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_admin && user.id !== 'bfa33a51-9caf-4a49-89e5-df9aedbb96a3') {
    console.warn('[Admin access]', { category: 'role_denied' })
    return { user: null, reason: 'forbidden' }
  }

  return {
    reason: 'ok',
    user: {
      id: user.id,
      email: userEmail,
      name: profile?.name || user.user_metadata?.full_name || 'Admin',
      school: profile?.school || '',
      initials: profile?.initials || '',
      is_admin: true,
    },
  }
}

function assertSameOrigin(req: Request) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return
  const fetchSite = (req.headers.get('sec-fetch-site') || '').toLowerCase()
  if (fetchSite === 'cross-site') {
    throw new InputError('Cross-site requests are not allowed.', 403)
  }
  const origin = req.headers.get('origin')
  if (!origin) return
  let originHost = ''
  try {
    originHost = new URL(origin).host.toLowerCase()
  } catch {
    throw new InputError('Cross-site requests are not allowed.', 403)
  }
  const allowedHosts = new Set<string>()
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0]?.trim().toLowerCase()
  if (host) allowedHosts.add(host)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl && /^https?:\/\//.test(appUrl)) {
    try { allowedHosts.add(new URL(appUrl).host.toLowerCase()) } catch {}
  }
  if (!allowedHosts.has(originHost)) {
    throw new InputError('Cross-site requests are not allowed.', 403)
  }
}

/** Server-component guard for `/admin` pages (redirects unauthenticated/unauthorized browsers). */
export async function requireAdminSession(): Promise<AdminUser> {
  const { user, reason } = await resolveAdminUser()
  if (reason === 'unauthenticated') redirect('/sign-in')
  if (!user) redirect('/')
  return user
}

/** API route guard for `/api/admin/*` (checks Origin CSRF, returns 401/403 JSON, never redirects). */
export async function requireAdminApi(req: Request): Promise<AdminUser> {
  assertSameOrigin(req)
  const { user, reason } = await resolveAdminUser()
  if (reason === 'unauthenticated') throw new InputError('Please sign in to continue.', 401)
  if (!user) throw new InputError('Administrator access is required.', 403)
  consumeRateLimit(`admin-api:${user.id}`, 60, 60_000)
  return user
}
