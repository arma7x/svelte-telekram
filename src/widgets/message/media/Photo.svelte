<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';
  import { strippedPhotoToJpg, humanFileSize, isMediaCached, getCachedMedia } from './common';

  import { Buffer} from 'buffer';
  import { downloadedMediaEmitter } from '../../../stores/telegram';

  export let chat: any = {};
  export let message: any = {}; //.media.photo or .media.document
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

  let thumb: string;
  let size: strinng;
  let downloaded: bool = false;
  let fileId: string;

  function actionMenu() {
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
  }

  async function handleDownloadedMedia(evt) {
    if (evt.hash && evt.hash === chat.id.value.toString() + '_' + message.id.toString()) {
      if (evt.done != null) {
        downloaded = await isMediaCached(fileId);
      } else if (evt.progress) {
        console.log(evt.progress);
      } else if (evt.error) {
        console.log(evt.error);
      }
    }
  }

  onMount(async () => {
    if (message.media.photo) {
      fileId = message.media.photo.id.toString();
    } else if (message.media.document) {
      fileId = message.media.document.id.toString();
    }
    downloaded = await isMediaCached(fileId);
    registerCallButtonHandler(message.id.toString(), actionMenu);
    downloadedMediaEmitter.addListener('message', handleDownloadedMedia);
    let byte;
    if (message.media.className === 'MessageMediaPhoto') {
      byte = message.media.photo.sizes[0].originalArgs.bytes;
      size = humanFileSize(message.media.photo.sizes[message.media.photo.sizes .length - 1].size, true);
    } else if (message.media.className === 'MessageMediaDocument') {
      byte = message.media.document.thumbs[0].originalArgs.bytes;
      size = humanFileSize(message.media.document.size.toJSNumber(), true);
    }
    const arrBuff = strippedPhotoToJpg(Buffer.from(byte));
    const reader = new FileReader();
    reader.readAsDataURL(new Blob([arrBuff], {type : 'image/jpeg'}));
    reader.onloadend = () => {
      thumb = reader.result;
    }
  })

  onDestroy(() => {
    downloadedMediaEmitter.removeListener('message', handleDownloadedMedia);
  });

</script>

<svelte:options accessors immutable={true}/>

<div class="media-container">
  <img alt="thumb" src="{thumb}" />
  <small>
    <div>{#if !downloaded}<img alt="download" src="/icons/download.svg" width="10px" height="10px" />&nbsp;{/if}Photo</div>
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
