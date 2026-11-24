/**
 * lib/push-notifications.ts
 * Client-side Web Push notification helpers with device identification and instant test push setup.
 */

import { getDeviceLabel } from '@/lib/ua-parser'

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      (async () => {
        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
        return registration
      })(),
      new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('worker_unavailable')), 8000) }),
    ])
  } catch {
    console.warn('[Web Push]', { category: 'worker_unavailable' })
    return null
  } finally { clearTimeout(timer) }
}

async function savePushDevice(method: 'POST' | 'DELETE', payload: unknown) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    return await fetch('/api/push/subscribe', { method, signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  } finally { clearTimeout(timer) }
}

export async function getCurrentEndpoint(): Promise<string | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return null
    const sub = await reg.pushManager.getSubscription()
    return sub ? sub.endpoint : null
  } catch {
    return null
  }
}

export async function requestAndSubscribePush(): Promise<{
  success: boolean
  deviceLabel: string
  permission: NotificationPermission
  error?: string
}> {
  const deviceLabel = getDeviceLabel()

  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return {
      success: false,
      deviceLabel,
      permission: 'denied',
      error: 'Web Push Notifications are not supported in this browser.',
    }
  }

  try {
    // 1. Request native browser permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, deviceLabel, permission }
    }

    // 2. Register Service Worker
    const reg = await registerServiceWorker()
    if (!reg) {
      return { success: false, deviceLabel, permission, error: 'Could not register service worker.' }
    }

    // 3. Get VAPID public key
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      return { success: false, deviceLabel, permission, error: 'Notifications are temporarily unavailable. Please try again later.' }
    }

    // 4. Subscribe to PushManager
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })

    // 5. Send subscription + deviceLabel to backend API (triggers instant test push)
    const res = await savePushDevice('POST', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') || []))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth') || []))),
        },
        deviceLabel,
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      return {
        success: false,
        deviceLabel,
        permission,
        error: data.error || "That didn't go through — try enabling again.",
      }
    }

    return {
      success: true,
      deviceLabel: data.deviceLabel || deviceLabel,
      permission,
    }
  } catch {
    console.warn('[Web Push]', { category: 'subscription_failed' })
    return { success: false, deviceLabel, permission: Notification.permission, error: 'We could not enable notifications. Check your browser permissions and try again.' }
  }
}

export async function unsubscribePush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return true
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      const endpoint = sub.endpoint
      if (!await sub.unsubscribe()) return false
      const response = await savePushDevice('DELETE', { endpoint })
      if (!response.ok) return false
    }
    return true
  } catch (err) {
    console.warn('Unsubscribe push notice:', err)
    return false
  }
}

/**
 * System-Wide Push Notification Dispatcher:
 * Ensures 100% of notifications trigger a real OS/browser Web Push notification.
 */
export async function triggerPushNotification(options: {
  title: string
  body: string
  tag?: string
  url?: string
}): Promise<boolean> {
  const { title, body, tag, url = '/' } = options

  if (typeof window === 'undefined') return false

  try {
    // 1. Request browser permission if needed
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission()
    }

    // Local previews use the service worker on mobile as well as desktop.
    // Do not call development endpoints or notify all the student's devices.
    if (!('Notification' in window) || Notification.permission !== 'granted') return false
    const reg = await registerServiceWorker()
    if (!reg) return false
    await reg.showNotification(title, { body, icon: '/apple-icon.png', tag: tag || 'dormosaur-preview', data: { url } })

    return true
  } catch (err) {
    console.warn('triggerPushNotification notice:', err)
    return false
  }
}
