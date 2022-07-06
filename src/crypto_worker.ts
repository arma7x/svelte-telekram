import Crypto from '@mtproto/core/src/crypto';
import SHA1 from '@mtproto/core/envs/browser/./sha1';
import SHA256 from '@mtproto/core/envs/browser/./sha256';
import PBKDF2 from '@mtproto/core/envs/browser/./pbkdf2';
import getRandomBytes from '@mtproto/core/envs/browser/./get-random-bytes';

async function getSRPParams(x=1, y=1) {
  const _crypto = new Crypto({ SHA1, SHA256, PBKDF2, getRandomBytes });
  return await Promise.resolve(x + y);
}

export default getSRPParams
