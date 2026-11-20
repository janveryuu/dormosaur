import { InputError } from '@/lib/api-security'
export const EXPO_KEY_PLACEHOLDER = 'expo'
export function validExpoPushToken(value: unknown): value is string {
  return typeof value === 'string' && value.length < 200 && /^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/.test(value)
}
export function validPushEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') &&
      (host === 'fcm.googleapis.com' || host === 'updates.push.services.mozilla.com' || host.endsWith('.push.services.mozilla.com') || host === 'web.push.apple.com' || host.endsWith('.push.apple.com') || host.endsWith('.notify.windows.com'))
  } catch { return false }
}
export function validatePushSubscription(value: Record<string, unknown>) {
  const keys = value.keys as Record<string, unknown> | null
  const keyValid = (key: unknown, length: number) => typeof key === 'string' && key.length < 150 && /^[A-Za-z0-9_+\/-]+={0,2}$/.test(key) && Buffer.from(key, 'base64').length === length
  if (!validPushEndpoint(value.endpoint) || !keys || !keyValid(keys.p256dh, 65) || !keyValid(keys.auth, 16)) throw new InputError('This notification subscription is invalid. Please enable notifications again.')
  const deviceLabel = typeof value.deviceLabel === 'string' ? value.deviceLabel.trim().slice(0, 100) : 'Web Browser'
  return { endpoint: value.endpoint, keys: { p256dh: keys.p256dh as string, auth: keys.auth as string }, deviceLabel }
}
