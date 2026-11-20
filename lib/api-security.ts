import 'server-only'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { InputError, readPayload } from '@/lib/copilot/input'

export { InputError }
// Bounded, per-runtime protection. Production WAF limits must also cover cold
// starts/multiple instances; this is not a distributed quota ledger.
const requests = new Map<string, { count: number; expires: number }>()
export function consumeRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now()
  for (const [id, entry] of requests) if (entry.expires <= now) requests.delete(id)
  const entry = requests.get(key)
  if (entry && entry.count >= limit) throw new InputError('Please wait a minute before trying again.', 429)
  if (entry) entry.count++
  else {
    if (requests.size >= 10_000) throw new InputError('Please try again shortly.', 503)
    requests.set(key, { count: 1, expires: now + windowMs })
  }
}
// The native app (mobile/) has no cookies; it sends its Supabase access token
// as `Authorization: Bearer <jwt>`. RLS still applies via the forwarded token.
async function bearerClient(): Promise<{ supabase: SupabaseClient; token: string } | null> {
  let auth = ''
  try { auth = (await headers()).get('authorization') || '' } catch { return null } // outside a request scope
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return null
  const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return { supabase, token }
}
export async function requireAuthenticated(bucket = 'ai', limit = 20) {
  const bearer = await bearerClient()
  const supabase = bearer?.supabase ?? await createClient()
  const { data: { user }, error } = bearer ? await supabase.auth.getUser(bearer.token) : await supabase.auth.getUser()
  if (!user || user.is_anonymous) throw new InputError('Please sign in to continue.', 401)
  if (error) throw new InputError('We could not check your session. Please try again.', 503)
  consumeRateLimit(`${bucket}:${user.id}`, limit)
  return { supabase, user }
}
export async function readJson(req: Request, maxBytes = 64 * 1024) {
  return readPayload(req, maxBytes)
}
export function apiError(error: unknown, message: string) {
  if (error instanceof InputError) return NextResponse.json({ success: false, error: error.message }, {
    status: error.status, headers: error.status === 429 ? { 'Retry-After': '60' } : undefined,
  })
  console.warn('[Dormosaur API]', { category: 'request_failed' })
  return NextResponse.json({ success: false, error: message }, { status: 503 })
}
export function boundedText(value: unknown, max: number, label: string, required = false): string {
  if (value === undefined && !required) return ''
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    throw new InputError(`Please provide a valid ${label} (up to ${max} characters).`)
  }
  return value.trim()
}
export function stringList(value: unknown, maxItems: number, maxLength: number, label: string): string[] {
  if (!Array.isArray(value) || value.length > maxItems || value.some(v => typeof v !== 'string' || !v.trim() || v.length > maxLength)) {
    throw new InputError(`Please check the selected ${label}.`)
  }
  return [...new Set(value.map(v => (v as string).trim()))]
}
