import { get, writable } from 'svelte/store';
import { TelegramKeyHash, Api, client, profilePhotoDb, cachedDatabase } from '../utils/bootstrap';

export const connectionStatus = writable(false);
export const authorizedStatus = writable(false);
export const chatCollections = writable([]);
export const cachedThumbnails = writable({});

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
    const httpTasks = [];
    const websocketTasks = [];
    chats.forEach((chat, index) => {
      chat.iconRef = chat.id.toString();
      if (!(chat.entity.username == null && chat.entity.phone == null) && chat.entity.photo != null) {
        chat.iconRef = chat.entity.photo.photoId.toString();
        httpTasks.push({
          chatId: chat.id.toString(),
          url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${chat.entity.phone === "42777" ? 'telegram' : chat.entity.username}`,
          photoId: chat.entity.photo.photoId.toString(),
          chat: chat
        });
      } else if (chat.entity.photo != null) {
        chat.iconRef = chat.entity.photo.photoId.toString();
        websocketTasks.push(chat);
      }
      const letters = chat.name.split(' ').map(text => {
        return text[0];
      });
      chat.icon = `<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;font-weight:bold;color:#fff;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;">${letters.splice(0, 2).join('')}</div>`;
    });
    chatCollections.update(n => chats);
    runTask(chats, httpTasks, websocketTasks);
  } catch (err) {
    console.log(err);
  }
}

export async function getChatCollection() {
  return get(chatCollections)
}

export async function getCachedThumbnails() {
  return get(cachedThumbnails)
}

function runTask(chats, httpTasks, websocketTasks) {
  let tempRef = {};
  httpTasks.forEach(async (task, index) => {
    try {
      let cache = await profilePhotoDb.getItem(task.photoId);
      if (cache == null) {
        const html = new DOMParser().parseFromString(await (await fetch(task.url)).text(), 'text/html');
        const images = html.getElementsByClassName('tgme_page_photo_image');
        if (images.length === 0) {
          const base64 = await bufferToBase64(await client.downloadProfilePhoto(task.chat));
          cache = await profilePhotoDb.setItem(task.photoId, base64);
        } else {
          const img = images[0] as HTMLImageElement;
          const blob = await (await fetch(img.src)).blob()
          const base64 = await blobToBase64(blob);
          cache = await profilePhotoDb.setItem(task.photoId, base64);
        }
      }
      updateThumbCached(task.chat.iconRef, cache);
    } catch (err) {
      console.log('Err:', err);
    }
  });
  chatCollections.update(n => chats);
  let elapsed = 0;
  websocketTasks.forEach(async (task) => {
    try {
      let cache = await profilePhotoDb.getItem(task.entity.photo.photoId.toString());
      if (cache == null) {
        const base64 = await bufferToBase64(await client.downloadProfilePhoto(task));
        cache = await profilePhotoDb.setItem(task.entity.photo.photoId.toString(), base64);
      }
      updateThumbCached(task.iconRef, cache);
    } catch (err) {
      console.log('Err:', err);
    } finally {
      elapsed++;
      if (elapsed === websocketTasks.length) {
        chatCollections.update(n => chats);
      }
    }

  });
}

async function updateThumbCached(ref, base64) {
  const cached = await get(cachedThumbnails);
  cached[ref] = base64;
  cachedThumbnails.update(n => cached);
}

function bufferToBase64(buffer) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(new Blob([new Uint8Array(buffer, 0, buffer.length)], {type : 'image/jpeg'}));
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(blob);
  });
}
