declare var navigator:any;
declare var telegram:any;
declare var idb:any;

import { parseUserAgent } from '../utils/misc';

const UA = parseUserAgent(navigator.userAgent);

const cachedDatabase = idb.openDB('telekram', 5, {
  upgrade: (db, oldVersion, newVersion) => {
    const tables = ['profilePhotos', 'chatPreferences', 'mediaAttachments', 'offlineWebpages', 'appPreferences'];
    tables.forEach(n => {
      if (!db.objectStoreNames.contains(n))
        db.createObjectStore(n);
    });
  },
});

let client;
let chats = {};
let queuedTask = [];
let downloadMediaTask = [];
let downloadProfilePhotoTask = [];
let ready = false;

function getDialogs() {
  client.getDialogs({
    offsetPeer: new telegram.Api.InputPeerSelf(),
    limit: 100,
    excludePinned: true,
    folderId: 0,
  })
  .then((result) => {
    for (var x in result) {
      if (result[x].id && result[x].id.value) {
        const id = result[x].id.value.toString();
        chats[id] = result[x];
      }
    }
  })
  .catch(err => {
    self.postMessage({ type: -1, params: err });
  })
  .finally(() => {
    ready = true;
  });
}

function executeDownloadMediaTask() {
  if (downloadMediaTask.length <= 0)
    return;
  const task = downloadMediaTask[0];
  queuedTask.push(task.fileId);
  // console.log(chats[task.chatId], task.chatId, task.messageId);
  const hash = task.fileId;
  let bytes;
  client.getMessages(chats[task.chatId].entity, { limit: 1, ids: task.messageId })
  .then((msg) => {
    return client.downloadMedia(msg[0].media, {
      progressCallback: (received, total) => {
        self.postMessage({ type: 1, hash: hash, progress: { received: received.toJSNumber(), total: total.toJSNumber() } });
      }
    });
  })
  .then((_bytes) => {
    bytes = _bytes;
    return cachedDatabase;
  })
  .then(db => {
    return db.put('mediaAttachments', bytes, task.fileId);
  })
  .then(fileId => {
    self.postMessage({ type: 1, hash: hash, done: fileId });
  })
  .catch(err => {
    self.postMessage({ type: 1, hash: hash, error: err });
  })
  .finally(() => {
    queuedTask.splice(queuedTask.indexOf(task.fileId), 1);
    setTimeout(() => {
      downloadMediaTask.splice(0, 1);
      executeDownloadMediaTask();
    }, 1500);
  });
}

function executeDownloadProfilePhotoTask() {
  if (ready === false || (client.connected === false && downloadProfilePhotoTask.length > 0)) {
    setTimeout(() => {
      executeDownloadProfilePhotoTask();
    }, 3000)
    return;
  }
  if (downloadProfilePhotoTask.length <= 0)
    return;
  const task = downloadProfilePhotoTask[0];
  // console.log(task.chatId, task.photoId, task.origin, chats[task.origin.chatId]);
  client.downloadProfilePhoto(telegram.helpers.returnBigInt(task.chatId), { isBig: true })
  .then((buffer) => {
    self.postMessage({ type: 2, hash: task, result: buffer });
  })
  .catch(err => {
    // console.log(task.chatId, chats[task.chatId], Object.keys(chats).length) // TODO, check private channel
    if (task.origin && chats[task.origin.chatId]) {
      client.getMessages(chats[task.origin.chatId], {ids:[task.origin.messageId]})
      .then((messages) => {
        // console.log(messages[0].sender);
        return client.downloadProfilePhoto(messages[0].sender);
      })
      .then((_buffer) => {
        // console.log('Success:', task.origin.chatId, task.origin.messageId);
        self.postMessage({ type: 2, hash: task, result: _buffer });
      })
      .catch((_err) => {
        // console.log('Fail:', task.origin.chatId, task.origin.messageId);
        self.postMessage({ type: -1, params: _err });
      })
      .finally(() => {
        setTimeout(() => {
          downloadProfilePhotoTask.splice(0, 1);
          executeDownloadProfilePhotoTask();
        }, 1500);
      });
    } else {
      self.postMessage({ type: -1, params: err });
      setTimeout(() => {
        downloadProfilePhotoTask.splice(0, 1);
        executeDownloadProfilePhotoTask();
      }, 1500);
    }
  });

}

self.onmessage = (e) => {
  switch (e.data.type) {
    case -100:
      client.disconnect()
      .then(() => {
        self.postMessage({ type: -100, params: {} });
      }).catch((err) => {
        self.postMessage({ type: -1, params: err });
      });
      break;
    case 0:
      const session = new telegram.sessions.MemorySession();
      if (e.data.params) {
        session.setDC(e.data.params.dcId, e.data.params.serverAddress, e.data.params.port);
        if (e.data.params.authKey)
          session.setAuthKey(new telegram.AuthKey(e.data.params.authKey._key, e.data.params.authKey._hash), e.data.params.dcId);
      }
      client = new telegram.TelegramClient(session, parseInt(process.env.APP_ID), process.env.APP_HASH, {
        maxConcurrentDownloads: 1,
        deviceModel: UA.deviceModel,
        systemVersion: UA.systemVersion,
        appVersion: UA.appVersion,
      });
      client.addEventHandler((evt) => {
        // console.log('authorizedWebWorker.client.addEventHandler:', evt.className);
      });
      client.connect()
      .then(() => {
        getDialogs();
        self.postMessage({ type: 0, params: {} });
      })
      .catch(err => {
        self.postMessage({ type: -1, params: err });
      });
      break;
    case 1:
      // const chatId = telegram.helpers.returnBigInt(e.data.params.chatId);
      if (chats[e.data.params.chatId] && queuedTask.indexOf(e.data.params.fileId) === -1) {
        self.postMessage({ type: 1, hash: e.data.params.fileId, init: 1 });
        downloadMediaTask.push(e.data.params);
        if (downloadMediaTask.length === 1)
          executeDownloadMediaTask();
      } else if (queuedTask.indexOf(e.data.params.fileId) > -1) {
        self.postMessage({ type: 1, hash: e.data.params.fileId, init: 1 });
      } else {
        self.postMessage({ type: 1, hash: e.data.params.fileId, init: -1 });
      }
      break;
    case 2:
      // const chatId = telegram.helpers.returnBigInt(e.data.params.chatId);
      downloadProfilePhotoTask.push(e.data.params);
      if (downloadProfilePhotoTask.length === 1)
        executeDownloadProfilePhotoTask();
      break;
  }
}
