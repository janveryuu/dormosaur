/**
 * lib/resend.ts
 * Resend Email Service helper for sending confirmation & transactional emails.
 * Uses Resend default shared verified domain: Dormosaur <onboarding@resend.dev>
 */

import { Resend } from 'resend'
import { getDormosaurConfirmationEmailHtml } from './email-templates'

const resendApiKey = process.env.RESEND_API_KEY || ''
const resend = resendApiKey ? new Resend(resendApiKey) : null

export const DEFAULT_SENDER_EMAIL = 'Dormosaur <onboarding@resend.dev>'

interface SendConfirmationEmailParams {
  email: string
  name?: string
  confirmationUrl: string
}

export async function sendBrandedConfirmationEmail(params: SendConfirmationEmailParams) {
  if (!resend) {
    console.warn('[Resend Service] RESEND_API_KEY is not configured in environment variables.')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const html = getDormosaurConfirmationEmailHtml({
      name: params.name,
      confirmationUrl: params.confirmationUrl,
    })

    const data = await resend.emails.send({
      from: DEFAULT_SENDER_EMAIL,
      to: [params.email],
      subject: 'Confirm your Dormosaur account',
      html,
    })

    return { success: true, data }
  } catch (error: any) {
    console.error('[Resend Service Error]:', error)
    return { success: false, error: error?.message || 'Failed to send confirmation email' }
  }
}
