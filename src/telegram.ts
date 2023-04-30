declare var navigator:any;
declare var window:any;

import { get, writable } from 'svelte/store';
import EventEmitter from 'events';
import { UA, Api, client, session, cachedDatabase } from './utils/bootstrap';

export const shouldGetDialogs = writable(false);
export const connectionStatus = writable(false);
export const authorizationStatus = writable(false);
export const authorizedUser = writable([]);
export const dialogList = writable([]);
export const cachedThumbnails = writable({});
export const downloadedMediaEmitter = new EventEmitter();
export const dispatchMessageToClient = new EventEmitter();
export const dispatchMessageToWorker = new EventEmitter();

downloadedMediaEmitter.setMaxListeners(1000);
dispatchMessageToClient.setMaxListeners(1000);
dispatchMessageToWorker.setMaxListeners(1000);

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
    case "UpdateMessagePoll":
    case "Updates":
      getDialogs();
      if (['UpdateNewMessage', 'UpdateNewChannelMessage'].indexOf(evt.className) > -1) {
        client.invoke(new Api.messages.ReceivedMessages({ maxId: evt.message.id }));
      }
      break
    case "UpdatesTooLong":
      isUserAuthorized();
      break
    default:
      // console.log('client.addEventHandler:', evt);
  }
  if (evt.state) {
    if (evt.state === 1)
      connectionStatus.update(n => true);
    else if (evt.state === -1)
      connectionStatus.update(n => false);
  }
});

export function initilize() {
  let tm = setTimeout(() => {
    alert("Please re-launch the app");
    window.close();
  }, 60000);
  return client.connect()
  .then(() => {
    connectionStatus.update(n => true);
    isUserAuthorized();
  })
  .catch(err => {
    connectionStatus.update(n => false);
  })
  .finally(() => {
    clearTimeout(tm);
  });
}

