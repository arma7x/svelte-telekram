<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  import { downloadMedia } from '../../../stores/telegram';

  export let chat: any = {};
  export let message: any = {}; //.media.photo or .media.document
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

  let undownloadMedia;

  let src: any;

  function actionMenu() {
    if (window['web_worker']) {
      window['web_worker'].postMessage({
        type: 1,
        params: {
          chatId: chat.id.value.toString(),
          messageId: message.id,
        }
      });
    }
  }
  onMount(() => {
    registerCallButtonHandler(message.id.toString(), actionMenu);
    undownloadMedia = downloadMedia.subscribe(evt => {
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
  })

  onDestroy(() => {
    if (undownloadMedia)
      undownloadMedia();
  });

</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  {#if src}
    <img style="max-width:170px;height:auto;" src="{src}" />
  {/if}
  <span style="color:#A20000;">Unsupported Media: Photo</span>
</div>

<style>
.media-container {
  text-align: start;
}
</style>
