import TelegramKeyHash from '../telegram_key';

const { Api, TelegramClient } = telegram;
const { StoreSession } = telegram.sessions;
const session = new StoreSession("gramjs");
let client: typeof TelegramClient = new TelegramClient(session, parseInt(TelegramKeyHash.api_id), TelegramKeyHash.api_hash);

export {
  Api,
  client,
  TelegramKeyHash
}
