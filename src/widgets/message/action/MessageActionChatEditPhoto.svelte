<script lang="ts">

  import { onMount, onDestroy } from 'svelte';
  import { getCachedThumbnails } from '../../../telegram';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let callButtonCallback: Function = (id, callback) => {}
  export let fetchMessageCallback: Function = (id: number) => {}

  let src: string = '';

  onMount(() => {
    const cached = getCachedThumbnails()
    if (cached[message.action.photo.id.toString()])
      src = cached[message.action.photo.id.toString()];
  });

</script>

<svelte:options accessors immutable={true}/>

<div class="MessageActionChatEditPhoto">
  <p>Photo updated</p>
  <img alt="icon" src={src}/>
</div>

<style>
  .MessageActionChatEditPhoto {
    box-sizing: border-box;
    margin: 0px;
    padding: 0px;
  }
  .MessageActionChatEditPhoto > p {
    margin: 0px;
    padding: 0px;
    font-style: italic;
  }
  .MessageActionChatEditPhoto > img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
</style>
