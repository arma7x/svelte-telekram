<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../../utils/navigation';

  import { cachedThumbnails, getAuthorizedUser } from '../../stores/telegram';

  export let key: any = '';
  export let type: string = '';
  export let message: any = {};
  export let className: string = null;
  export let onClick: Function = (evt) => {}
  export let registerkeyEvent: Function = (id, instance) => {}

  let uncachedThumbnails;
  let hasAvatar: bool = false;
  let avatarSrc: string = '';
  let justifyContent: string = 'start';

  let navOptions = {
    softkeyLeftListener: function(evt) {
      console.log('propagated softkeyLeftListener to:', message.id.toString());
    },
    softkeyRightListener: function(evt) {},
    enterListener: function(evt) {},
    backspaceListener: function(evt) {}
  };

  let navInstance = createKaiNavigator(navOptions);

  onMount(async () => {
    // todo render message.media if !null
    const user = await getAuthorizedUser();
    if (['group', 'user', 'bot'].indexOf(type) > -1) {
      if (user[0] == null) {
        hasAvatar = true;
        console.log('from sender');
      } else {
        if (message.sender.id.toString() === user[0].id.toString()) {
          hasAvatar = false;
          justifyContent = 'end';
          console.log('from self');
        } else {
          hasAvatar = true;
          console.log('from sender');
        }
      }
    } else {
      hasAvatar = false;
    }
    registerkeyEvent(message.id.toString(), navInstance);
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

<div data-key="{key}" class="kai-list-view {className ? className : ''}" on:click={onClick} style="justify-content:{type === 'channel' ? 'start' : justifyContent};min-height:{hasAvatar ? '50px' : '0px'};">
  {#if hasAvatar }{@html avatarSrc}{/if}
  <div class="kai-list-view-content" style="margin-left:{hasAvatar ? '45px' : '0px'};">
    {#if hasAvatar }<b>{message.sender.firstName}</b>{/if}
    <p>{message.message || 'WIP'}</p>
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
    max-height: 100px;
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
    max-width: calc(100% - 80px);
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
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    display: table-cell;
    vertical-align: middle;
  }

  .kai-list-view.focus,
  .kai-list-view.focus > .kai-list-view-content {
    background-color: var(--themeColorTransparent);
  }
</style>
