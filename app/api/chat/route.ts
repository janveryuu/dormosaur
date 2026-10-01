import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadStudentContext, type Diagnostic } from '@/lib/copilot/context'
import { emptyContext, InputError, readPayload, record, resolveContext, sanitizeMessages } from '@/lib/copilot/input'
import { providerConfigs } from '@/lib/copilot/providers'
import { answerConversation } from '@/lib/copilot/service'

export const runtime = 'nodejs'
export const maxDuration = 40

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID()
  // Only operational metadata: never raw errors, messages, IDs, profiles or keys.
  const diagnostic: Diagnostic = (event, details) => console.info('[Dormosaur Copilot]', JSON.stringify({ requestId, event, ...details }))
  try {
    const body = await readPayload(req)
    const messages = sanitizeMessages(body.messages)
    const device = record(body.context ?? body.userContext)
    let context = emptyContext('unavailable')
    let authTimer: ReturnType<typeof setTimeout> | undefined
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_resolve, reject) => {
          authTimer = setTimeout(() => reject(new Error('auth_timeout')), 5000)
        }),
      ])
      if (user) {
        context = resolveContext(true, await loadStudentContext(supabase, user.id, diagnostic), device)
      } else if (!error || error.name === 'AuthSessionMissingError') {
        context = resolveContext(false, null, device)
      } else {
        // Failed auth never permits substituting browser profile data.
        diagnostic('context_unavailable', { collection: 'authentication' })
      }
    } catch {
      diagnostic('context_unavailable', { collection: 'authentication' })
    } finally { clearTimeout(authTimer) }
    const result = await answerConversation({ messages, context, timeZone: device.timeZone,
      providers: providerConfigs(process.env, diagnostic), diagnostic })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: error.status })
    diagnostic('request_failed', { reason: 'unexpected_error' })
    return NextResponse.json({ error: 'Copilot couldn’t complete that request. Please try again shortly.' }, { status: 500 })
  }
}
