<script lang="ts">

  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let callButtonCallback: Function = (id, callback) => {}
  export let fetchMessageCallback: Function = (id: number) => {}

  let dt: bool|string = false;
  onMount(() => {
    // console.log(message);
    try {
      dt = new Date(message.action.scheduleDate * 1000).toLocaleString();
    } catch (err) {
      console.log("MessageActionGroupCallScheduled", err);
    }
  });

</script>

<div class="MessageActionGroupCallScheduled">
  <p>{message.action.className}{#if dt}: {dt}{/if}</p>
</div>

<style>
  .MessageActionGroupCallScheduled {
    box-sizing: border-box;
    margin: 0px;
    padding: 0px;
  }
  .MessageActionGroupCallScheduled > p {
    margin: 0px;
    padding: 0px;
    font-style: italic;
  }
</style>
