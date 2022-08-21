declare var telegram:any;
declare var idb:any;

import { parseUA } from './misc';
import TelegramKeyHash from '../telegram_key';

const UA = parseUA(navigator.userAgent);
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

// Duplicate same instance in authorizedWebWorker
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
