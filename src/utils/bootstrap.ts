declare var telegram:any;
declare var idb:any;

import TelegramKeyHash from '../telegram_key';

const { Api, TelegramClient } = telegram;
const { StoreSession } = telegram.sessions;
const session = new StoreSession("gramjs");
const client: typeof TelegramClient = new TelegramClient(session, TelegramKeyHash.api_id, TelegramKeyHash.api_hash, {
  maxConcurrentDownloads: 1,
});
client.setLogLevel('none');

const cachedDatabase = idb.openDB('telekram', 2, {
  upgrade: (db) => {
    // db.createObjectStore('profilePhotos');
    db.createObjectStore('chatPreferences');
  },
});

export {
  Api,
  client,
  TelegramKeyHash,
  session,
  cachedDatabase
}
