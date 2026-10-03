import { NextRequest, NextResponse } from 'next/server'
import { apiError, requireAuthenticated } from '@/lib/api-security'
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
    const { supabase, user } = await requireAuthenticated('copilot', 20)
    const body = await readPayload(req)
    const messages = sanitizeMessages(body.messages)
    const device = record(body.context ?? body.userContext)
    let context = emptyContext('unavailable')
    let authTimer: ReturnType<typeof setTimeout> | undefined
    try {
      context = await Promise.race([
        loadStudentContext(supabase, user.id, diagnostic),
        new Promise<never>((_resolve, reject) => {
          authTimer = setTimeout(() => reject(new Error('auth_timeout')), 5000)
        }),
      ])
      context = resolveContext(true, context, device)
    } catch {
      diagnostic('context_unavailable', { collection: 'authentication' })
    } finally { clearTimeout(authTimer) }
    const result = await answerConversation({ messages, context, timeZone: context.profile.timezone || device.timeZone,
      providers: providerConfigs(process.env, diagnostic), diagnostic })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof InputError) return apiError(error, 'Copilot could not complete that request.')
    diagnostic('request_failed', { reason: 'unexpected_error' })
    return NextResponse.json({ error: 'Copilot couldn’t complete that request. Please try again shortly.' }, { status: 500 })
  }
}
