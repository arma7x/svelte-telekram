<script lang="ts">

  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

  onMount(() => {
    // console.log(message);
  });

</script>

<svelte:options accessors immutable={true}/>

<div class="MessageActionBotAllowed">
  <p>Bot allowed</p>
</div>

<style>
  .MessageActionBotAllowed {
    box-sizing: border-box;
    margin: 0px;
    padding: 0px;
  }
  .MessageActionBotAllowed > p {
    margin: 0px;
    padding: 0px;
    font-style: italic;
  }
</style>
