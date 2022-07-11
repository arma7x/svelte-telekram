import localForage from "localforage";
import TelegramKeyHash from '../telegram_key';

const { Api, TelegramClient } = telegram;
const { StoreSession } = telegram.sessions;
const session = new StoreSession("gramjs");
let client: typeof TelegramClient = new TelegramClient(session, TelegramKeyHash.api_id, TelegramKeyHash.api_hash, {
  maxConcurrentDownloads: 1,
});

localForage.setDriver(localForage.INDEXEDDB);

const dbName = 'gramjs';

const profilePhotoDb = localForage.createInstance({
    name        : dbName,
    storeName   : 'profilePhotoDb',
    description : 'cached profilePhoto'
});

export {
  Api,
  client,
  TelegramKeyHash,
  profilePhotoDb
}
