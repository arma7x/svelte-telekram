import * as _MTProto from '@mtproto/core/envs/browser';
import * as _utils from '@mtproto/core/src/utils/common';

const MTProto   = _MTProto.default;
const { sleep } = _utils.default;

class MTProtoClient {

  private mtproto: typeof MTProto;

  constructor() {
    this.mtproto = new MTProto({
      api_id: '1403915',
      api_hash: '1291d66d65b509ed6d5fce437185a8cc',
    });
  }

  async call(method, params, options = {}) {
    try {
      const result = await this.mtproto.call(method, params, options);

      return result;
    } catch (error) {
      console.log(`${method} error:`, error);

      const { error_code, error_message } = error;

      if (error_code === 420) {
        const seconds = Number(error_message.split('FLOOD_WAIT_')[1]);
        const ms = seconds * 1000;

        await sleep(ms);

        return this.call(method, params, options);
      }

      if (error_code === 303) {
        const [type, dcIdAsString] = error_message.split('_MIGRATE_');

        const dcId = Number(dcIdAsString);

        // If auth.sendCode call on incorrect DC need change default DC, because
        // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
        if (type === 'PHONE') {
          await this.mtproto.setDefaultDc(dcId);
        } else {
          Object.assign(options, { dcId });
        }

        return this.call(method, params, options);
      }

      return Promise.reject(error);
    }
  }
}

const api = new MTProtoClient();

export {
  api,
}
