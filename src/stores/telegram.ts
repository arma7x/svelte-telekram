import { get, writable } from 'svelte/store';
import { TelegramKeyHash, Api, client, cachedDatabase } from '../utils/bootstrap';

export const connectionStatus = writable(false);
export const authorizedStatus = writable(false);
export const authorizedUser = writable([]);
export const chatCollections = writable([]);
export const cachedThumbnails = writable({});

client.addEventHandler((evt) => {
  switch (evt.className) {
    case "UpdateNotifySettings":
    case "UpdateFolderPeers":
    case "UpdateNewMessage":
    case "UpdateEditMessage":
    case "UpdateDeleteMessages":
    case "UpdateNewChannelMessage":
    case "UpdateEditChannelMessage":
    case "UpdateDeleteChannelMessages":
    case "UpdateShortMessage":
    case "UpdateReadHistoryInbox":
    case "UpdateReadHistoryOutbox":
    case "UpdateReadMessagesContents":
    case "UpdateReadChannelInbox":
    case "UpdateReadChannelOutbox":
    case "UpdateReadFeaturedStickers":
    case "UpdateReadChannelDiscussionInbox":
    case "UpdateReadChannelDiscussionOutbox":
    case "Updates":
      retrieveChats();
      break
    case "UpdatesTooLong":
      isUserAuthorized();
      break
    default:
      console.log('client.addEventHandler:', evt);
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

export async function fetchUser() {
  const result = await client.invoke(
    new Api.users.GetUsers({
      id: [new Api.InputPeerSelf()],
    })
  );
  authorizedUser.update(n => result);
}

export async function isUserAuthorized() {
  try {
    const authorized = await client.isUserAuthorized();
    authorizedStatus.update(n => authorized);
    if (authorized) {
      await fetchUser();
      retrieveChats();
    }
  } catch (err) {
    console.log(err);
  }
}

export async function retrieveChats() {
  // const timer = new Date().getTime().toString();
  // console.time('retrieveChats_' + timer);
  try {
    const chatPreferencesTask = {};
    const user = await getAuthorizedUser();
    const chats = await client.getDialogs({
      offsetPeer: new Api.InputPeerSelf(),
      limit: 100,
      excludePinned: true,
      folderId: 0,
    });
    const httpTasks = [];
    const websocketTasks = [];
    chats.forEach((chat, index) => {
      chat.__isSavedMessages = false;
      if (chat.id.value === user[0].id.value) {
        chat.name = 'Saved Messages';
        chat.entity.__isSavedMessages = true;
      }
      chat.entity.__muted = false;
      if (chat.dialog.notifySettings.muteUntil != null) {
        chat.entity.__muted = chat.dialog.notifySettings.muteUntil;
      }
      if (chatPreferencesTask[chat.entity.id.value.toString()] == null) {
        chatPreferencesTask[chat.entity.id.value.toString()] = {};
      }
      chatPreferencesTask[chat.entity.id.value.toString()]['muted'] = chat.dialog.notifySettings.muteUntil || false;
      chatPreferencesTask[chat.entity.id.value.toString()]['scrollAt'] = chat.message.id;
      chat.iconRef = chat.id.toString();
      if (!(chat.entity.username == null && chat.entity.phone == null) && chat.entity.photo != null && chat.entity.photo.className !== 'ChatPhotoEmpty') {
        chat.iconRef = chat.entity.photo.photoId.toString();
        httpTasks.push({
          url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${chat.entity.phone === "42777" ? 'telegram' : chat.entity.username}`,
          photoId: chat.entity.photo.photoId.toString(),
          chat: chat
        });
      } else if (chat.entity.photo != null && chat.entity.photo.className !== 'ChatPhotoEmpty') {
        chat.iconRef = chat.entity.photo.photoId.toString();
        websocketTasks.push({
          photoId: chat.entity.photo.photoId.toString(),
          chat: chat
        });
      }
      const letters = chat.name.split(' ').map(text => {
        return text[0];
      });
    });
    chatCollections.update(n => chats);
    runTask(httpTasks, websocketTasks, chatPreferencesTask);
    return chats;
  } catch (err) {
    console.log(err);
  }
  // console.timeEnd('retrieveChats_' + timer);
}

export function getChatCollection() {
  return get(chatCollections)
}

export function getCachedThumbnails() {
  return get(cachedThumbnails)
}

export function getAuthorizedUser() {
  return get(authorizedUser);
}

export async function runTask(httpTasks, websocketTasks, chatPreferencesTask = {}) {
  // console.time('chatPreferencesTask');
  console.log('chatPreferencesTask:', Object.keys(chatPreferencesTask).length);
  for (let chatId in chatPreferencesTask) {
    let pref = await (await cachedDatabase).get('chatPreferences', chatId);
    if (pref == null)
      pref = {};
    pref['muted'] = chatPreferencesTask[chatId]['muted'];
    if (pref['scrollAt'] == null) {
      pref['scrollAt'] = chatPreferencesTask[chatId]['scrollAt'];
    }
    await (await cachedDatabase).put('chatPreferences', pref, chatId);
  }
  // console.timeEnd('chatPreferencesTaskTask');

  console.log('httpTasks:', httpTasks.length);
  // console.time('httpTasks');
  httpTasks.forEach(async (task, index) => {
    try {
      let cache = await (await cachedDatabase).get('profilePhotos', task.photoId);
      if (cache == null) {
        const html = new DOMParser().parseFromString(await (await fetch(task.url)).text(), 'text/html');
        const images = html.getElementsByClassName('tgme_page_photo_image');
        if (images.length === 0) {
          const base64 = await bufferToBase64(await client.downloadProfilePhoto(task.chat));
          await (await cachedDatabase).put('profilePhotos', base64, task.photoId);
          cache = base64;
        } else {
          const img = images[0] as HTMLImageElement;
          const blob = await (await fetch(img.src)).blob()
          const base64 = await blobToBase64(blob);
          await (await cachedDatabase).put('profilePhotos', base64, task.photoId);
          cache = base64;
        }
      }
      updateThumbCached(task.photoId, cache);
    } catch (err) {
      console.log('Err:', err);
    }
  });
  // console.timeEnd('httpTasks');

  let elapsed = 0;
  console.log('websocketTasks:', websocketTasks.length);
  // console.time('websocketTasks');
  websocketTasks.forEach(async (task) => {
    try {
      let cache = await (await cachedDatabase).get('profilePhotos', task.photoId);
      if (cache == null) {
        const base64 = await bufferToBase64(await client.downloadProfilePhoto(task.chat));
        await (await cachedDatabase).put('profilePhotos', base64, task.photoId);
        cache = base64;
      }
      updateThumbCached(task.photoId, cache);
    } catch (err) {
      console.log('Err:', err);
    } finally {
      elapsed++;
    }
    // sleep 3sec
    await new Promise(resolve => setTimeout(() => {}, 3000));
  });
  // console.timeEnd('websocketTasks');
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
