// Dormosaur Service Worker — Web Push Notifications Handler

self.addEventListener('install', function (event) {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', function (event) {
  let data = {
    title: 'Dormosaur',
    body: "You're all set — notifications are on for this device.",
    icon: '/apple-icon.png',
    badge: '/apple-icon.png',
    tag: 'dormosaur-notification',
    data: { url: '/dashboard' },
  }

  if (event.data) {
    try {
      const parsed = event.data.json()
      data = { ...data, ...parsed }
    } catch (e) {
      data.body = event.data.text() || data.body
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/apple-icon.png',
    badge: data.badge || '/apple-icon.png',
    tag: data.tag || 'dormosaur-notification',
    renotify: false,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: data.data || { url: '/dashboard' },
    actions: [
      { action: 'open', title: 'Open Dashboard' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title || 'Dormosaur', options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  if (event.action === 'dismiss') return

  let targetUrl = new URL('/dashboard', self.location.origin).href
  try {
    const requested = new URL((event.notification.data && event.notification.data.url) || '/dashboard', self.location.origin)
    if (requested.origin === self.location.origin) targetUrl = requested.href
  } catch { /* Use the dashboard for invalid/external links. */ }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url && 'focus' in client) {
          return client.navigate(targetUrl).then(() => client.focus())
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
