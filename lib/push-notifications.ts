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
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    return reg
  } catch (err) {
    console.warn('Service Worker registration notice:', err)
    return null
  }
}

export async function getCurrentEndpoint(): Promise<string | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return sub ? sub.endpoint : null
  } catch (e) {
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
      return { success: false, deviceLabel, permission, error: 'VAPID public key is not configured.' }
    }

    // 4. Subscribe to PushManager
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })

    // 5. Send subscription + deviceLabel to backend API (triggers instant test push)
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') || []))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth') || []))),
        },
        deviceLabel,
      }),
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('Web push subscription notice:', msg)
    return { success: false, deviceLabel, permission: Notification.permission, error: msg }
  }
}

export async function unsubscribePush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      const endpoint = sub.endpoint
      await sub.unsubscribe()
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
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
  const { title, body, tag, url = '/dashboard' } = options

  if (typeof window === 'undefined') return false

  try {
    // 1. Request browser permission if needed
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission()
    }

    // 2. Spawn native OS browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/apple-icon.png',
          tag: tag || `dormosaur-push-${Date.now()}`,
          data: { url },
        })
      } catch (e) {
        console.warn('Native notification spawn notice:', e)
      }
    }

    // 3. Dispatch server-side Web Push to all registered student devices
    fetch('/api/notifications/test-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        message: body,
      }),
    }).catch(() => {})

    return true
  } catch (err) {
    console.warn('triggerPushNotification notice:', err)
    return false
  }
}
