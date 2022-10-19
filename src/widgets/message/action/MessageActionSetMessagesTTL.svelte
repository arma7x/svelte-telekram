<script lang="ts">

  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let callButtonCallback: Function = (id, callback) => {}
  export let fetchMessageCallback: Function = (id: number) => {}

  onMount(() => {
    // console.log(message);
  });

</script>

<div class="MessageActionSetMessagesTTL">
  <p>{message.action.className}: {message.action.period}</p>
</div>

<style>
  .MessageActionSetMessagesTTL {
    box-sizing: border-box;
    margin: 0px;
    padding: 0px;
  }
  .MessageActionSetMessagesTTL > p {
    margin: 0px;
    padding: 0px;
    font-style: italic;
  }
</style>
