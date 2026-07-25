/* global self, clients */
self.addEventListener('push', (event) => {
  let data = { title: 'Order update', body: '', url: '/' }
  try {
    data = { ...data, ...(event.data ? event.data.json() : {}) }
  } catch {
    // ignore malformed payload
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Order update', {
      body: data.body || '',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
