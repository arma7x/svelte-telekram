<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallback: Function = (id, callback) => {}

  function actionMenu() {
    console.log('Clicked:', message.id.toString());
  }

  onMount(() => {
    registerCallback(message.id.toString(), actionMenu);
  })

</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  <span style="color:#A20000;">Unsupported Media: Audio</span>
</div>

<style>
.media-container {
  text-align: start;
}
</style>
