import MTProto from '@mtproto/core/envs/browser';
import { sleep } from '@mtproto/core/src/utils/common';
import bigInt from 'big-integer';

class MTProtoClient {

  private mtproto: typeof MTProto;

  constructor() {
    this.mtproto = new MTProto({
      test: true,
      api_id: '1403915',
      api_hash: '1291d66d65b509ed6d5fce437185a8cc',
    });
  }

  async call(method, params, options = {}) {
    try {
      const result = await this.mtproto.call(method, params, options);

      return result;
    } catch (error) {

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
  bigInt
}
