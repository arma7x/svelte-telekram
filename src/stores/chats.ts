import { writable } from 'svelte/store';
import { TelegramKeyHash, Api, client } from '../utils/mtproto_client';

let _chatCollections = [];

export const chatCollections = writable([]);

export async function getChats() {
  const result = await client.getDialogs({
    offsetPeer: new Api.InputPeerSelf(),
    limit: 100,
    excludePinned: true,
    folderId: 0,
  });
  chatCollections.update(n => result);
}

export function findChat(id) {
	return _chatCollections[id];
}
