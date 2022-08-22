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

<div class="MessageActionInviteToGroupCall">
  <p>WIP: {message.action.className}</p>
</div>

<style>
  .MessageActionInviteToGroupCall {
    box-sizing: border-box;
    margin: 0px;
    padding: 0px;
  }
  .MessageActionInviteToGroupCall > p {
    margin: 0px;
    padding: 0px;
    font-style: italic;
  }
</style>
