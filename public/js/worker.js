importScripts('/js/telegram.js');
importScripts('/js/polyfill.min.js');

self.onmessage = function(e) {
  const session = new telegram.sessions.MemorySession();
  session.setDC(e.data.dcId, e.data.serverAddress, e.data.port);
  session.setAuthKey(new telegram.AuthKey(e.data.authKey._key, e.data.authKey._hash), e.data.dcId);
  let client = new telegram.TelegramClient(session, 1234, '1234', {
    maxConcurrentDownloads: 1,
  });
  client.connect()
  .then(() => {
    console.log('Connected in worker');
    client.disconnect()
  })
  .catch(err => {
    console.log(err);
  });
}