initilize();

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
    authorizationStatus.update(n => authorized);
    if (authorized) {
      await fetchUser();
      getDialogs();
      if (window['authenticationWebWorker']) {
        window['authenticationWebWorker'].postMessage({ type: -100 })
        window['authenticationWebWorker'].terminate();
      }
      window['authorizedWebWorker'] = authorizedWebWorker();
      window['authorizedWebWorker'].onmessage = async (e) => {
        switch (e.data.type) {
          case -1:
            console.error(e.data.params);
            break;
          case 0:
            // console.log('Connected to authorizedWebWorker');
            break;
          case 1:
            // downloadedMediaEmitter.update(n => e.data);
            downloadedMediaEmitter.emit('message', e.data);
            break;
          case 2:
            const base64 = await bufferToBase64(e.data.result);
            (await cachedDatabase).put('profilePhotos', base64, e.data.hash.photoId);
            updateThumbCached(e.data.hash.photoId, base64);
            break;
        }
      }
      try {
        let pushSubscription = await (await cachedDatabase).get('appPreferences', 'pushSubscription');
        if (pushSubscription == null) {
          try {
            await unsubscribePush();
          } catch(err){}
          pushSubscription = await subscribePush();
          pushSubscription = pushSubscription.toJSON();
          delete pushSubscription['expirationTime'];
          const result = await registerDevice(client, pushSubscription);
          // console.log('registerDevice result:', result);
        } else {
          let updatedPushSubscription = await (await cachedDatabase).get('appPreferences', 'updatedPushSubscription');
          if (updatedPushSubscription != null) {
            let result = await unregisterDevice(client, pushSubscription);
            // console.log('unregisterDevice result:', result);
            result = await registerDevice(client, updatedPushSubscription);
            // console.log('registerDevice result:', result);
            (await cachedDatabase).delete('appPreferences', 'updatedPushSubscription');
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      await (await cachedDatabase).delete('appPreferences', 'pushSubscription');
      await (await cachedDatabase).delete('appPreferences', 'updatedPushSubscription');
      await client.disconnect();
      if (window['authorizedWebWorker']) {
        window['authorizedWebWorker'].postMessage({ type: -100 })
        window['authorizedWebWorker'].terminate();
      }
      window['authenticationWebWorker'] = authenticationWebWorker();
      window['authenticationWebWorker'].onmessage = (e) => {
        // console.log('authenticationWebWorker:', e.data.type, e.data.params.state, e.data.params.className, e.data.params.data);
        switch (e.data.type) {
          case -1:
          case 0:
          case 1:
          case 2:
          case -2:
          case 3:
          case -3:
          case 4:
          case -4:
          case 5:
          case -5:
          case 6:
          case -6:
          case 7:
          case -7:
            dispatchMessageToClient.emit('message', e.data);
            break;
        }
      }
      dispatchMessageToWorker.addListener('message', (data: any) => {
        window['authenticationWebWorker'].postMessage(data);
      });
    }
  } catch (err) {
    console.log(err);
  }
}

export async function getDialogs() {
  try {
    const _start = new Date().getTime();
    const user = await getAuthorizedUser();
    const chats = await client.getDialogs({
      offsetPeer: new Api.InputPeerSelf(),
      limit: 100,
      excludePinned: true,
      folderId: 0,
    });
    const httpTasks = [];
    const websocketTasks = [];
    const chatPreferencesTask = {};
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
    dialogList.update(n => chats);
    // console.log(`getDialogs: ${new Date().getTime() - _start}ms`);
    runTask(httpTasks, websocketTasks, chatPreferencesTask);
    return chats;
  } catch (err) {
    console.log(err);
  }
}

export function getDialogList() {
  return get(dialogList)
}

export function getCachedThumbnails() {
  return get(cachedThumbnails)
}

export function getAuthorizedUser() {
  return get(authorizedUser);
}

// [NON-BLOCKING]
export async function runTask(httpTasks, websocketTasks, chatPreferencesTask = {}) {
  // const lbl = `chatPreferencesTask ${Object.keys(chatPreferencesTask).length}`;
  // console.time(lbl);
  for (let chatId in chatPreferencesTask) {
    try {
      let pref = await (await cachedDatabase).get('chatPreferences', chatId);
      if (pref == null)
        pref = {};
      pref['muted'] = chatPreferencesTask[chatId]['muted'];
      if (pref['scrollAt'] == null) {
        pref['scrollAt'] = chatPreferencesTask[chatId]['scrollAt'];
      }
      await (await cachedDatabase).put('chatPreferences', pref, chatId);
    } catch (err) {
      console.log('chatPreferencesTask:', err);
    }
  }
  // console.timeEnd(lbl);

  // const lbl2 = `httpTasks ${httpTasks.length}`
  // console.time(lbl2);
  let skipHttpTasks = [];
  httpTasks.forEach(async (task, index) => {
    if (skipHttpTasks.indexOf(task.photoId.toString()) > -1) {
      return;
    }
    skipHttpTasks.push(task.photoId.toString());
    try {
      let cache = await (await cachedDatabase).get('profilePhotos', task.photoId);
      if (cache != null) {
        updateThumbCached(task.photoId, cache);
      } else {
        const html = new DOMParser().parseFromString(await (await fetch(task.url)).text(), 'text/html');
        const images = html.getElementsByClassName('tgme_page_photo_image');
        if (images.length === 0) {
          throw('No profile picture: tgme_page_photo_image');
        } else {
          const img = images[0] as HTMLImageElement;
          const blob = await (await fetch(img.src)).blob()
          const base64 = await blobToBase64(blob);
          await (await cachedDatabase).put('profilePhotos', base64, task.photoId);
          cache = base64;
          updateThumbCached(task.photoId, cache)
        }
      };
    } catch (err) {
      console.log('httpTasks:', err);
      if (window['authorizedWebWorker']) {
        window['authorizedWebWorker'].postMessage({
          type: 2,
          params: {
            photoId: task.photoId.toString(),
            chatId: task.chat.entity ? task.chat.entity.id.toString() : task.chat.id.toString(),
            origin: task.origin ? { chatId: task.origin.chat.id.toString(), messageId: task.origin.message.id } : null
          }
        });
      }
    }
  });
  // console.timeEnd(lbl2);

  // const lbl3 = `websocketTasks ${websocketTasks.length}`
  // console.time(lbl3);
  let skipWebsocketTasks = [];
  websocketTasks.forEach(async (task) => {
    if (skipWebsocketTasks.indexOf(task.photoId.toString()) > -1) {
      return;
    }
    skipWebsocketTasks.push(task.photoId.toString());
    try {
      let cache = await (await cachedDatabase).get('profilePhotos', task.photoId.toString());
      if (cache != null) {
        updateThumbCached(task.photoId, cache);
      } else {
        if (window['authorizedWebWorker']) {
          window['authorizedWebWorker'].postMessage({
            type: 2,
            params: {
              photoId: task.photoId.toString(),
              chatId: task.chat.entity ? task.chat.entity.id.toString() : task.chat.id.toString(),
              origin: task.origin ? { chatId: task.origin.chat.id.toString(), messageId: task.origin.message.id } : null
            }
          });
        }
      }
    } catch (err) {
      console.log('websocketTasks:', err);
    }
  });
  // console.timeEnd(lbl3);
}

export async function updateThumbCached(ref, base64) {
  const cached = await get(cachedThumbnails);
  cached[ref] = base64;
  cachedThumbnails.update(n => cached);
}

export function bufferToBase64(buffer) {
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

function authorizedWebWorker() {
  if (window['authorizedWebWorker'])
    window['authorizedWebWorker'].terminate();
  const worker = new Worker('/sw_authorized_web_worker.js');
  worker.postMessage({
    type: 0,
    params: {
      dcId: session.dcId,
      serverAddress: session.serverAddress,
      port: session.port,
      authKey: session.getAuthKey(session.dcId)
    }
  });
  return worker;
}

function authenticationWebWorker() {
  if (window['authenticationWebWorker'])
    window['authenticationWebWorker'].terminate();
  const worker = new Worker('/sw_authentication_web_worker.js');
  worker.postMessage({
    type: 0,
    params: {
      dcId: session.dcId,
      serverAddress: session.serverAddress,
      port: session.port,
      authKey: session.getAuthKey(session.dcId)
    }
  });
  return worker;
}

document.addEventListener("visibilitychange", () => {
  try {
    if (document.visibilityState === 'visible') {
      client.invoke(new Api.account.UpdateStatus({ offline: false }));
    } else {
      client.invoke(new Api.account.UpdateStatus({ offline: true }));
    }
  } catch (err) {}
});


export function subscribePush(): Promise<any> {
  return new Promise((resolve, reject) => {
    Notification.requestPermission()
    .then((result) => {
      if (result === 'granted')
        return navigator.serviceWorker.ready;
      return Promise.reject('Denied');
    })
    .then((reg) => {
      return reg.pushManager.subscribe({userVisibleOnly: true});
    })
    .then((subscription) => {
      if (subscription)
        resolve(subscription);
      else
        reject(subscription);
    })
    .catch((err) => {
      reject(err);
    });
  });
}

export function unsubscribePush(): Promise<any> {
  return new Promise((resolve, reject) => {
    getPushSubscription()
    .then((subscription) => {
      if (!subscription)
        reject('Please subscribe');
      else
        return subscription.unsubscribe();
    })
    .then((result) => {
      resolve(result)
    })
    .catch((err) => {
      reject(err);
    });
  });
}

export function getPushSubscription(): Promise<any> {
  return new Promise((resolve, reject) => {
    navigator.serviceWorker.ready
    .then((reg) => {
      return reg.pushManager.getSubscription()
    })
    .then((subscription) => {
      if (!subscription)
        reject('Please subscribe');
      else
        resolve(subscription);
    })
    .catch((err) => {
      reject(err);
    });
  });
}

export async function registerDevice(client, subscription) {
  const result = await client.invoke(new Api.account.RegisterDevice({
    tokenType: 10,
    token: JSON.stringify(subscription),
    otherUids: [],
    appSandbox: false,
    secret: client.session.getAuthKey().getKey(),
  }));
  (await cachedDatabase).put('appPreferences', subscription, 'pushSubscription');
  return result;
}

export async function unregisterDevice(client, subscription) {
  const result = await client.invoke(new Api.account.UnregisterDevice({
    tokenType: 10,
    token: JSON.stringify(subscription),
    otherUids: [],
  }));
  (await cachedDatabase).delete('appPreferences', 'pushSubscription');
  return result;
}

export async function manuallySubscribePushNotification(client) {
  try {
    (await cachedDatabase).delete('appPreferences', 'updatedPushSubscription');
    let pushSubscription = await (await cachedDatabase).get('appPreferences', 'pushSubscription');
    if (pushSubscription == null) {
      await unregisterDevice(client, pushSubscription);
    }
    try {
      await unsubscribePush();
    } catch(err){}
    pushSubscription = await subscribePush();
    pushSubscription = pushSubscription.toJSON();
    delete pushSubscription['expirationTime'];
    await registerDevice(client, pushSubscription);
    return Promise.resolve(true);
  } catch (err) {
    return Promise.reject(err);
  }
}
