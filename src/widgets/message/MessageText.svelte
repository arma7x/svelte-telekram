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
  export let entity: any = {};
  export let message: any = {};
  export let className: string = null;
  export let onClick: Function = (evt) => {}
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let replyTo: any;
  export let short: bool = false;

  let nodeRef;
  let uncachedThumbnails;
  let hasAvatar: bool = false;
  let avatarSrc: string = '';
  let justifyContent: string = 'start';
  let expandable: bool = false;
  let media: any;
  let fullName: string;
  let forwardedPrefix: string = '';
  let _wip: string = null;

  let navOptions = {
    softkeyLeftListener: async function(evt) {},
    softkeyRightListener: function(evt) {},
    enterListener: function(evt) {},
    backspaceListener: function(evt) {
      evt.preventDefault();
      console.log('destroy self');
      parentNavInstance.attachListener();
      navInstance.detachListener();
      nodeRef.parentNode.removeChild(nodeRef);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  function renderReplyHeader(msg) {
    const columns = [];
    if (msg.media) {
      columns.push(`<div>${msg.media.className}</div>`);
    }
    if (msg.message && msg.message !== '') {
      columns.push(`<div>${msg.message.length > 20 ? msg.message.substring(0, 20) + '...' : msg.message}</div>`);
    }
    return `<div>${columns.join('')}<div>`;
  }

  function getFullname() {
    let fullname = '';
    try {
      const sender = message.sender || message.__sender;
      if (message.fwdFrom && message.fwdFrom.fromName) {
        fullname = message.fwdFrom.fromName;
      } else if (message.fwdFrom && message.fwdFrom.sender) {
        let fn = '';
        if (message.fwdFrom.sender.firstName)
          fn += message.fwdFrom.sender.firstName;
        if (message.fwdFrom.sender.lastName)
          fn += ' ' + message.fwdFrom.sender.lastName;
        if (message.fwdFrom.sender.title)
          fn = message.fwdFrom.sender.title;
        fullname = fn;
      } else if (sender) {
        let fn = '';
        if (sender.firstName)
          fn += sender.firstName;
        if (sender.lastName)
          fn += ' ' + sender.lastName;
        fullname = fn;
      }
    } catch (err) {
      console.log(err, message);
    }
    return fullname;
  }

  onMount(async () => {
    // todo render message.media if !null
    if (!short) {
      parentNavInstance.detachListener();
      navInstance.attachListener();
    }
    if (message.message.length > 80 && short)
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
        // console.log(message.media);
      }
    }
    const user = await getAuthorizedUser();
    const sender = message.sender || message.__sender;
    if (sender && user[0] && sender.id.toString() === user[0].id.toString()) {
      hasAvatar = false;
      justifyContent = 'end';
    } else {
      hasAvatar = true;
      justifyContent = 'start';
      if (entity.className === 'Channel' && !entity.megagroup) {
        hasAvatar = false;
      }
    }
    if (message.fwdFrom) {
      if (entity.id.value.toString() !== user[0].id.toString()) {
        forwardedPrefix = 'Forwarded from ';
      }
      if (sender.id.toString() === user[0].id.toString() && sender.id.toString() === entity.id.value.toString()) {
        hasAvatar = true;
        justifyContent = 'start';
      }
      if (message.fwdFrom.fromName) {
        delete message.iconRef;
      } else if (message.fwdFrom.fromId) {
        if (message.fwdFrom.fromId.className === 'PeerUser') {
          fullName = getFullname();
        } else if (message.fwdFrom.fromId.className === 'PeerChannel') {
          fullName = getFullname();
        }
      }
    }
    if (!hasAvatar)
      return;
    uncachedThumbnails = cachedThumbnails.subscribe(data => {
      if (message.iconRef && data[message.iconRef]) {
        avatarSrc = `<img alt="icon" style="position:absolute;bottom:0;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;"" src="${data[message.iconRef]}"/>`
      } else {
        try {
          let name = getFullname(message).split(' ').map(text => text[0].toUpperCase()).splice(0, 2).join('');
          avatarSrc = `<div style="position:absolute;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;font-weight:bold;color:#fff;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;">${name}</div>`
        } catch(err) {
          avatarSrc = `<div style="position:absolute;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;font-weight:bold;color:#fff;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;">??</div>`
        }
      }
    });
  });

  onDestroy(() => {
    if (!short) {
      parentNavInstance.attachListener();
      navInstance.detachListener();
    }
    if (uncachedThumbnails)
      uncachedThumbnails();
  });

</script>

<svelte:options accessors immutable={true}/>

<div bind:this={nodeRef} data-key="{key}" class="kai-list-view {className ? className : ''}" on:click={onClick} style="background-color:{!short ? 'var(--themeColorLight)' : 'inherit'};height:{!short ? '92%' : 'auto'};justify-content:{entity.className === 'Channel' && !entity.megagroup ? 'start' : justifyContent};min-height:{hasAvatar ? '50px' : '0px'};">
  {#if hasAvatar }{@html DOMPurify.sanitize(avatarSrc)}{/if}
  <div class="kai-list-view-content" style="margin-left:{hasAvatar ? '45px' : '0px'};">
    {#if hasAvatar }
      <b>{fullName || getFullname()}</b>
    {:else if message.fwdFrom}
      <b>{forwardedPrefix}{fullName || getFullname()}</b>
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
      <svelte:component this={media} {message} {parentNavInstance} {registerCallButtonHandler}/>
    {/if}
    {#if _wip }
      { _wip }
    {/if}
    {#if message.message }
      <p>{message.message.length > 80 && short ? message.message.substring(0, 80) + '...' : message.message}</p>
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
    padding: 2px 0px 2px 3px;
    margin-bottom: 3px;
    border-left: 1px solid var(--themeColor);
    font-size: 90%
  }

  .kai-list-view.focus,
  .kai-list-view.focus > .kai-list-view-content {
    background-color: var(--themeColorTransparent);
  }
</style>
