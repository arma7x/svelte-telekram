declare var telegram:any;
declare var idb:any;

function parseUA(a) {
  let model = 'KaiOS';
  try {
    let idx = a.indexOf('Mobile;')
    if (idx != -1) {
      let m = a.substring(idx + 8)
      let idx2 = m.indexOf(')')
      m = m.substring(0, idx2)
      if (m != '')
        model = m
    }
  }
  catch (err) {}

  let version = "1.0"
  try {
    if (a.indexOf('KAIOS/') > -1) {
      version = a.substring(a.indexOf('KAIOS/'))
    } else if (a.indexOf('Firefox/') > -1) {
      version = a.substring(a.indexOf('Firefox/'))
    } else if (a.indexOf('Gecko/') > -1) {
      version = a.substring(a.indexOf('Gecko/'))
    } else if (a.indexOf('rv:') > -1) {
      let idx = a.indexOf('rv:')
      if (idx != -1) {
        let v = a.substring(idx);
        let idx2 = v.indexOf(')')
        v = v.substring(0, idx2)
        if (v != '')
          version = v
      }
    }
  } catch (err) {}
  return { deviceModel: model, systemVersion: version, appVersion: "1.0.0" }
}

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

const cachedDatabase = idb.openDB('telekram', 3, {
  upgrade: (db, oldVersion, newVersion) => {
    const tables = ['profilePhotos', 'chatPreferences', 'mediaAttachments'];
    tables.forEach(n => {
      if (!db.objectStoreNames.contains(n))
        db.createObjectStore(n);
    });
  },
});

export {
  UA
  Api,
  AuthKey,
  TelegramClient,
  client,
  TelegramKeyHash,
  session,
  cachedDatabase
}
