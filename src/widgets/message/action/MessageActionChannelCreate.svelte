<script lang="ts">

  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  export let key: any = '';
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}

  onMount(() => {
    // console.log(message);
  });

</script>

<svelte:options accessors immutable={true}/>

<div class="MessageActionChannelCreate">
  <p>Channel created</p>
</div>

<style>
  .MessageActionChannelCreate {
    box-sizing: border-box;
    margin: 0px;
    padding: 0px;
  }
  .MessageActionChannelCreate > p {
    margin: 0px;
    padding: 0px;
    font-style: italic;
  }
</style>
