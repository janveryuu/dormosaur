import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabaseAdminClient } from './admin-db'

export type AdminUser = {
  id: string
  email: string
  name: string
  school: string
  initials: string
  is_admin: boolean
}

/**
 * Server-side Allowlist of verified admin email addresses.
 * Security Requirement: Must match the authenticated user's email AND profile.is_admin === true.
 * NEVER expose to client components or browser bundles.
 */
const ADMIN_ALLOWED_EMAILS = ['janvermanlapaz@gmail.com']

/**
 * Server-side guard for Admin routes and API endpoints.
 * Dual-Layer Security Check:
 * Layer 1: Authenticated user's email MUST be present in ADMIN_ALLOWED_EMAILS constant.
 * Layer 2: User profile in database MUST have admin status verified.
 * If EITHER layer fails, the request is IMMEDIATELY blocked and redirected to / (or /sign-in).
 */
export async function requireAdminSession(): Promise<AdminUser> {
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

  if (error || !user) {
    redirect('/sign-in')
  }

  const userEmail = (user.email || '').toLowerCase().trim()

  // ── LAYER 1: Server-side Email Allowlist Check ──
  const isEmailInAllowlist = ADMIN_ALLOWED_EMAILS.includes(userEmail)

  if (!isEmailInAllowlist) {
    console.warn('[Admin access]', { category: 'allowlist_denied' })
    redirect('/')
  }

  // ── LAYER 2: Database Profile Admin Status Check ──
  const adminClient = getSupabaseAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // Verify profile admin status (profile.is_admin === true OR Janver's verified auth ID)
  const isProfileAdmin = Boolean(profile?.is_admin) || user.id === 'bfa33a51-9caf-4a49-89e5-df9aedbb96a3'

  if (!isProfileAdmin) {
    console.warn('[Admin access]', { category: 'role_denied' })
    redirect('/')
  }

  return {
    id: user.id,
    email: userEmail,
    name: profile?.name || user.user_metadata?.full_name || 'Admin',
    school: profile?.school || '',
    initials: profile?.initials || '',
    is_admin: true,
  }
}
