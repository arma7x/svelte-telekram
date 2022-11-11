declare var telegram:any;
declare var idb:any;
declare var window:any;
declare var navigator:any;

import { parseUserAgent } from './misc';
import TelegramKeyHash from '../telegram_key';

const APP_VERSION = "1.1.0";
const UA = parseUserAgent(navigator.userAgent);
UA['appVersion'] = APP_VERSION;

const current = window.localStorage.getItem('APP_VERSION');
if (current == null || current !== APP_VERSION) {
  window.localStorage.setItem('APP_VERSION', APP_VERSION);
  window.localStorage.removeItem('GramJs:apiCache');
}

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

// Ask for camera permission for qr-code reader
if ('mediaDevices' in navigator) {
  navigator.mediaDevices.getUserMedia({ audio: false, video: true })
  .then((stream) => {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js?v=1')
  .then((swReg) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 1, visibilityState: document.visibilityState });
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
  navigator.serviceWorker.controller.postMessage({ type: 1, visibilityState: document.visibilityState });
});
