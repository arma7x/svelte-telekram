import { get, writable } from 'svelte/store';
import { TelegramKeyHash, Api, client, profilePhotoDb } from '../utils/bootstrap';

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
    const tasks = [];
    chats.forEach((chat, index) => {
      if (!(chat.entity.username == null && chat.entity.phone == null) && chat.entity.photo != null) {
        tasks.push({
          chatId: chat.id.toString(),
          url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${chat.entity.phone === "42777" ? 'telegram' : chat.entity.username}`,
          photoId: chat.entity.photo.photoId.toString()
        });
      }
      const letters = chat.name.split(' ').map(text => {
        return text[0];
      });
      chat.icon = `<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;font-weight:bold;color:#fff;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;">${letters.splice(0, 2).join('')}</div>`;
    });
    chatCollections.update(n => chats);
    runTask(chats, tasks);
  } catch (err) {
    console.log(err);
  }
}

export async function getChatCollection() {
  return get(chatCollections)
}

async function runTask(chats, tasks) {
  tasks.forEach(async (task) => {
    try {
      let cache = await profilePhotoDb.getItem(task.photoId);
      if (cache == null) {
        const response = await fetch(task.url);
        const html = new DOMParser().parseFromString(await response.text(), 'text/html');
        const images = html.getElementsByClassName('tgme_page_photo_image');
        cache = await profilePhotoDb.setItem(task.photoId, images[0].src);
      }
      for (let x in chats) {
        const chat = chats[x];
        if (chat.id.toString() === task.chatId) {
          chat.icon = `<img alt="icon" style="background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;"" src="${cache}"/>`;
          break;
        }
      }
      chatCollections.update(n => chats);
    } catch (err) {
      console.log('Err:', task.url);
    }
  });
}
