export function authErrorMessage(error: { code?: string; status?: number; message?: string }, action: 'signup' | 'signin' | 'resend' = 'signin') {
  const code = error.code || ''
  const message = (error.message || '').toLowerCase()
  if (error.status === 429 || /rate|too_many|over_.*limit/.test(code)) return 'Too many attempts. Please wait a minute and try again.'
  if (code === 'email_not_confirmed') return 'Please confirm your email before signing in. Check your inbox and spam folder.'
  if (/already|exists/.test(code) || message.includes('already registered')) return 'An account already exists for this email. Please sign in.'
  if (/email.*invalid|validation_failed/.test(code) || message.includes('invalid email') || message.includes('is invalid')) return 'Please check your email address. If it is correct, try again shortly or use Google sign-in.'
  if (code === 'weak_password') return 'Choose a stronger password with at least 8 characters.'
  if (code === 'invalid_credentials' || /invalid login credentials|user not found|invalid grant/.test(message)) return 'Incorrect email or password.'
  if (action === 'resend') return 'We could not send your confirmation email. Please try again shortly.'
  return action === 'signup' ? 'We could not create your account right now. Please try again shortly.' : 'We could not sign you in right now. Please try again shortly.'
}
export function safeNextPath(value: string | null): string {
  if (!value || /[\\\r\n]/.test(value)) return '/dashboard'
  return ['/dashboard', '/schedule', '/alarms', '/deadlines', '/kitchen', '/profile'].some(p => value === p || value.startsWith(`${p}/`) || value.startsWith(`${p}?`)) ? value : '/dashboard'
}
