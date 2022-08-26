declare var telegram:any;
declare var idb:any;

import { parseUserAgent } from './misc';
import TelegramKeyHash from '../telegram_key';

const APP_VERSION = "1.0.0";
const UA = parseUserAgent(navigator.userAgent);
UA['appVersion'] = APP_VERSION;

const { Api, TelegramClient, AuthKey } = telegram;
const { StoreSession } = telegram.sessions;
const session = new StoreSession("gramjs");
const client: typeof TelegramClient = new TelegramClient(session, TelegramKeyHash.api_id, TelegramKeyHash.api_hash, {
  maxConcurrentDownloads: 1,
  deviceModel: UA.deviceModel,
  systemVersion: UA.systemVersion,
  appVersion: UA.appVersion,
});
client.setLogLevel('none');

// Duplicate same instance in authorizedWebWorker and sw.js
const cachedDatabase = idb.openDB('telekram', 5, {
  upgrade: (db, oldVersion, newVersion) => {
    const tables = ['profilePhotos', 'chatPreferences', 'mediaAttachments', 'offlineWebpages', 'appPreferences'];
    tables.forEach(n => {
      if (!db.objectStoreNames.contains(n))
        db.createObjectStore(n);
    });
  },
});

export {
  UA,
  Api,
  AuthKey,
  TelegramClient,
  client,
  TelegramKeyHash,
  session,
  cachedDatabase
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log(event);
  });
  navigator.serviceWorker.register('/sw.js')
  .then((swReg) => {
    console.log('Service Worker registered');
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(1);
    }
  })
  .catch((error) => {
    console.error('Service Worker', error);
  });
} else {
  console.warn('Service Worker not supported');
}

if ('mozSetMessageHandler' in navigator) {
  navigator.mozSetMessageHandler('serviceworker-notification', (activityRequest) => {
    if (window.navigator.mozApps) {
      let request = window.navigator.mozApps.getSelf();
      request.onsuccess = () => {
        if (request.result) {
          request.result.launch();
        }
      };
    } else {
      window.open(document.location.origin, '_blank');
    }
  });
}
