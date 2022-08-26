importScripts('/js/polyfill.min.js');
importScripts('/js/idb.js');

const cachedDatabase = idb.openDB('telekram', 5, {
  upgrade: (db, oldVersion, newVersion) => {
    const tables = ['profilePhotos', 'chatPreferences', 'mediaAttachments', 'offlineWebpages', 'appPreferences'];
    tables.forEach(n => {
      if (!db.objectStoreNames.contains(n))
        db.createObjectStore(n);
    });
  },
});

self.addEventListener('install', (event) => {
  console.log('[SW] on install');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[SW] on activate')
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // console.log('[SW] on fetch');
});

self.addEventListener('push', (event) => {
  console.log('[SW] on push');
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] on notificationclick');
  event.notification.close();
  if (event.action === 'open') {
    event.waitUntil(clients.matchAll({ type: "window" })
    .then((clientList) => {
      for (var i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url == '/' && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
      if (clients.openApp) {
        return clients.openApp();
      }
    })
    .catch((err) => {
      console.log(err);
    }));
  }
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] on notificationclose');
});

// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/pushsubscriptionchange_event
self.addEventListener('pushsubscriptionchange', (event) => {
  // self.registration.pushManager
  // save new subscription to appPreferences.updatePushSubscription
  console.log('[SW] on notificationclose', event);
});
