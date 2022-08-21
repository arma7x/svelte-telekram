<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';
  import { humanFileSize, isMediaCached, getCachedMedia } from './common';
  import { downloadedMediaEmitter } from '../../../stores/telegram';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

  let size: string;
  let downloaded: bool = false;
  let fileId: string;
  let downloading: number = -1;

  function actionMenu() {
    // TODO, Action Menu: View(downloaded === true), Save to Storage(downloaded === true), Download(downloaded === false)
    if (downloaded)
      return;
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

  function getFileType(string) {
    try {
      return message.media.document.attributes[0].fileName;
    } catch (err) {}
    const strings = string.split('/');
    string = strings[strings.length - 1];
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  onMount(async () => {
    fileId = message.media.document.id.toString();
    downloaded = await isMediaCached(fileId);
    registerCallButtonHandler(message.id.toString(), actionMenu);
    downloadedMediaEmitter.addListener('message', handleDownloadedMedia);
    size = humanFileSize(message.media.document.size.toJSNumber(), true);
  })

  onDestroy(() => {
    downloadedMediaEmitter.removeListener('message', handleDownloadedMedia);
  })

</script>

<svelte:options accessors immutable={true}/>

<div class="media-container">
  <img alt="thumb" src="/icons/document.svg" />
  <small>
    <div>{#if downloading > -1}{downloading}%&nbsp;{/if}{#if !downloaded && downloading === -1}<img alt="download" src="/icons/download.svg" width="10px" height="10px" />&nbsp;{/if}{getFileType(message.media.document.mimeType)}</div>
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
