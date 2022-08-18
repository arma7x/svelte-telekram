<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';
  import { strippedPhotoToJpg } from '../../../utils/misc';

  import { Buffer} from 'buffer';
  import { downloadedMediaEmitter } from '../../../stores/telegram';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

  let undownloadedMediaEmitter;
  let thumb: string;

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

  onMount(async () => {
    registerCallButtonHandler(message.id.toString(), actionMenu);
    undownloadedMediaEmitter = downloadedMediaEmitter.subscribe(evt => {
      if (evt.hash && evt.hash === chat.id.value.toString() + message.id.toString()) {
        try {
          const reader = new FileReader();
          reader.readAsDataURL(new Blob([evt.result], {type : message.media.document.mimeType}));
          reader.onloadend = () => {
            src = reader.result;
          }
        } catch (err) {
          console.log(err);
        }
      }
    });
    const arrBuff = strippedPhotoToJpg(Buffer.from(message.media.document.thumbs[0].originalArgs.bytes));
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
  <img style="max-width:50px;height:auto;" src="{thumb}" />
</div>

<style>
.media-container {
  text-align: start;
}
</style>
