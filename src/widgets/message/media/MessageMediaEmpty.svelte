<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

  function actionMenu() {}

  onMount(() => {
    registerCallButtonHandler(message.id.toString(), actionMenu);
  })

</script>

<svelte:options accessors immutable={true}/>

<div class="media-container">
  <span style="color:#A20000;">{message.media.className}</span>
</div>

<style>
.media-container {
  text-align: start;
}
</style>
