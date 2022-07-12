import { get, writable } from 'svelte/store';
import { TelegramKeyHash, Api, client } from '../utils/mtproto_client';

export const connectionStatus = writable(false);
export const authorizedStatus = writable(false);
export const chatCollections = writable([]);

client.addEventHandler((evt) => {
  console.log(evt);
});

client.connect()
.then(() => {
  connectionStatus.update(n => true);
  isUserAuthorized();
})
.catch(err => {
  connectionStatus.update(n => false);
});

export async function isUserAuthorized() {
  try {
    const authorized = await client.isUserAuthorized();
    authorizedStatus.update(n => authorized);
    if (authorized)
      retrieveChats();
  } catch (err) {
    console.log(err);
  }
}

export async function retrieveChats() {
  try {
    const result = await client.getDialogs({
      offsetPeer: new Api.InputPeerSelf(),
      limit: 100,
      excludePinned: true,
      folderId: 0,
    });
    chatCollections.update(n => result);
  } catch (err) {
    console.log(err);
  }
}

export async function getChatCollection() {
  return get(chatCollections)
}
