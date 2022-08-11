<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}

  function actionMenu() {
    console.log('Clicked:', message.id.toString());
  }

  onMount(() => {
    registerCallButtonHandler(message.id.toString(), actionMenu);
  })


</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  <span style="color:#A20000;">Unsupported Media: Text</span>
</div>

<style>
.media-container {
  text-align: start;
}
</style>
