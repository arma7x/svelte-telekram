<script lang="ts">
  import DOMPurify from 'dompurify';
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../utils/navigation';

  import { Api, client } from '../../utils/bootstrap';

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
  export let replyTo: any;

  let uncachedThumbnails;
  let hasAvatar: bool = false;
  let avatarSrc: string = '';
  let justifyContent: string = 'start';
  let expandable: bool = false;
  let media: any;
  let fullName: string;
  let _wip: string = null;

  function renderReplyHeader(msg) {
    const columns = [];
    if (msg.media) {
      columns.push(`<div>${msg.media.className}</div>`);
    }
    if (msg.message && msg.message !== '') {
      columns.push(`<div>${msg.message.length > 10 ? msg.message.substring(0, 10) + '...' : msg.message}</div>`);
    }
    return `<div>${columns.join('')}<div>`;
  }

  function getFullname() {
    let fullname = '';
    if (message.forward && message.forward.originalFwd.fromName) {
      fullname = message.forward.originalFwd.fromName;
    } else if (message.forward && message.forward.originalFwd.sender) {
      let fn = '';
      if (message.forward.originalFwd.sender.firstName)
        fn += message.forward.originalFwd.sender.firstName;
      if (message.forward.originalFwd.sender.lastName)
        fn += ' ' + message.forward.originalFwd.sender.lastName;
      if (message.forward.originalFwd.sender.title)
        fn = message.forward.originalFwd.sender.title;
      fullname = fn;
    } else if (message.sender) {
      let fn = '';
      if (message.sender.firstName)
        fn += message.sender.firstName;
      if (message.sender.lastName)
        fn += ' ' + message.sender.lastName;
      fullname = fn;
    }
    return fullname;
  }

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
            // console.log(message.media);
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
        justifyContent = 'start';
      } else {
        if (message.sender.id.toString() === user[0].id.toString()) {
          hasAvatar = false;
          justifyContent = 'end';
        } else {
          hasAvatar = true;
          justifyContent = 'start';
        }
      }
    } else {
      hasAvatar = false;
      justifyContent = 'end';
    }
    if (message.forward) {
      if (message.forward.originalFwd.fromName) {
        delete message.iconRef;
        hasAvatar = true;
        justifyContent = 'start';
      } else if (message.forward.originalFwd.fromId) {
        delete message.iconRef;
        hasAvatar = true;
        justifyContent = 'start';
        if (message.forward.originalFwd.fromId.className === 'PeerUser') {
          const users = await client.invoke(
            new Api.users.GetUsers({
              id: [message.forward.originalFwd.fromId]
            })
          );
          if (users[0])
            message.forward.originalFwd.sender = users[0];
          fullName = getFullname();
        } else if (message.forward.originalFwd.fromId.className === 'PeerChannel') {
          const channels = await client.invoke(
            new Api.channels.GetChannels({
              id: [message.forward.originalFwd.fromId]
            })
          );
          if (channels.chats[0])
            message.forward.originalFwd.sender = channels.chats[0];
          fullName = getFullname();
        }
      }
    } else if (message.sender && user[0] && message.sender.id.toString() !== user[0].id.toString()) {
      console.log('???', message.sender);
    }
    if (!hasAvatar)
      return;
    uncachedThumbnails = cachedThumbnails.subscribe(data => {
      if (message.iconRef && data[message.iconRef]) {
        avatarSrc = `<img alt="icon" style="position:absolute;bottom:0;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;"" src="${data[message.iconRef]}"/>`
      } else {
        let name = getFullname().split(' ').map(text => text[0].toUpperCase()).splice(0, 2).join('');
        avatarSrc = `<div style="position:absolute;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;font-weight:bold;color:#fff;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;">${name}</div>`
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
  {#if hasAvatar }{@html DOMPurify.sanitize(avatarSrc)}{/if}
  <div class="kai-list-view-content" style="margin-left:{hasAvatar ? '45px' : '0px'};">
    {#if hasAvatar }
      <b>{fullName || getFullname()}</b>
    {/if}
    {#if replyTo !== false}
      <div class="reply-box">
      {#if replyTo === -1}
        <small>Deleted</small>
      {:else}
        {@html DOMPurify.sanitize(renderReplyHeader(replyTo))}
      {/if}
      </div>
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

  .kai-list-view > .kai-list-view-content > .reply-box {
    padding: 1px 1px 1px 3px;
    margin-bottom: 2px;
    border-left: 1px solid var(--themeColor);
    font-size: 90%
  }

  .kai-list-view.focus,
  .kai-list-view.focus > .kai-list-view-content {
    background-color: var(--themeColorTransparent);
  }
</style>
