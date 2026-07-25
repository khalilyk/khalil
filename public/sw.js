// Khalil push service worker
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data.json() } catch (e) { data = { title: 'Khalil', body: event.data ? event.data.text() : '' } }
  const title = data.title || 'Khalil'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag,
    data: { url: data.url || '/' },
    vibrate: [80, 40, 80],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// iOS/browsers periodically rotate the push subscription. When that happens,
// re-subscribe with the same VAPID key and tell the server, so notifications
// don't silently "turn off".
const VAPID_PUBLIC_KEY = 'BGfEzDN_gSqAlyV-7pC8aFYaMvcye6scuI-phQlpHzZSAaeF5Huj_neCHYzTVGPbeILOVDakp_EkiTL2GeSLCy4'

function b64ToUint8(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64ToUint8(VAPID_PUBLIC_KEY),
    }).then((sub) =>
      fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
    ).catch(() => {})
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus() }
      }
      return clients.openWindow(url)
    })
  )
})
