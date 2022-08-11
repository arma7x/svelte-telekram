<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

  function actionMenu() {
    window.open(`https://www.google.com/maps/search/?api=1&query=${message.media.geo.lat},${message.media.geo.long}`, '_blank').focus();
  }

  let url: string = '';

  onMount(() => {
    registerCallButtonHandler(message.id.toString(), actionMenu);
    url = `https://maps.google.com/maps?width=100px;height=100px&hl=en&q=${message.media.geo.lat},${message.media.geo.long}+(Location)&t=&z=15&ie=UTF8&iwloc=B&output=embed`
  })

</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  <div style="width: 100%"><iframe width="100%" height="100" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src={url}></iframe></div>
</div>

<style>
.media-container {
  text-align: start;
}
</style>
