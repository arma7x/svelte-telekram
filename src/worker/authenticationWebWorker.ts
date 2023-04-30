declare var navigator:any;
declare var telegram:any;
declare var idb:any;

import { parseUserAgent } from '../utils/misc';

const UA = parseUserAgent(navigator.userAgent);

let _importLoginToken;
let client;
let session;

/*
 * 0    connect
 * -100 disconnect
 * -1   common errors
 * 1    client.addEventHandler
 * N    success N, error -N and N must >= 2
 */

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
      session = new telegram.sessions.MemorySession();
      if (e.data.params && e.data.params.dcId && e.data.params.serverAddress && e.data.params.port) {
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
        try {
          self.postMessage({ type: 1, params: { state: evt.state, className: evt.className, data: evt.toJSON() }});
        } catch (err) {
          self.postMessage({ type: 1, params: { state: evt.state, className: evt.className }});
        }
      });
      client.connect()
      .then(() => {
        self.postMessage({ type: 0, params: {} });
      })
      .catch(err => {
        self.postMessage({ type: -1, params: err });
      });
      break;
    case 2:
      client.invoke(
        new telegram.Api.auth.SendCode({
          phoneNumber: e.data.params.phoneNumber,
          apiId: e.data.params.apiId,
          apiHash: e.data.params.apiHash,
          settings: new telegram.Api.CodeSettings(e.data.params.settings),
        })
      )
      .then((result) => {
        self.postMessage({ type: 2, params: result });
      })
      .catch((err) => {
        self.postMessage({ type: -2, params: err.errorMessage });
      });
      break;
    case 3:
      client.invoke(
        new telegram.Api.auth.SignIn({
          phoneNumber: e.data.params.phoneNumber,
          phoneCodeHash: e.data.params.phoneCodeHash,
          phoneCode: e.data.params.phoneCode,
        })
      )
      .then((result) => {
        const sess = {
          dcId: session.dcId,
          serverAddress: session.serverAddress,
          port: session.port,
          authKey: session.getAuthKey(session.dcId)
        }
        self.postMessage({ type: 3, params: { result: result.toJSON(), session: sess } });
      })
      .catch((err) => {
        self.postMessage({ type: -3, params: err.errorMessage });
      });
      break;
    case 4:
      client.signInWithPassword(
        {
          apiId: e.data.params.apiId,
          apiHash: e.data.params.apiHash,
        },
        {
          password: (hint) => {
            return Promise.resolve(e.data.params.password);
          },
          onError: (err) => {
            self.postMessage({ type: -4, params: err.errorMessage || err.toString() });
            return true;
          }
        }
      )
      .then((result) => {
        const sess = {
          dcId: session.dcId,
          serverAddress: session.serverAddress,
          port: session.port,
          authKey: session.getAuthKey(session.dcId)
        }
        self.postMessage({ type: 4, params: { result: result.toJSON(), session: sess } });
      })
      .catch((err) => {
        self.postMessage({ type: -4, params: err.errorMessage || err.toString() });
      });
      break;
    case 5:
      client.invoke(
        new telegram.Api.auth.ExportLoginToken({
          apiId: e.data.params.apiId,
          apiHash: e.data.params.apiHash,
          exceptIds: e.data.params.exceptIds,
        })
      )
      .then((result) => {
        self.postMessage({ type: 5, params: result });
      })
      .catch((err) => {
        self.postMessage({ type: -5, params: err.errorMessage });
      });
      break;
    case 6:
      client.invoke(
        new telegram.Api.auth.ExportLoginToken({
          apiId: e.data.params.apiId,
          apiHash: e.data.params.apiHash,
          exceptIds: e.data.params.exceptIds,
        })
      )
      .then((result) => {
        const sess = {
          dcId: session.dcId,
          serverAddress: session.serverAddress,
          port: session.port,
          authKey: session.getAuthKey(session.dcId)
        }
        _importLoginToken = result.token || null;
        self.postMessage({ type: 6, params: { result: result.toJSON(), session: sess } });
      })
      .catch((err) => {
        self.postMessage({ type: -6, params: err.errorMessage }); // TODO DEBUG
      });
      break;
    case 7:
      client.invoke(
        new telegram.Api.auth.ImportLoginToken({
          token: _importLoginToken,
        })
      )
      .then((result) => {
        _importLoginToken = null;
        const sess = {
          dcId: session.dcId,
          serverAddress: session.serverAddress,
          port: session.port,
          authKey: session.getAuthKey(session.dcId)
        }
        self.postMessage({ type: 7, params: { result: result.toJSON(), session: sess } });
      })
      .catch((err) => {
        self.postMessage({ type: -7, params: err.errorMessage });
      });
      break;
  }
}
