<script lang="ts">

  import { onMount, onDestroy } from 'svelte';
  import { getCachedThumbnails } from '../../../stores/telegram';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  export let key: any = '';
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}

  let src: string = '';

  onMount(async () => {
    const cached = await getCachedThumbnails()
    src = cached[message.action.photo.id.toString()];
  });

</script>

<svelte:options accessors immutable={true}/>

<div class="MessageActionChatEditPhoto">
  <p>Channel photo updated</p>
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
