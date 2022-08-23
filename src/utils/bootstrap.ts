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
const cachedDatabase = idb.openDB('telekram', 4, {
  upgrade: (db, oldVersion, newVersion) => {
    const tables = ['profilePhotos', 'chatPreferences', 'mediaAttachments', 'offlineWebpages'];
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
