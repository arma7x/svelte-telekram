<script lang="ts">
  import { onMount, onDestroy, beforeUpdate } from 'svelte';
  import { Buffer } from 'buffer';
  import { saveAs } from 'file-saver';
  import * as Mime from 'mime-types';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';
  import { openFile, strippedPhotoToJpg, humanFileSize, isMediaCached, getCachedMedia, removeCachedMedia } from './common';
  import { downloadedMediaEmitter } from '../../../telegram';
  import { OptionMenu } from '../../../components';

  export let chat: any = {};
  export let message: any = {}; //.media.photo or .media.document
  export let parentNavInstance: typeof KaiNavigator;
  export let callButtonCallback: Function = (id, callback) => {}
  export let fetchMessageCallback: Function = (id: number) => {}

  let action: OptionMenu;

  let thumb: string = '/icons/document.svg';
  let size: string;
  let downloaded: bool = false;
  let fileId: string;
  let downloading: number = -1;

  function actionMenu() {
    let menu = [];
    if (downloaded) {
      menu = [{ title: 'Open' }, { title: 'Save to Storage' }, { title: 'Remove from cache' }];
    } else {
      menu = [{ title: 'Download' }];
    }
    action = new OptionMenu({
      target: document.body,
      props: {
        title: 'Media Menu',
        focusIndex: 0,
        options: menu,
        softKeyCenterText: 'select',
        onSoftkeyRight: (evt, scope) => {},
        onSoftkeyLeft: (evt, scope) => {},
        onEnter: async (evt, scope) => {
          action.$destroy();
          if (scope.selected.title === 'Open') {
            try {
              await openFile(fileId, message);
            } catch (err) {
              console.log(err);
            }
          } else if (scope.selected.title === 'Download' && downloading === -1) {
            if (window['authorizedWebWorker']) {
              window['authorizedWebWorker'].postMessage({
                type: 1,
                params: {
                  chatId: chat.id.value.toString(),
                  messageId: message.id,
                  fileId: fileId
                }
              });
            }
          } else if (scope.selected.title ===  'Remove from cache') {
            try {
              await removeCachedMedia(fileId);
              downloaded = false;
              downloading = -1;
              downloadedMediaEmitter.addListener('message', handleDownloadedMedia);
            } catch(err) {
              console.log(err);
            }
          } else if (scope.selected.title ===  'Save to Storage') {
            try {
              const blob = await getCachedMedia(fileId, message);
              let mime = message.media.photo ? 'image/jpeg' : message.media.document.mimeType;
              let fn = null;
              if (message.media.document) {
                for (let j in message.media.document.attributes) {
                  const a = message.media.document.attributes[j];
                  if (a.className && a.className === "DocumentAttributeFilename") {
                    fn = a.fileName;
                    break;
                  }
                }
              }
              if (fn == null) {
                fn = new Date().getTime().toString() + '.' + Mime.extension(mime);
              }
              const file = new File([blob], fn, { type: mime });
              saveAs(file);
            } catch(err) {
              console.log(err);
            }
          }
        },
        onBackspace: (evt, scope) => {
          evt.preventDefault();
          evt.stopPropagation();
          action.$destroy();
        },
        onOpened: () => {
          parentNavInstance.detachListener();
        },
        onClosed: (scope) => {
          parentNavInstance.attachListener();
          action = null;
        }
      }
    });
  }

  async function handleDownloadedMedia(evt) {
    if (evt.hash && evt.hash === fileId) {
      if (evt.done != null) {
        downloaded = await isMediaCached(fileId);
        downloading = -1;
      } else if (evt.progress) {
        downloading = Math.round((evt.progress.received / evt.progress.total) * 100);
      } else if (evt.error) {
        console.log(evt.error);
        downloading = -1;
      } else if (evt.init) {
        if (evt.init === 1) {
          downloading = 0;
        } else {
          downloading = -1;
        }
      }
    }
  }

  beforeUpdate(async () => {
    if (message.media.photo) {
      fileId = message.media.photo.id.toString();
    } else if (message.media.document) {
      fileId = message.media.document.id.toString();
    }
    downloaded = await isMediaCached(fileId);
    callButtonCallback(message.id.toString(), actionMenu);
    if (!downloaded) {
      downloadedMediaEmitter.addListener('message', handleDownloadedMedia);
    } else {
      downloadedMediaEmitter.removeListener('message', handleDownloadedMedia);
    }
    let byte;
    if (message.media.className === 'MessageMediaPhoto') {
      byte = message.media.photo.sizes[0].originalArgs.bytes;
      let i = message.media.photo.sizes[message.media.photo.sizes.length - 1];
      size = humanFileSize(i.size ? i.size : i.sizes[i.sizes.length - 1], true);
    } else if (message.media.className === 'MessageMediaDocument') {
      byte = message.media.document.thumbs[0].originalArgs.bytes;
      size = humanFileSize(message.media.document.size.toJSNumber(), true);
    }
    try {
      const arrBuff = strippedPhotoToJpg(Buffer.from(byte));
      const reader = new FileReader();
      reader.readAsDataURL(new Blob([arrBuff], {type : 'image/jpeg'}));
      reader.onloadend = () => {
        thumb = reader.result;
      }
    } catch (err) {}
  });

  onMount(async () => {})

  onDestroy(() => {
    downloadedMediaEmitter.removeListener('message', handleDownloadedMedia);
  });

</script>

<svelte:options accessors immutable={true}/>

<div class="media-container">
  <img alt="thumb" src="{thumb}" />
  <small>
    <div>{#if downloading > -1}{downloading}%&nbsp;{/if}{#if !downloaded && downloading === -1}<img alt="download" src="/icons/download.svg" width="10px" height="10px" />&nbsp;{/if}Photo</div>
    <div>{size}</div>
  </small>
</div>

<style>
.media-container {
  text-align: start;
  display: flex;
  flex-direction: row;
}

.media-container > img {
  width: auto;
  max-width: 70%;
  height: 30px;
}

.media-container > small {
  margin: 0 0 0 4px;
  padding: 0px;
  font-size: 12px;
  color: #6A6A6A;
  text-align: start;
  vertical-align: middle;
  overflow: hidden;
}
</style>
