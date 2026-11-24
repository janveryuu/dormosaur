import 'server-only'
import { Resend } from 'resend'
import { DEFAULT_SENDER_EMAIL } from '@/lib/resend'

const ADMIN_EMAIL = 'janvermanlapaz@gmail.com'
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://dormosaur.vercel.app').replace(/\/$/, '')
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s: string) => s.replace(/[&<>"']/g, c => ESC[c])

/** Emails the admin whenever a student submits a Pro payment receipt. */
export async function sendPaymentAlert(p: { paymentId: string; email: string; plan: string; amount: number; wallet: string; transactionRef: string; referenceCode: string }) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  const link = `${APP_URL}/admin/payments?id=${p.paymentId}`
  const row = (k: string, v: string) => `<tr><td style="padding:6px 12px 6px 0;color:#667">${k}</td><td style="padding:6px 0;font-weight:600">${esc(v)}</td></tr>`
  await new Resend(key).emails.send({
    from: DEFAULT_SENDER_EMAIL,
    to: [ADMIN_EMAIL],
    subject: `New Pro payment: ₱${p.amount} ${p.plan} via ${p.wallet}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px">
      <h2 style="color:#0B6A40;margin:0 0 12px">New payment to review 🦕</h2>
      <table>${row('Student', p.email)}${row('Plan', `${p.plan} (₱${p.amount})`)}${row('Wallet', p.wallet)}${row('Message code', p.referenceCode)}${row('Transaction no.', p.transactionRef)}</table>
      <p style="color:#667">Check that ₱${p.amount} actually arrived in your ${esc(p.wallet)} before approving.</p>
      <a href="${link}" style="display:inline-block;background:#0B6A40;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Review payment</a>
    </div>`,
  })
}
