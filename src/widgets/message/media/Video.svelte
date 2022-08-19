<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';
  import { strippedPhotoToJpg, humanFileSize } from '../../../utils/misc';
  import { cachedDatabase } from '../../../utils/bootstrap';

  import { Buffer } from 'buffer';
  import { downloadedMediaEmitter } from '../../../stores/telegram';

  export let chat: any = {};
  export let message: any = {};
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

  async function checkFile() {
    const keys = await (await cachedDatabase).getAllKeys('mediaAttachments');
    if (keys.indexOf(fileId) > -1) {
      downloaded = true;
    } else {
      downloaded = false;
    }
  }

  async function getDownloadedMedia() {
    let media = await (await cachedDatabase).get('mediaAttachments', fileId);
    if (media) {
      try {
        const reader = new FileReader();
        let mime = message.media.photo ? 'image/jpeg' : message.media.document.mimeType;
        reader.readAsDataURL(new Blob([media], {type : mime}));
        reader.onloadend = () => {
          console.log(reader.result);
        }
      } catch (err) {
        console.log(err);
      }
      downloaded = true;
    } else {
      downloaded = false;
    }
  }

  function handleDownloadedMedia(evt) {
    if (evt.hash && evt.hash === chat.id.value.toString() + '_' + message.id.toString()) {
      if (evt.done != null) {
        checkFile();
        //getDownloadedMedia();
      } else if (evt.progress) {
        console.log(evt.progress);
      } else if (evt.error) {
        console.log(evt.error);
      }
    }
  }

  onMount(() => {
    if (message.media.photo) {
      fileId = message.media.photo.id.toString();
    } else if (message.media.document) {
      fileId = message.media.document.id.toString();
    }
    checkFile();
    // getDownloadedMedia();
    registerCallButtonHandler(message.id.toString(), actionMenu);
    downloadedMediaEmitter.addListener('message', handleDownloadedMedia);
    size = humanFileSize(message.media.document.size.toJSNumber(), true);
    const arrBuff = strippedPhotoToJpg(Buffer.from(message.media.document.thumbs[0].originalArgs.bytes));
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
  <img src="{thumb}" />
  <small>
    <div>{#if !downloaded}<img alt="download" src="/icons/download.svg" width="10px" height="10px" />&nbsp;{/if}Video</div>
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
