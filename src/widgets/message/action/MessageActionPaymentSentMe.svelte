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

<div class="MessageActionPaymentSentMe">
  <p>{message.action.className}: {message.action.currency}{message.action.totalAmount}</p>
</div>

<style>
  .MessageActionPaymentSentMe {
    box-sizing: border-box;
    margin: 0px;
    padding: 0px;
  }
  .MessageActionPaymentSentMe > p {
    margin: 0px;
    padding: 0px;
    font-style: italic;
  }
</style>
