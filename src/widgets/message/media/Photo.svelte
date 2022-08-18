<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';
  import { strippedPhotoToJpg, humanFileSize } from '../../../utils/misc';

  import { Buffer} from 'buffer';
  import { downloadedMediaEmitter } from '../../../stores/telegram';

  export let chat: any = {};
  export let message: any = {}; //.media.photo or .media.document
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

  let undownloadedMediaEmitter;
  let thumb: string;
  let size: strinng;
  let downloaded: bool = false;

  function actionMenu() {
    //if (window['authorizedWebWorker']) {
      //window['authorizedWebWorker'].postMessage({
        //type: 1,
        //params: {
          //chatId: chat.id.value.toString(),
          //messageId: message.id,
        //}
      //});
    //}
  }

  onMount(() => {
    registerCallButtonHandler(message.id.toString(), actionMenu);
    undownloadedMediaEmitter = downloadedMediaEmitter.subscribe(evt => {
      if (evt.hash && evt.hash === chat.id.value.toString() + message.id.toString()) {
        try {
          const reader = new FileReader();
          let mime = message.media.photo ? 'image/jpeg' : message.media.document.mimeType;
          reader.readAsDataURL(new Blob([evt.result], {type : mime}));
          reader.onloadend = () => {
            src = reader.result;
          }
        } catch (err) {
          console.log(err);
        }
      }
    });
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
    if (undownloadedMediaEmitter)
      undownloadedMediaEmitter();
  });

</script>

<svelte:options accessors immutable={true}/>

<div class="media-container">
  <img src="{thumb}" />
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
