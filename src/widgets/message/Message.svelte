<script lang="ts">
  import { onMount, onDestroy, beforeUpdate } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../utils/navigation';
  import * as Media from './media';

  import DOMPurify from 'dompurify';
  import { Api, client } from '../../utils/bootstrap';
  import { cachedThumbnails, getAuthorizedUser } from '../../telegram';

  export let key: any = '';
  export let chat: any = {};
  export let message: any = {};
  export let className: string = null;
  export let onClick: Function = (evt) => {}
  export let parentNavInstance: typeof KaiNavigator;
  export let callButtonCallback: Function = (id, callback) => {}
  export let fetchMessageCallback: Function = (id: number) => {}
  export let destroyCallback: Function = () => {}
  export let replyTo: any;
  export let short: bool = false;
  export let scrollable: bool = false;
  export let replyThreadId: any;

  let nodeRef;
  let self: bool = false;
  let uncachedThumbnails;
  let hasAvatar: bool = false;
  let avatarSrc: string = '';
  let justifyContent: string = 'start';
  let expandable: bool = false;
  let fullName: string = '';
  let forwardedPrefix: string = '';
  let showFull: bool = false;
  let hasMedia: bool = false;
  let mediaWidget;

  let navOptions = {
    arrowUpListener: function(evt) {
      nodeRef.scrollTop -= 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowDownListener: function(evt) {
      nodeRef.scrollTop += 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowLeftListener: function(evt) {
      nodeRef.scrollLeft -= 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowRightListener: function(evt) {
      nodeRef.scrollLeft += 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    softkeyLeftListener: async function(evt) {},
    softkeyRightListener: function(evt) {},
    enterListener: function(evt) {},
    backspaceListener: function(evt) {
      evt.preventDefault();
      destroyCallback();
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  function renderReplyHeader(msg) {
    const columns = [];
    if (msg.media) {
      columns.push(`<div>${msg.media.className}</div>`);
    }
    if (msg.message && msg.message !== '') {
      columns.push(`<div>${short && msg.message.length > 20 ? msg.message.substring(0, 20) + '...' : msg.message}</div>`);
    }
    return `<div>${columns.join('')}<div>`;
  }

  function getFullname(msg) {
    let fullname = '';
    try {
      const sender = msg.sender || msg.__sender;
      if (msg.fwdFrom && msg.fwdFrom.fromName) {
        fullname = msg.fwdFrom.fromName;
      } else if (msg.fwdFrom && msg.fwdFrom.sender) {
        let fn = '';
        if (msg.fwdFrom.sender.firstName)
          fn += msg.fwdFrom.sender.firstName;
        if (msg.fwdFrom.sender.lastName)
          fn += ' ' + msg.fwdFrom.sender.lastName;
        if (msg.fwdFrom.sender.title)
          fn = msg.fwdFrom.sender.title;
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

  function getTime(msg) {
    let t = new Date(msg.date * 1000)
    if (scrollable)
      return t.toLocaleString();
    t = t.toLocaleTimeString();
    const ts = t.split(' ');
    let hms = ts[0].split(':');
    hms.pop();
    return hms.join(':') + ' ' + ts[1];
  }

  function resolveMediaWidget(msg) {
    let media;
    if (msg.media.className === 'MessageMediaDocument') {
      switch (msg.media.document.mimeType) {
        case 'application/x-tgsticker':
          media = Media.MessageMediaDocument.Sticker;
          break;
        case 'video/mp4':
          media = Media.MessageMediaDocument.Video;
          break;
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
        case 'image/webp':
          media = Media.MessageMediaPhoto;
          break;
        case 'audio/mpeg':
        case 'audio/ogg':
          media = Media.MessageMediaDocument.Audio;
          break;
        default:
          media = Media.MessageMediaDocument.Doc;
      }
    } else if (Media[msg.media.className]) {
      media = Media[msg.media.className];
    } else {
      media = Media.Dummy;
    }
    return media;
  }

  onMount(() => {
    // MessageEntityMention
    // MessageEntityBotCommand
    // MessageEntityUrl
    // MessageEntityEmail
    // MessageEntityTextUrl
    // MessageEntityMentionName
    // InputMessageEntityMentionName
    // MessageEntityPhone
    // console.log(message.id, message.entities);
    // console.log(message.id, `short:${!short}`, `scrollable:${scrollable}`, `pinned:${message.pinned}`, `out:${message.out}`, `post:${message.post}`, `ttlPeriod:${message.ttlPeriod}`, `mentioned:${message.mentioned}`, `fromScheduled:${message.fromScheduled}`, message.buttons);
  });

  beforeUpdate(async () => {
    if (!short && scrollable) {
      showFull = true;
      parentNavInstance.detachListener();
      navInstance.attachListener();
    }
    try {
      if (message.media) {
        hasMedia = true;
        mediaWidget = resolveMediaWidget(message);
      } else {
        hasMedia = false;
        mediaWidget = null;
      }
      if (message.message.length > 80 && short)
        expandable = true;
      let _hasAvatar;
      let _justifyContent;
      let _self = false;
      const user = await getAuthorizedUser();
      const sender = message.sender || message.__sender;
      if (sender && user[0] && sender.id.toString() === user[0].id.toString()) {
        _self = true;
        _hasAvatar = false;
        _justifyContent = 'end';
      } else {
        _self = false;
        _hasAvatar = true;
        _justifyContent = 'start';
        if (chat.entity.className === 'Channel' && !chat.entity.megagroup) {
          _hasAvatar = false;
        }
      }
      if (message.fwdFrom) {
        if (chat.entity.id && chat.entity.id.value.toString() !== user[0].id.toString()) {
          forwardedPrefix = 'Forwarded from ';
        }
        if (sender.id && sender.id.toString() === user[0].id.toString() && sender.id.toString() === chat.entity.id.value.toString()) {
          _hasAvatar = true;
          _justifyContent = 'start';
          _self = false;
        }
        if (message.fwdFrom.fromName) {
          delete message.iconRef;
        } else if (message.fwdFrom.fromId) {
          if (message.fwdFrom.fromId.className === 'PeerUser') {
            fullName = getFullname(message);
          } else if (message.fwdFrom.fromId.className === 'PeerChannel') {
            fullName = getFullname(message);
          }
        }
      }
      if (chat.entity.__isSavedMessages)
        _hasAvatar = true;
      hasAvatar = _hasAvatar;
      justifyContent = _justifyContent;
      self = _self;
      if (!hasAvatar)
        return;
      if (uncachedThumbnails)
        uncachedThumbnails();
      uncachedThumbnails = cachedThumbnails.subscribe(data => {
        if (message.iconRef && data[message.iconRef]) {
          avatarSrc = `<img alt="icon" style="position:absolute;${!short?'top:0':'bottom:0'};background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;"" src="${data[message.iconRef]}"/>`
        } else {
          try {
            let name = getFullname(message).split(' ').map(text => text[0].toUpperCase()).splice(0, 2).join('');
            avatarSrc = `<div style="position:absolute;${!short?'top:0':'bottom:0'};display:flex;flex-direction:column;justify-content:center;align-items:center;font-weight:bold;color:#fff;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;">${name}</div>`
          } catch(err) {
            avatarSrc = `<div style="position:absolute;${!short?'top:0':'bottom:0'};display:flex;flex-direction:column;justify-content:center;align-items:center;font-weight:bold;color:#fff;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;">DA</div>`
          }
        }
      });
    } catch (err) {
      console.log('beforeUpdate:', err);
    }
  });

  onDestroy(() => {
    if (!short && scrollable) {
      parentNavInstance.attachListener();
      navInstance.detachListener();
    }
    if (uncachedThumbnails)
      uncachedThumbnails();
  });

</script>

<svelte:options accessors immutable={true}/>

<div bind:this={nodeRef} data-key="{key}" class="kai-list-view {className ? className : ''}" on:click={onClick} style="background-color:{!short ? 'var(--themeColorLight)' : 'inherit'};{showFull ? 'height' : 'min-height'}:{!short ? '92%' : 'auto'};overflow:{!short ? 'scroll' : 'inherit'};justify-content:{chat.entity.className === 'Channel' && !chat.entity.megagroup ? 'start' : justifyContent};min-height:{hasAvatar ? '50px' : '0px'};">
  {#if hasAvatar && !chat.isUser }{@html DOMPurify.sanitize(avatarSrc)}{/if}
  {#if !self && chat.entity.__isSavedMessages }{@html DOMPurify.sanitize(avatarSrc)}{/if}
  <div class="kai-list-view-content" style="margin-left:{hasAvatar && !chat.isUser || (!self && chat.entity.__isSavedMessages) ? '45px' : '0px'};">
    {#if hasAvatar && !self && !chat.isUser}
      <b>{fullName || getFullname(message)}</b>
    {:else if message.fwdFrom}
      <b>{forwardedPrefix}{fullName || getFullname(message)}</b>
    {/if}
    {#if replyTo && replyTo !== false && replyTo.id && replyThreadId !== replyTo.id }
      <div class="reply-box">
      {#if replyTo === -1}
        <small>Deleted</small>
      {:else}
        {@html DOMPurify.sanitize(renderReplyHeader(replyTo))}
      {/if}
      </div>
    {/if}
    {#if hasMedia }
      <svelte:component this={mediaWidget} {chat} {message} {parentNavInstance} {callButtonCallback} {fetchMessageCallback}/>
    {/if}
    {#if message.message }
      <p>{@html DOMPurify.sanitize(message.message.length > 80 && short ? message.message.substring(0, 80) + '...&#13;<i style="font-size:12px;">(see more)</i>' : message.message)}</p>
    {/if}
    <div class="indicator">
      {#if message.media && message.media.webpage}
      <small class="buttons"><img alt="buttons" src="/icons/globe.svg" width="10px" height="10px" />&nbsp;</small>
      {/if}
      {#if message.replyMarkup && message.replyMarkup.rows}
      <small class="buttons"><img alt="buttons" src="/icons/keyboard.svg" width="10px" height="10px" />&nbsp;</small>
      {/if}
      {#if message.pinned}
      <small class="pinned"><img alt="pinned" src="/icons/pinned.svg" width="10px" height="10px" />;&nbsp;</small>
      {/if}
      {#if message.views}
      <small class="views"><img alt="views" src="/icons/eye.svg" width="10px" height="10px" />&nbsp;{message.views}&nbsp;</small>
      {/if}
      {#if message.editDate && message.editHide == false}
      <small class="edited"><img alt="edited" src="/icons/edited.svg" width="10px" height="10px" />&nbsp;</small>
      {/if}
      {#if message.replies && message.replies.replies > 0}
      <small class="reply"><img alt="reply" src="/icons/reply.svg" width="10px" height="10px" />&nbsp;{message.replies.replies}&nbsp;</small>
      {/if}
      {#if message.forwards && message.forwards > 0}
      <small class="forwards"><img alt="forwards" src="/icons/forward.svg" width="10px" height="10px" />&nbsp;{message.forwards}&nbsp;</small>
      {/if}
      <small class="time">{getTime(message)}</small>
    </div>
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
    background-color: #fff;
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

  .kai-list-view > .kai-list-view-content > .indicator {
    margin: 4px 0px 0px 0px;
    width: 100%;
    color: #2A2A2A;
    display: flex;
    flex-direction: row;
    justify-content: end;
    align-items: center;
  }

  .kai-list-view.focus,
  .kai-list-view.focus > .kai-list-view-content {
    background-color: var(--themeColorTransparent);
  }
</style>
