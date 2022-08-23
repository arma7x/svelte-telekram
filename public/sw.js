importScripts('/js/polyfill.min.js');
importScripts('/js/idb.js');

const cachedDatabase = idb.openDB('telekram', 4, {
  upgrade: (db, oldVersion, newVersion) => {
    const tables = ['profilePhotos', 'chatPreferences', 'mediaAttachments', 'offlineWebpages'];
    tables.forEach(n => {
      if (!db.objectStoreNames.contains(n))
        db.createObjectStore(n);
    });
  },
});

self.addEventListener('install', function(event) {
  console.log('[SW] on install');
});

self.addEventListener('activate', function(event) {
  console.log('[SW] on activate')
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  console.log('[SW] on fetch');
});

self.addEventListener('push', function(event) {
  console.log('[SW] on push');
});

self.addEventListener('notificationclick', function(event) {
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

self.addEventListener('notificationclose', function(event) {
  console.log('[SW] on notificationclose');
});
