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
  fireNotification();
});

self.addEventListener('message', (event) => {
  console.log('[SW] on message:', event.data);
  fireNotification('Test', 'This is for testing purpose');
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
  console.log('[SW] on pushsubscriptionchange', event);
  const result = self.registration.pushManager.subscribe({userVisibleOnly: true})
  .then((subscription) => {
    const subscriptionObj = subscription.toJSON();
    delete subscriptionObj['expirationTime'];
    return Promise.all([cachedDatabase, Promise.resolve(subscriptionObj)]);
  })
  .then(values => {
    return values[0].put('appPreferences', values[1], 'updatedPushSubscription');
  })
  .then(key => {
    console.log('[SW]@pushsubscriptionchange:', key);
    fireNotification('System Update', 'Please re-launch app to apply new push notification subscription');
  })
  .catch(err => {
    console.error('[SW]@pushsubscriptionchange:', err);
    fireNotification('System Update', 'Unable to resubscribe for push notification');
  });
  event.waitUntil(result);
});

function fireNotification(title, body, requireInteraction = false, actions = []) {
  let notificationPromise = self.registration.showNotification(title || 'TeleKram', {
    body: body || 'Hello from TeleKram',
    requireInteraction: requireInteraction,
    actions: actions
  });
}
