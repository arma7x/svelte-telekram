declare var telegram:any;
declare var idb:any;
declare var window:any;

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

let LAST_ONLINE_TIMER;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js?v=1')
  .then((swReg) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 1, time: new Date().getTime() });
      LAST_ONLINE_TIMER = setInterval(() => {
        navigator.serviceWorker.controller.postMessage({ type: 1, time: new Date().getTime() });
      }, 5000);
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log("[SW]addEventListener:", event.data);
      });
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

document.addEventListener("visibilitychange", () => {
  console.log('visibilitychange', 'LAST_ONLINE_TIMER', document.visibilityState);
  if (document.visibilityState === 'visible') {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 1, time: new Date().getTime() });
      LAST_ONLINE_TIMER = setInterval(() => {
        navigator.serviceWorker.controller.postMessage({ type: 1, time: new Date().getTime() });
      }, 5000);
    }
  } else {
    if (LAST_ONLINE_TIMER) {
      clearInterval(LAST_ONLINE_TIMER);
      LAST_ONLINE_TIMER = null;
    }
  }
});
