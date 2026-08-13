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
    tag: 'dormosaur-notification-' + Date.now(),
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

  // Generate unique tag if static tag provided to prevent Chrome duplicate suppression
  const uniqueTag = data.tag ? `${data.tag}-${Date.now()}` : `dormosaur-${Date.now()}`

  const options = {
    body: data.body,
    icon: data.icon || '/apple-icon.png',
    badge: data.badge || '/apple-icon.png',
    tag: uniqueTag,
    renotify: true,
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

  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
