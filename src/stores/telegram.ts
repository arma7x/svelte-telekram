import { get, writable } from 'svelte/store';
import { TelegramKeyHash, Api, client } from '../utils/mtproto_client';

export const connectionStatus = writable(false);
export const authorizedStatus = writable(false);
export const chatCollections = writable([]);

client.addEventHandler((evt) => {
  console.log(evt);
  switch (evt.className) {
    case "UpdateFolderPeers":
    case "UpdateNewChannelMessage":
    case "UpdateReadChannelInbox":
    case "UpdateEditChannelMessage":
    case "UpdateShortMessage":
    case "UpdateReadHistoryInbox":
      retrieveChats();
      break
  }
  if (evt.state) {
    if (evt.state === 1)
      connectionStatus.update(n => true);
    else if (evt.state === -1)
      connectionStatus.update(n => false);
  }
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
    const chats = await client.getDialogs({
      offsetPeer: new Api.InputPeerSelf(),
      limit: 100,
      excludePinned: true,
      folderId: 0,
    });
    chats.forEach((chat, index) => {
      chat.icon = `<img alt="icon" style="width:40px;height:40px;border-radius:50%;" src="/icons/icon112x112.png"/>`;
    });
    chatCollections.update(n => chats);
  } catch (err) {
    console.log(err);
  }
}

export async function getChatCollection() {
  return get(chatCollections)
}
