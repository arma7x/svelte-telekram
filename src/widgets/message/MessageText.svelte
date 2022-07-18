<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../utils/navigation';

  import { cachedThumbnails, getAuthorizedUser } from '../../stores/telegram';

  import Sticker from './media/Sticker.svelte';
  import Video from './media/Video.svelte';
  import Photo from './media/Photo.svelte';
  import Text from './media/Text.svelte';
  import Audio from './media/Audio.svelte';
  import Poll from './media/Poll.svelte';
  import Geo from './media/Geo.svelte';

  export let key: any = '';
  export let type: string = '';
  export let message: any = {};
  export let className: string = null;
  export let onClick: Function = (evt) => {}
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallback: Function = (id, callback) => {}

  let uncachedThumbnails;
  let hasAvatar: bool = false;
  let avatarSrc: string = '';
  let justifyContent: string = 'start';
  let expandable: bool = false;
  let media: any;
  let _wip: string = null;

  onMount(async () => {
    // todo render message.media if !null
    if (message.message.length > 80)
      expandable = true;
    if (message.media) {
      if (message.media.className === 'MessageMediaDocument') {
        switch (message.media.document.mimeType) {
          case 'application/x-tgsticker':
            media = Sticker;
            break;
          case 'video/mp4':
            media = Video;
            break;
          case 'image/jpeg':
            media = Photo;
            break;
          case 'text/plain':
            media = Text;
            break;
          case 'audio/mpeg':
          case 'audio/ogg':
            media = Audio;
            break;
          default:
            _wip = 'WIP Media: ' + message.media.className;
            console.log(message.media);
        }
      } else if (message.media.className === "MessageMediaPoll"){
        media = Poll;
      } else if (message.media.className === "MessageMediaPhoto"){
        media = Photo;
      } else if (message.media.className === "MessageMediaGeo"){
        media = Geo;
      } else {
        _wip = 'WIP Media: ' + message.media.className;
        console.log(message.media);
      }
    }
    const user = await getAuthorizedUser();
    if (['group', 'user', 'bot'].indexOf(type) > -1) {
      if (user[0] == null) {
        hasAvatar = true;
      } else {
        if (message.sender.id.toString() === user[0].id.toString()) {
          hasAvatar = false;
          justifyContent = 'end';
        } else {
          hasAvatar = true;
        }
      }
    } else {
      hasAvatar = false;
    }
    if (!hasAvatar)
      return;
    uncachedThumbnails = cachedThumbnails.subscribe(data => {
      if (message.iconRef && data[message.iconRef]) {
        avatarSrc = `<img alt="icon" style="position:absolute;bottom:0;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;"" src="${data[message.iconRef]}"/>`
      } else {
        avatarSrc = `<div style="position:absolute;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;font-weight:bold;color:#fff;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;">${message.sender.firstName.split(' ').map(text => text[0]).splice(0, 2).join('')}</div>`
      }
    });
  });

  onDestroy(() => {
    if (uncachedThumbnails)
      uncachedThumbnails();
  });

</script>

<svelte:options accessors immutable={true}/>

<div data-key="{key}" class="kai-list-view {className ? className : ''}" on:click={onClick} style="justify-content:{type === 'channel' ? 'start' : justifyContent};min-height:{hasAvatar ? '50px' : '0px'};">
  {#if hasAvatar }{@html avatarSrc}{/if}
  <div class="kai-list-view-content" style="margin-left:{hasAvatar ? '45px' : '0px'};">
    {#if hasAvatar }
      <b>{message.sender.firstName}</b>
    {/if}
    {#if media }
      <svelte:component this={media} {message} {parentNavInstance} {registerCallback}/>
    {/if}
    {#if _wip }
      { _wip }
    {/if}
    {#if message.message }
      <p>{message.message.length > 80 ? message.message.substring(0, 80) + '...' : message.message}</p>
    {/if}
  </div>
</div>

<style>
  .kai-list-view {
    position: relative;
    background-color: transparent;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: start;
    box-sizing: border-box;
    width: 100%;
    font-size: 14px;
    overflow: hidden;
    padding: 4px;
  }

  .kai-list-view > .kai-list-view-content {
    border-radius: 5px;
    box-sizing: border-box;
    padding: 5px!important;
    background-color: transparent;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: start;
    text-align: start;
    max-width: calc(100% - 50px);
    overflow: hidden;
    border: 1px solid var(--themeColorTransparent);
  }

  .kai-list-view > .kai-list-view-content > p {
    max-height: 100px;
    background-color: transparent;
    padding: 0px;
    margin: 0px;
    font-weight: 400;
    color: #323232;
    font-size: 14px;
    text-align: start;
    white-space: pre-wrap!important;
    word-break: break-word!important;
  }

  .kai-list-view.focus,
  .kai-list-view.focus > .kai-list-view-content {
    background-color: var(--themeColorTransparent);
  }
</style>
